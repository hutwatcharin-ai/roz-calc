import copy
import os
import sys
import unittest

from PIL import Image, ImageChops

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import ro_sprite  # noqa: E402
from ro_sprite import Spr, Act  # noqa: E402
from dressup import part, reference  # noqa: E402

GRF = 'D:/Data grf roz/data_grf_extracted/files/data'
NEW = 'D:/Data grf roz/grf-2026-10-15-sprites/files/data'


def src(path):
    newer = NEW + path[len(GRF):]
    return newer if os.path.exists(newer) else path


BODY = f'{GRF}/sprite/인간족/몸통/남/초보자_남'
HEAD = f'{GRF}/sprite/인간족/머리통/남/1_남'


def load(base):
    return Spr(src(base + '.spr')), Act(src(base + '.act'))


class PartTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.body = load(BODY)
        cls.head = load(HEAD)

    def test_export_keeps_only_kept_types(self):
        _, meta = part.export_part(*self.body)
        want = {str(t * 8 + d) for t in part.KEPT_TYPES for d in range(8)}
        self.assertEqual(set(meta['acts']), want)

    def test_atlas_rects_hold_the_pictures(self):
        spr, act = self.body
        atlas, meta = part.export_part(spr, act)
        self.assertEqual(atlas.size, (meta['w'], meta['h']))
        self.assertLessEqual(atlas.width, 512)
        layers, _, _ = meta['acts']['0'][0]
        frame = act.actions[0][0]
        drawn = [l for l in frame['layers'] if spr.image(l['spr'], l['kind']) is not None and l['spr'] >= 0]
        self.assertEqual(len(layers), len(drawn))
        self.assertTrue(layers)
        for entry, l in zip(layers, drawn):
            x, y, ax, ay, aw, ah = entry[:6]
            want = spr.image(l['spr'], l['kind'])
            got = atlas.crop((ax, ay, ax + aw, ay + ah))
            self.assertEqual(got.tobytes(), want.tobytes())
            self.assertEqual((x, y), (l['x'], l['y']))

    def test_reference_matches_ro_sprite_render(self):
        parts = [(*self.body, False), (*self.head, True)]
        got = reference.render(parts, 0, [0, 0])
        want = ro_sprite.render(parts, 0, 0)
        self.assertEqual(got.tobytes(), want.tobytes())

    def test_export_omits_missing_actions(self):
        spr, act = self.body
        short = copy.copy(act)
        short.actions = act.actions[:3]
        short.delays = act.delays[:3]
        _, meta = part.export_part(spr, short)
        self.assertEqual(set(meta['acts']), {'0', '1', '2'})
        self.assertEqual(set(meta['delay']), {'0', '1', '2'})

    def test_z_of_is_baked_per_frame(self):
        _, meta = part.export_part(*self.body, z_of=lambda a, f: a * 10 + f)
        self.assertEqual(meta['acts']['4'][1][2], 41)
        self.assertEqual(meta['acts']['0'][2][2], 2)
        _, plain = part.export_part(*self.body)
        self.assertEqual({fr[2] for frames in plain['acts'].values() for fr in frames}, {0})

    def test_reference_sorts_by_z_stable(self):
        body_spr, body_act = self.body
        head_spr, head_act = self.head
        # head below the body: drawn first, still anchored on the body (parts[0])
        got = reference.render([(body_spr, body_act, False, lambda a, f: 10),
                                (head_spr, head_act, True, lambda a, f: 5)], 0, [0, 0])
        want = Image.new('RGBA', (200, 200))
        bf, hf = body_act.actions[0][0], head_act.actions[0][0]
        shift = (bf['anchors'][0][0] - hf['anchors'][0][0], bf['anchors'][0][1] - hf['anchors'][0][1])
        ro_sprite.draw_layers(want, (100, 150), head_spr, hf, shift)
        ro_sprite.draw_layers(want, (100, 150), body_spr, bf)
        self.assertEqual(got.tobytes(), want.tobytes())
        self.assertNotEqual(got.tobytes(), reference.render([(*self.body, False), (*self.head, True)], 0, [0, 0]).tobytes())
        # equal z keeps list order
        same = reference.render([(body_spr, body_act, False, lambda a, f: 7),
                                 (head_spr, head_act, True, lambda a, f: 7)], 0, [0, 0])
        self.assertEqual(same.tobytes(), ro_sprite.render([(*self.body, False), (*self.head, True)], 0, 0).tobytes())

    def test_reference_missing_action_uses_action_0_z(self):
        spr, act = self.head
        short = copy.copy(act)
        short.actions = act.actions[:1]
        seen = []
        reference.render([(*self.body, False), (spr, short, True, lambda a, f: seen.append((a, f)) or 0)], 4, [0, 1])
        self.assertEqual(seen, [(0, 1)])

    def test_apply_palette_changes_pixels(self):
        spr = Spr(src(f'{GRF}/sprite/인간족/머리통/남/1_남.spr'))
        p0 = part.apply_palette(spr, f'{GRF}/palette/머리/머리1_남_0.pal')
        p3 = part.apply_palette(spr, f'{GRF}/palette/머리/머리1_남_3.pal')
        diff = 0
        for a, b in zip(p0.pal_images, p3.pal_images):
            self.assertEqual(a.getchannel('A').tobytes(), b.getchannel('A').tobytes())
            diff += sum(1 for u, v in zip(a.getdata(), b.getdata()) if u != v)
        self.assertGreaterEqual(diff, 1)

    def test_cloth_zero_rule(self):
        spr = self.body[0]
        pal0 = f'{GRF}/palette/몸/초보자_남_0.pal'
        with open(pal0, 'rb') as f:
            raw = f.read()
        file_pal = [tuple(raw[i * 4:i * 4 + 3]) for i in range(256)]
        # Measured: the Novice body's own palette is byte-equal to palette/몸/초보자_남_0.pal
        # (both hold), so colour 0 needs no palette file: CLOTH_ZERO = 'own'.
        self.assertEqual(spr.pal, file_pal)
        self.assertEqual(part.CLOTH_ZERO, 'own')
        recoloured = part.apply_palette(spr, pal0)
        for a, b in zip(spr.pal_images, recoloured.pal_images):
            self.assertEqual(a.tobytes(), b.tobytes())


if __name__ == '__main__':
    unittest.main()
