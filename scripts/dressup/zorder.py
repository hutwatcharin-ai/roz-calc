"""Draw order (z) of every dress-up part, per direction and frame, from the client's own tables.

z_for(kind, view, job, sex, action, frame) -> int; a higher z draws later.

Scale: every value is the plan's z times SCALE (100), so a headgear's client priority offset
(e.g. 143 = mid band + 43) fits between two slots without floats. Base z (x SCALE):
  facing away (d = action % 8 in 2..5): body 15, head 20, acc lower/mid/upper 22/23/24, weapon 28, robe 5
  otherwise:                            body 10, head 15, acc 17/18/19,              weapon 23, robe 5

Client rules (see task-4-report.md for the evidence):
  robe  IsTopLayer(view) (spriterobename_f) takes ONE argument and is plain membership of
        RobeTopLayer (a flat list, no direction). Whether a robe is drawn over the body is the
        client's _New_DrawOnTop(view, sex, job, action, frame) (spreditinfo/_new_2dlayerdir_f +
        _new_{big,small}layerdir_{male,female}): it lists, per job and action, the frames where
        the robe goes BEHIND the body. Behind: robe 5. Over: body + 1, or head + 1 for a
        RobeTopLayer robe facing away.
  acc   TB_Layer_Priority via the client's GetLayerPriority(direction, layer, view): Direction[d],
        else Default, else the slot default. Band = value // 100: 1 mid, 2 upper, 3 lower, 4 robe;
        the rest (value - band * 100) ranks it inside the band. Values under 100 rank below the
        mids (one item: 53).
  imf   imf/<job>_<sex>.imf: layer 0 = body, layer 1 = head; where the head's priority is above
        the body's (both 0/1) the head is drawn first: head z = body z - 1, and headgear
        moves with it (between the head and the body, order kept: _follow_head).
`frame` is the BODY's frame index; part_z_of() maps a part's own frame onto it.
"""
import functools
import os
import struct
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
import lub  # noqa: E402
from ro_sprite import Act  # noqa: E402

GRF = 'D:/Data grf roz/data_grf_extracted/files/data'
# Newer copies first: every GrfDiffTool snapshot, newest first (found at run
# time by scripts/grf_snapshots.py, so a new patch changes no line here and the
# exporter does not re-export every part for it), then the 15 Oct extractions.
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from grf_snapshots import weekly_roots  # noqa: E402
NEWER = (*weekly_roots(), 'D:/Data grf roz/grf-2026-10-15-sprites/files/data', 'D:/Data grf roz/grf-2026-10-15/files/data')
LUA = f'{GRF}/luafiles514/lua files'
SCALE = 100

