import { describe, expect, it } from 'vitest';
import { ALL_GEAR, calcBuild, decodeBuild, encodeBuild, evalRatio, fitsSlot, gearById, classFits, maxOptionsFor, mobbedFlee, optionRangeText, type Build, type Target } from './build-calc';

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

describe('passives, buffs, skills, option ranges', () => {
  const mob: Target = {
    name: 'Test', level: 40, vit: 20, def: 30, size: 'Medium', element: 'Earth', element_level: 1, race: 'Brute', boss: false,
    hit_100: 250, flee_95: 280, hp: 5000, mdef: 10, int: 10,
  };

  it("counts a passive at the level given: Owl's Eye", () => {
    const off = calcBuild({ ...base, cls: 'archer' });
    const on = calcBuild({ ...base, cls: 'archer', sk: { "Owl's Eye": 10 } });
    expect(off.skills).toContain("Owl's Eye");
    expect(on.total.dex - off.total.dex).toBe(10);
  });

  it('uses the second-job value of Improve Dodge on an Assassin', () => {
    const thief = calcBuild({ ...base, cls: 'thief', sk: { 'Improve Dodge': 10 } });
    const sin = calcBuild({ ...base, cls: 'assassin', sk: { 'Improve Dodge': 10 } });
    expect(thief.flee - calcBuild({ ...base, cls: 'thief' }).flee).toBe(30);
    expect(sin.flee - calcBuild({ ...base, cls: 'assassin' }).flee).toBe(40);
  });

  it("raises HIT by a percent: Vulture's Eye with a bow", () => {
    const bow = first((g) => g.wt === 'bow');
    const plain = calcBuild({ ...base, cls: 'archer', g: { weapon: { id: bow, r: 0, c: [] } } });
    const eye = calcBuild({ ...base, cls: 'archer', g: { weapon: { id: bow, r: 0, c: [] } }, sk: { "Vulture's Eye": 10 } });
    expect(eye.hit).toBe(Math.floor(plain.hit * 1.1));
  });

  it('counts a weapon mastery only with that weapon', () => {
    const bare = calcBuild({ ...base, cls: 'thief', sk: { 'Sword Mastery': 10 } }, mob);
    expect(bare.skipped.some((l) => l.from.includes('Sword Mastery'))).toBe(true);
    const knife = calcBuild({ ...base, cls: 'thief', g: { weapon: { id: 1201, r: 0, c: [0, 0, 0] } } }, mob);
    const knifeM = calcBuild({ ...base, cls: 'thief', g: { weapon: { id: 1201, r: 0, c: [0, 0, 0] } }, sk: { 'Sword Mastery': 10 } }, mob);
    expect(knifeM.vs!.damage! - knife.vs!.damage!).toBe(40);
  });

  it('counts buffs: Blessing 10 and Increase Agility 10', () => {
    const plain = calcBuild({ ...base });
    const blessed = calcBuild({ ...base, bf: { blessing: 10 } });
    expect(blessed.total.str - plain.total.str).toBe(10);
    expect(blessed.hit - plain.hit).toBe(30); // DEX +10 and HIT +20
    const agi = calcBuild({ ...base, bf: { 'increase-agility': 10 } });
    expect(agi.total.agi - plain.total.agi).toBe(12);
    expect(agi.aspd!).toBeGreaterThan(plain.aspd!);
  });

  it('says how long auto-attacks and a skill take to kill', () => {
    const b: Build = { ...base, cls: 'assassin', lv: 60, st: { ...base.st, str: 60, dex: 40 }, g: { weapon: { id: 1201, r: 0, c: [0, 0, 0] } }, as: ['sonic-blow', 10] };
    const r = calcBuild(b, mob);
    expect(r.vs!.autoHits).toBe(Math.ceil(5000 / r.vs!.damage!));
    expect(r.vs!.autoSeconds).toBeGreaterThan(0);
    // Sonic Blow 10: 200 + slv × 100 = 1200%.
    expect(r.vs!.skill).toMatchObject({ name: 'Sonic Blow', level: 10, ratio: 1200, kind: 'atk' });
    expect(r.vs!.skill!.damage).toBeGreaterThan(r.vs!.damage! * 5);
    expect(r.vs!.skill!.casts).toBe(Math.ceil(5000 / r.vs!.skill!.damage));
  });

  it('works out magic by element: Fire Bolt hits an Earth monster harder than a Water one', () => {
    const b: Build = { ...base, cls: 'mage', lv: 60, st: { ...base.st, int: 70, dex: 40 }, as: ['fire-bolt', 10] };
    const earth = calcBuild(b, mob).vs!.skill!;
    const water = calcBuild(b, { ...mob, element: 'Water' }).vs!.skill!;
    expect(earth.kind).toBe('matk');
    expect(earth.hits).toBe(10);
    expect(earth.damage).toBeGreaterThan(water.damage);
    expect(earth.castSeconds).toBeGreaterThan(0);
  });

  it('only evaluates plain arithmetic in a skill formula', () => {
    expect(evalRatio('100 + slv * 30', { slv: 10 })).toBe(400);
    expect(evalRatio('floor((230 * slv + agi * 3) * base_level / 100)', { slv: 10, agi: 90, base_level: 60 })).toBe(1542);
    expect(evalRatio('alert(1)', {})).toBeNull();
    expect(evalRatio('constructor', {})).toBeNull();
  });

  it('gives the roll range of an option for the slot', () => {
    const knife = gearById(1201)!;
    expect(optionRangeText('atk', 'weapon', knife)).toContain('ดรอปมอน');
    expect(optionRangeText('atk', 'accessory_1', null)).toBeNull();
    expect(maxOptionsFor('weapon')).toBe(4);
    expect(maxOptionsFor('accessory_1')).toBe(2);
  });

  it('keeps buffs and the attack skill through a share link', () => {
    const b: Build = { ...base, cls: 'assassin', bf: { blessing: 10, nope: 3 }, as: ['sonic-blow', 7] };
    const back = decodeBuild(encodeBuild(b))!;
    expect(back.bf).toEqual({ blessing: 10 });
    expect(back.as).toEqual(['sonic-blow', 7]);
  });
});

