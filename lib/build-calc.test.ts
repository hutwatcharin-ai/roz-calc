import { describe, expect, it } from 'vitest';
import { ALL_GEAR, calcBuild, decodeBuild, encodeBuild, fitsSlot, gearById, classFits, type Build, type Target } from './build-calc';

const first = (test: (g: (typeof ALL_GEAR)[string]) => boolean) => Number(Object.entries(ALL_GEAR).find(([, g]) => test(g))![0]);
// Hood: a garment with a card slot and no effects of its own.
const GARMENT = 480414;

const base: Build = {
  cls: 'thief',
  lv: 50,
  job: 1,
  st: { str: 1, agi: 1, vit: 1, int: 1, dex: 1, luk: 1 },
  g: {},
  f: [],
};

describe('calcBuild status window', () => {
  it('follows the measured formulas with bare stats', () => {
    const r = calcBuild({ ...base, st: { str: 1, agi: 50, vit: 1, int: 1, dex: 40, luk: 30 } });
    // Job 1 adds nothing for a Thief.
    expect(r.hit).toBe(175 + 50 + 40 + 10);
    expect(r.flee).toBe(100 + 50 + 50 + 6);
    expect(r.crit).toBe(10.5);
    expect(r.pd).toBe(4);
    expect(r.used).toBeGreaterThan(0);
    expect(r.budget).toBeGreaterThan(r.used);
  });

  it('counts a weapon, its refine and cards', () => {
    const r = calcBuild({ ...base, g: { weapon: { id: 1201, r: 4, c: [4029, 4006, 0] } } });
    // Knife 17 ATK + weapon level 1 at +4 = 8.
    expect(r.atk.equip).toBe(17 + 8);
    // Wolf crit +1, Lunatic crit +1 and LUK +1.
    expect(r.total.luk).toBe(2);
    expect(r.crit).toBe(Math.floor((1 + 2 * 0.3 + 0.5) * 10) / 10 + 2);
    expect(r.counted.some((l) => l.from === 'Wolf Card')).toBe(true);
  });

  it('adds armour refine DEF', () => {
    const r = calcBuild({ ...base, g: { armor: { id: 2301, r: 4, c: [] } } });
    expect(r.def.hard).toBe(10 + 16);
  });

  it('skips lines whose refine is not reached, with the reason', () => {
    const r = calcBuild({ ...base, cls: 'priest', lv: 60, g: { weapon: { id: 26148, r: 6, c: [0] } } });
    expect(r.skipped.find((l) => l.why === 'ต้องตีบวก +7 ขึ้นไป')).toBeTruthy();
    // The −10% cast line always holds.
    expect(r.vct).toBeCloseTo(Math.max(0, 1 - Math.sqrt((2 * r.total.dex + r.total.int) / 530)) * 0.9);
    // A Priest wears Acolyte gear.
    expect(r.warnings.filter((w) => w.includes('อาชีพนี้ใส่ไม่ได้'))).toEqual([]);
  });

  it('never adds a text-only condition, and counts the combo once both cards are worn', () => {
    const one = calcBuild({ ...base, g: { garment: { id: GARMENT, r: 0, c: [4183] } } });
    expect(one.flee).toBe(100 + 50 + 1 + 0);
    expect(one.skipped.some((l) => l.from === 'Vagabond Wolf Card')).toBe(true);
    const both = calcBuild({ ...base, g: { weapon: { id: 1201, r: 0, c: [4029, 0, 0] }, garment: { id: GARMENT, r: 0, c: [4183] } } });
    expect(both.counted.some((l) => l.from.startsWith('เซ็ต '))).toBe(true);
  });

  it('counts only the larger of two foods for the same stat', () => {
    const r = calcBuild({ ...base, f: [12062, 12065] });
    expect(r.total.dex).toBe(1 + 5);
    expect(r.warnings.some((w) => w.includes('นับแค่อันที่มากกว่า'))).toBe(true);
  });

  it('warns past the stat budget', () => {
    const r = calcBuild({ ...base, lv: 1, st: { str: 99, agi: 1, vit: 1, int: 1, dex: 1, luk: 1 } });
    expect(r.warnings.some((w) => w.startsWith('ใช้แต้มเกิน'))).toBe(true);
  });
});