KINDS = ('body', 'head', 'acc_lower', 'acc_mid', 'acc_upper', 'robe', 'weapon')
BASE_TOWARDS = dict(body=10, head=15, acc_lower=17, acc_mid=18, acc_upper=19, weapon=23, robe=5)
BASE_AWAY = dict(body=15, head=20, acc_lower=22, acc_mid=23, acc_upper=24, weapon=28, robe=5)
# GetLayerPriority's `layer` argument: 2 bottom, 3 top, 4 mid (8 robe).
LAYER_CODE = dict(acc_lower=2, acc_upper=3, acc_mid=4)
BAND_SLOT = {1: 'acc_mid', 2: 'acc_upper', 3: 'acc_lower', 4: 'robe'}
SEX_ID = {'m': 1, '남': 1, 'f': 0, '여': 0}  # _new_2dlayerdir_f: SEX_FEMALE 0, SEX_MALE 1
SEX_KR = {'m': '남', '남': '남', 'f': '여', '여': '여'}
# Body sprite name -> JOBID name (skillinfoz/jobinheritlist.lub). The sprite names live in the exe, not in a table.
JOB_NAMES = {
    '초보자': 'JT_NOVICE', '검사': 'JT_SWORDMAN', '마법사': 'JT_MAGICIAN', '궁수': 'JT_ARCHER',
    '성직자': 'JT_ACOLYTE', '상인': 'JT_MERCHANT', '도둑': 'JT_THIEF', '기사': 'JT_KNIGHT',
    '프리스트': 'JT_PRIEST', '위저드': 'JT_WIZARD', '제철공': 'JT_BLACKSMITH', '헌터': 'JT_HUNTER',
    '어세신': 'JT_ASSASSIN', '크루세이더': 'JT_CRUSADER', '몽크': 'JT_MONK', '세이지': 'JT_SAGE',
    '로그': 'JT_ROGUE', '연금술사': 'JT_ALCHEMIST', '바드': 'JT_BARD', '무희': 'JT_DANCER',
    '슈퍼노비스': 'JT_SUPERNOVICE',
    # High class bodies: the outfits the game sells to 2nd classes.
    '로드나이트': 'JT_KNIGHT_H', '하이프리': 'JT_PRIEST_H', '하이위저드': 'JT_WIZARD_H', '화이트스미스': 'JT_BLACKSMITH_H',
    '스나이퍼': 'JT_HUNTER_H', '어쌔신크로스': 'JT_ASSASSIN_H', '팔라딘': 'JT_CRUSADER_H', '챔피온': 'JT_MONK_H',
    '프로페서': 'JT_SAGE_H', '스토커': 'JT_ROGUE_H', '크리에이터': 'JT_ALCHEMIST_H', '클라운': 'JT_BARD_H',
    '집시': 'JT_DANCER_H',
    # Mounted bodies: the rider and the animal in one sprite.
    '노비스포링': 'JT_PORING_NOVICE', '페코검사': 'JT_PECO_SWORD', '여우마법사': 'JT_FOX_MAGICIAN',
    '타조궁수': 'JT_OSTRICH_ARCHER', '복사알파카': 'JT_SHEEP_ACO', '상인멧돼지': 'JT_PIG_MERCHANT',
    '켈베로스도둑': 'JT_DOG_THIEF', '페코페코_기사': 'JT_CHICKEN', '프리스트알파카': 'JT_SHEEP_PRIEST',
    '여우위저드': 'JT_FOX_WIZ', '제철공멧돼지': 'JT_PIG_BLACKSMITH', '타조헌터': 'JT_OSTRICH_HUNTER',
    '켈베로스어쎄신': 'JT_DOG_ASSASSIN', '신페코크루세이더': 'JT_CHICKEN2', '몽크알파카': 'JT_SHEEP_MONK',
    '여우세이지': 'JT_FOX_SAGE', '켈베로스로그': 'JT_DOG_ROGUE', '연금술사멧돼지': 'JT_PIG_ALCHE',
    '타조바드': 'JT_OSTRICH_BARD', '타조무희': 'JT_OSTRICH_DANCER', '로드페코': 'JT_CHICKEN_H',
    '페코팔라딘': 'JT_CHICKEN2_H', '켈베로스어쎄신크로스': 'JT_DOG_ASSA_X', '켈베로스스토커': 'JT_DOG_STALKER',
    '하이프리스트알파카': 'JT_SHEEP_HPRIEST', '챔피온알파카': 'JT_SHEEP_CHAMP', '여우하이위저드': 'JT_FOX_HWIZ',
    '여우프로페서': 'JT_FOX_PROF', '화이트스미스멧돼지': 'JT_PIG_WHITESMITH', '크리에이터멧돼지': 'JT_PIG_CREATOR',
    '타조스나이퍼': 'JT_OSTRICH_SNIPER', '타조크라운': 'JT_OSTRICH_CROWN', '타조짚시': 'JT_OSTRICH_ZIPSI',
}


def src(path):
    """The newest copy of a client file."""
    if path.startswith(GRF):
        for root in NEWER:
            newer = root + path[len(GRF):]
            if os.path.exists(newer):
                return newer
    return path


LUA_FILES = (
    'skillinfoz/jobinheritlist.lub',  # defines JOBID, which the spreditinfo tables are keyed by
    'datainfo/accessoryid.lub', 'datainfo/tb_layer_priority.lub',
    'datainfo/spriterobeid.lub', 'datainfo/spriterobename.lub', 'datainfo/spriterobename_f.lub',
    'spreditinfo/2dlayerdir_f.lub',  # defines GetLayerSizeType, used by the _New_ functions
    'spreditinfo/_new_2dlayerdir_f.lub',
    'spreditinfo/_new_biglayerdir_male.lub', 'spreditinfo/_new_biglayerdir_female.lub',
    'spreditinfo/_new_smalllayerdir_male.lub', 'spreditinfo/_new_smalllayerdir_female.lub',
)


@functools.lru_cache(maxsize=None)
def lua():
    L = lub.runtime()
    for f in LUA_FILES:
        err = lub.load(L, src(f'{LUA}/{f}'))
        assert err is None, (f, err)
    return L


def job_id(job):
    return int(lua().globals()[b'JOBID'][JOB_NAMES[job].encode()])


def facing_away(action):
    return 2 <= action % 8 <= 5


def is_top_layer(view):
    return bool(lua().globals()[b'IsTopLayer'](view))


def robe_on_top(view, job, sex, action, frame):
    on_top, _job = lua().globals()[b'_New_DrawOnTop'](view, SEX_ID[sex], job_id(job), action, frame)
    return bool(on_top)


def layer_priority(view, d, kind):
    return int(lua().globals()[b'GetLayerPriority'](d, LAYER_CODE[kind], view))


@functools.lru_cache(maxsize=None)
def imf(job, sex):
    """[layer][action][frame] -> priority, or None when the job has no imf file."""
    path = src(f'{GRF}/imf/{job}_{SEX_KR[sex]}.imf')
    if not os.path.exists(path):
        return None
    with open(path, 'rb') as fh:
        data = fh.read()
    _version, _checksum, max_layer = struct.unpack_from('<fii', data, 0)
    pos = 12
    layers = []
    for _ in range(max_layer + 1):
        (n_act,) = struct.unpack_from('<i', data, pos)
        pos += 4
        acts = []
        for _ in range(n_act):
            (n_frame,) = struct.unpack_from('<i', data, pos)
            pos += 4
            acts.append([struct.unpack_from('<iii', data, pos + 12 * i)[0] for i in range(n_frame)])
            pos += 12 * n_frame
        layers.append(acts)
    if pos != len(data):
        raise ValueError(f'{path}: {len(data) - pos} trailing bytes')
    return layers