describe('buffs read from the skill text', () => {
  const mob: Target = {
    name: 'Test', level: 40, vit: 20, def: 30, size: 'Large', element: 'Shadow', element_level: 1, race: 'Demon', boss: false,
    hit_100: 250, flee_95: 280, hp: 5000, mdef: 10, int: 10,
  };
  const knife = { weapon: { id: 1201, r: 0, c: [0, 0, 0] } };

  it('Gloria gives LUK +30', () => {
    expect(calcBuild({ ...base, bf: { gloria: 5 } }).total.luk - calcBuild({ ...base }).total.luk).toBe(30);
  });

  it('Aspersio makes the weapon holy: more damage on a shadow monster', () => {
    const plain = calcBuild({ ...base, g: knife }, mob).vs!.damage!;
    const holy = calcBuild({ ...base, g: knife, bf: { aspersio: 5 } }, mob).vs!.damage!;
    expect(holy).toBeGreaterThan(plain);
  });

  it('Weapon Perfection removes the dagger size penalty on a large monster', () => {
    const plain = calcBuild({ ...base, g: knife }, mob).vs!.damage!;
    const perfect = calcBuild({ ...base, g: knife, bf: { 'weapon-perfection': 5 } }, mob).vs!.damage!;
    expect(perfect).toBeGreaterThan(plain);
  });

  it('Rising Dragon raises MaxHP by its level in percent', () => {
    const plain = calcBuild({ ...base, cls: 'monk' }).hp!;
    expect(calcBuild({ ...base, cls: 'monk', bf: { 'rising-dragon': 10 } }).hp).toBe(Math.floor(plain * 1.1));
  });
});

describe('mobbing, ailments, damage roll, potions', () => {
  const mob: Target = {
    name: 'Test', level: 40, vit: 20, def: 30, size: 'Medium', element: 'Fire', element_level: 1, race: 'Brute', boss: false,
    hit_100: 400, flee_95: 280, hp: 5000, mdef: 20, int: 10,
  };

  it('cuts FLEE by 10% per attacker from the third', () => {
    expect(mobbedFlee(200, 1)).toBe(200);
    expect(mobbedFlee(200, 2)).toBe(200);
    expect(mobbedFlee(200, 3)).toBe(180);
    expect(mobbedFlee(200, 5)).toBe(140);
    const flee = calcBuild({ ...base }).flee;
    const near = { ...mob, flee_95: flee + 10 }; // 85% dodge alone
    const one = calcBuild({ ...base }, near).vs!;
    const four = calcBuild({ ...base, mob: 4 }, near).vs!;
    expect(four.fleeMobbed).toBe(mobbedFlee(flee, 4));
    expect(four.dodge!).toBeLessThan(one.dodge!);
  });

  it('a frozen monster is always hit, Water 1, with half its DEF', () => {
    const b: Build = { ...base, g: { weapon: { id: 1201, r: 0, c: [0, 0, 0] } } };
    const plain = calcBuild(b, mob).vs!;
    expect(plain.hitChance).toBeLessThan(100);
    const frozen = calcBuild({ ...b, ail: 'freeze' }, mob).vs!;
    expect(frozen.hitChance).toBe(100);
    const water = calcBuild(b, { ...mob, element: 'Water', def: 15 }).vs!;
    expect(frozen.damage).toBe(water.damage);
    expect(calcBuild({ ...b, ail: 'stun' }, mob).vs!.damage).toBe(plain.damage);
  });

  it('rolls weapon ATK ±5% per weapon level', () => {
    const [id] = Object.entries(ALL_GEAR).find(([, g]) => g.on.includes('weapon') && (g.wl ?? 0) >= 3 && (g.atk ?? 0) >= 100 && g.cls?.includes('swordsman'))!;
    const r = calcBuild({ ...base, g: { weapon: { id: Number(id), r: 0, c: [] } } }, mob).vs!;
    expect(r.damageMin!).toBeLessThan(r.damage!);
    expect(r.damageMax!).toBeGreaterThan(r.damage!);
    const knife = calcBuild({ ...base, g: { weapon: { id: 1201, r: 0, c: [0, 0, 0] } } }, mob).vs!;
    expect(knife.damageMin).toBe(knife.damage); // 17 ATK × 5%: rounds to no roll
  });

  it('potions heal 2% more per VIT', () => {
    const r = calcBuild({ ...base, st: { ...base.st, vit: 50 } });
    expect(r.potionRate.hp).toBe(100 + r.total.vit * 2);
  });

  it('keeps mob and ailment through a share link', () => {
    const b = decodeBuild(encodeBuild({ ...base, mob: 5, ail: 'stone' }))!;
    expect(b.mob).toBe(5);
    expect(b.ail).toBe('stone');
    expect(decodeBuild(encodeBuild({ ...base, mob: 99, ail: 'x' as never }))!.mob).toBe(10);
  });
});