describe('against a monster', () => {
  const mob: Target = {
    name: 'Test', level: 40, vit: 20, def: 30, size: 'Medium', element: 'Water', element_level: 1, race: 'Fish', boss: false,
    hit_100: 300, flee_95: 280,
  };

  it('says how much HIT and FLEE are missing', () => {
    const r = calcBuild({ ...base, st: { str: 1, agi: 1, vit: 1, int: 1, dex: 40, luk: 1 } }, mob);
    expect(r.vs?.hitShort).toBe(300 - r.hit);
    expect(r.vs?.hitChance).toBe(100 + r.hit - 300);
    expect(r.vs?.fleeShort).toBe(280 - r.flee);
    expect(r.vs?.damage).toBeGreaterThan(0);
  });

  it('raises damage only for a matching race line', () => {
    const plain = calcBuild({ ...base, g: { weapon: { id: 1201, r: 0, c: [0, 0, 0] } } }, mob);
    expect(plain.vs?.multiplier).toBe(1);
  });
});

describe('gear rules', () => {
  it('lets second classes wear first-class gear', () => {
    expect(classFits('knight', ['swordsman'])).toBe(true);
    expect(classFits('wizard', ['swordsman'])).toBe(false);
    expect(classFits('novice', undefined)).toBe(true);
  });

  it('puts a two-slot accessory in either slot', () => {
    const mitten = gearById(2617)!;
    expect(fitsSlot(mitten, 'accessory_1')).toBe(true);
    expect(fitsSlot(mitten, 'accessory_2')).toBe(true);
    expect(fitsSlot(mitten, 'armor')).toBe(false);
  });

  it('warns about a shield with a two-handed weapon', () => {
    const bow = first((g) => g.wt === 'bow');
    const shield = first((g) => g.on[0] === 'shield');
    const r = calcBuild({ ...base, cls: 'archer', g: { weapon: { id: bow, r: 0, c: [] }, shield: { id: shield, r: 0, c: [] } } });
    expect(r.warnings).toContain('อาวุธสองมือใส่คู่กับโล่ไม่ได้');
  });
});

describe('enchants, options, costumes, skill levels', () => {
  it('counts an enchant stone on a piece', () => {
    const r = calcBuild({ ...base, g: { garment: { id: GARMENT, r: 0, c: [0], e: [4730] } } });
    expect(r.total.agi).toBe(1 + 1);
  });

  it('counts a costume stone and warns when it sits in the wrong costume slot', () => {
    const ok = calcBuild({ ...base, cos: { upper: [6638] } });
    expect(ok.total.agi).toBe(2);
    const wrong = calcBuild({ ...base, cos: { lower: [6638] } });
    expect(wrong.warnings.some((w) => w.includes('คอสตูมหัวล่าง'))).toBe(true);
  });

  it('counts a typed random option', () => {
    const r = calcBuild({ ...base, g: { garment: { id: GARMENT, r: 0, c: [0], o: [['hit', 7], ['damage_percent@race:brute', 5]] } } });
    expect(r.hit).toBe(175 + 50 + 1 + 0 + 7);
    expect(r.other.some((s) => s.type === 'damage_percent' && s.target === 'race:brute' && s.value === 5)).toBe(true);
  });

  it('counts a skill-scaled line only once the skill level is given', () => {
    const armor = { id: 2301, r: 0, c: [], e: [29413] };
    const without = calcBuild({ ...base, cls: 'assassin', g: { armor } });
    expect(without.skills).toContain('Grimtooth');
    expect(without.skipped.some((l) => l.why?.includes('Grimtooth'))).toBe(true);
    const withLv = calcBuild({ ...base, cls: 'assassin', g: { armor }, sk: { Grimtooth: 5 } });
    expect(withLv.crit - without.crit).toBe(25);
  });

  it('warns about an essence off the armour', () => {
    const r = calcBuild({ ...base, g: { garment: { id: GARMENT, r: 0, c: [0], e: [29413] } } });
    expect(r.warnings.some((w) => w.includes('Essence'))).toBe(true);
  });

  it('keeps them through a share link and drops what is not real', () => {
    const b: Build = { ...base, g: { armor: { id: 2301, r: 3, c: [], e: [29413, 999999], o: [['hit', 5], ['nope', 3]] } }, cos: { upper: [6638], lower: [6638] }, sk: { Grimtooth: 5 } };
    const back = decodeBuild(encodeBuild(b))!;
    expect(back.g.armor).toEqual({ id: 2301, r: 3, c: [], e: [29413], o: [['hit', 5]] });
    expect(back.cos).toEqual({ upper: [6638] });
    expect(back.sk).toEqual({ Grimtooth: 5 });
  });
});