def head_behind_body(job, sex, action, frame):
    t = imf(job, sex)
    if t is None or len(t) < 2:
        return False
    try:
        return t[1][action][frame] > t[0][action][frame]
    except IndexError:
        return False


def _base(kind, action):
    return (BASE_AWAY if facing_away(action) else BASE_TOWARDS)[kind]


def _follow_head(z, action):
    """A headgear z when the imf puts the head behind the body: headgear is drawn with the head,
    so it keeps its order among the headgear but is squeezed into the gap between the moved head
    ((body - 1) * SCALE) and the body (body * SCALE). The usual headgear range, head + 2 .. head
    + 5 slots (lower band rank 0 .. upper band rank 99), maps monotonically onto head + 1 .. + 98."""
    head = _base('head', action) * SCALE
    lo, hi = head + 2 * SCALE, head + 5 * SCALE
    offset = min(max(z, lo), hi - 1) - lo
    return (_base('body', action) - 1) * SCALE + 1 + offset * 98 // (hi - lo)


def z_for(kind, view, job, sex, action, frame):
    if kind not in KINDS:
        raise ValueError(kind)
    if kind == 'head':
        if head_behind_body(job, sex, action, frame):
            return (_base('body', action) - 1) * SCALE
        return _base('head', action) * SCALE
    if kind == 'robe':
        if view is None or not robe_on_top(view, job, sex, action, frame):
            return _base('robe', action) * SCALE
        if is_top_layer(view) and facing_away(action):
            return (_base('head', action) + 1) * SCALE
        return (_base('body', action) + 1) * SCALE
    if kind in LAYER_CODE:
        z, robe_band = _acc_z(kind, view, action, with_band=True)
        if not robe_band and head_behind_body(job, sex, action, frame):
            return _follow_head(z, action)
        return z
    return _base(kind, action) * SCALE


def _acc_z(kind, view, action, with_band=False):
    """A headgear's z from TB_Layer_Priority, before the imf rule."""
    if view is None:
        z, robe_band = _base(kind, action) * SCALE, False
    else:
        p = layer_priority(view, action % 8, kind)
        band = min(max(p // 100, 1), 4)
        rank = p - band * 100
        slot = BAND_SLOT[band]
        robe_band = slot == 'robe'
        if robe_band:
            # A headgear the client draws at the robe layer (vehicles, tents). It has no robe view
            # for _New_DrawOnTop, so it goes behind the body facing towards, over it facing away.
            base = _base('body', action) + 1 if facing_away(action) else _base('robe', action)
            z = base * SCALE + rank
        else:
            z = _base(slot, action) * SCALE + rank
    return (z, robe_band) if with_band else z


def z_baked(kind, view, job, sex, action, frame):
    """The z written into exported files. Head and headgear files are shared by every class, so
    they cannot carry the per-class imf rule; where it puts the head behind the body, the body
    (a per-class file) goes over the head and all its headgear instead, and a robe drawn over the
    body goes over that body. Drawing order is the same as z_for's (test_zorder.BakedZTest), except
    a robe-band headgear (vehicles) facing away on those frames, which stays under the body."""
    behind = kind in ('body', 'robe') and head_behind_body(job, sex, action, frame)
    lifted = (_base('head', action) + 5) * SCALE  # over the head + 2..4 headgear slots and ranks
    if kind == 'body':
        return lifted if behind else _base('body', action) * SCALE
    if kind == 'robe':
        z = z_for('robe', view, job, sex, action, frame)
        return lifted + SCALE if behind and z > _base('robe', action) * SCALE else z
    if kind == 'head':
        return _base('head', action) * SCALE
    if kind in LAYER_CODE:
        return _acc_z(kind, view, action)
    return z_for(kind, view, job, sex, action, frame)


@functools.lru_cache(maxsize=None)
def body_frames(job, sex):
    s = SEX_KR[sex]
    act = Act(src(f'{GRF}/sprite/인간족/몸통/{s}/{job}_{s}.act'))
    return [len(a) for a in act.actions]


def part_z_of(kind, view, job, sex, fn=None):
    """z_of(action, frame) for part.export_part: a part's own frame f is taken as body frame
    f % (body frames in that action), so a 24-frame robe keeps the body's beat. fn defaults to
    z_for (one class, as in the fixtures); the full export passes z_baked."""
    fn = fn or z_for
    counts = body_frames(job, sex)

    def z_of(action, frame):
        n = counts[action] if action < len(counts) else counts[0]
        return fn(kind, view, job, sex, action, frame % max(1, n))
    return z_of