describe('two weapons', () => {
  const mob: Target = {
    name: 'Test', level: 40, vit: 20, def: 30, size: 'Medium', element: 'Water', element_level: 1, race: 'Fish', boss: false,
    hit_100: 300, flee_95: 280,
  };
  const knife = { id: 1201, r: 0, c: [0, 0, 0] };

  it('lets an Assassin hold a second weapon and splits damage by mastery', () => {
    const one = calcBuild({ ...base, cls: 'assassin', g: { weapon: knife } }, mob);
    const two = calcBuild({ ...base, cls: 'assassin', g: { weapon: knife, shield: knife } }, mob);
    expect(two.warnings).toEqual([]);
    expect(two.skills).toEqual(expect.arrayContaining(['Righthand Mastery', 'Lefthand Mastery']));
    // No mastery: right keeps 50%, left 30%.
    expect(two.vs?.hands).toMatchObject({ rightPct: 50, leftPct: 30 });
    expect(two.vs?.hands?.right).toBe(Math.floor(one.vs!.damage! * 0.5));
    const maxed = calcBuild({ ...base, cls: 'assassin', g: { weapon: knife, shield: knife }, sk: { 'Righthand Mastery': 5, 'Lefthand Mastery': 5 } }, mob);
    expect(maxed.vs?.hands).toMatchObject({ rightPct: 100, leftPct: 80 });
    expect(maxed.vs?.hands?.right).toBe(one.vs!.damage);
    expect(maxed.vs!.damage!).toBeGreaterThan(one.vs!.damage!);
    // Renewal: the left dagger adds a quarter of its delay. Assassin dagger
    // base 154 → 46 delay → 11.5 ASPD less (both before the AGI/DEX part).
    expect(Math.round((one.aspd! - two.aspd!) * 10) / 10).toBeCloseTo(11.5, 0);
  });

  it('counts status ATK once in the left hand', () => {
    const strong = { ...base, cls: 'assassin', st: { ...base.st, str: 80 }, g: { weapon: knife, shield: knife }, sk: { 'Righthand Mastery': 5, 'Lefthand Mastery': 5 } };
    const r = calcBuild(strong, mob);
    // Same knife both hands: the left differs from the right by status ATK, not just by 80%.
    expect(r.vs!.hands!.left).toBeLessThan(Math.floor(r.vs!.hands!.right * 0.8));
  });

  it('refuses a left-hand weapon for another class', () => {
    const r = calcBuild({ ...base, cls: 'knight', g: { weapon: knife, shield: knife } }, mob);
    expect(r.warnings.some((w) => w.includes('มือซ้าย'))).toBe(true);
    expect(r.vs?.hands).toBeNull();
  });

  it('takes weapon cards in the left hand', () => {
    const r = calcBuild({ ...base, cls: 'assassin', g: { weapon: knife, shield: { id: 1201, r: 0, c: [4029, 0, 0] } } });
    expect(r.warnings).toEqual([]);
    expect(r.counted.some((l) => l.from === 'Wolf Card')).toBe(true);
  });
});

describe('share link', () => {
  it('round-trips a build', () => {
    const b: Build = { ...base, g: { weapon: { id: 1201, r: 7, c: [4029, 0, 0] } }, f: [12065] };
    expect(decodeBuild(encodeBuild(b))).toEqual({ ...b, siege: undefined });
  });

  it('drops what it cannot read', () => {
    expect(decodeBuild('not-a-build')).toBeNull();
    const b = decodeBuild(encodeBuild({ ...base, st: { ...base.st, str: 500 }, g: { weapon: { id: 99999999, r: 3, c: [] } } }));
    expect(b?.st.str).toBe(99);
    expect(b?.g.weapon).toBeUndefined();
  });
});

// The owner's Blacksmith, read off the in-game status window on 7 Oct 2026
// (naked, Base 60 / Job 60): every number the window shows.
describe('matches a real status window', () => {
  it("reproduces the owner's Blacksmith", () => {
    const r = calcBuild({
      cls: 'blacksmith', lv: 60, job: 60,
      st: { str: 1, agi: 62, vit: 1, int: 1, dex: 1, luk: 61 },
      g: {}, f: [],
      sk: { 'Hilt Binding': 1, 'Enlarge Weight Limit': 10 },
    });
    expect(r.total).toEqual({ str: 8, agi: 68, vit: 6, int: 6, dex: 11, luk: 67 });
    expect(r.budget - r.used).toBe(7);
    expect(r.atk.status).toBe(47);
    expect(r.matk.status).toBe(48);
    expect(r.hit).toBe(268);
    expect(r.flee).toBe(241);
    expect(r.pd).toBe(7);
    expect(Math.floor(r.crit)).toBe(21);
    expect(r.def.soft).toBe(46);
    expect(r.mdef.soft).toBe(24);
    expect(r.aspd).toBe(168);
    expect(r.hp).toBe(1840);
    expect(r.sp).toBe(231);
    expect(r.weight.cap).toBe(5030);
  });
});
