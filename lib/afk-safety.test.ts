import { describe, it, expect } from 'vitest';
import { afkVerdict, riskySkills, skillRisk } from './afk-safety';

describe('skillRisk', () => {
  it('flags the four things that break an unattended bot', () => {
    expect(skillRisk('NPC_SUMMONSLAVE')).toBe('summons');
    expect(skillRisk('NPC_CALLSLAVE')).toBe('summons');
    expect(skillRisk('NPC_SELFDESTRUCTION')).toBe('explodes');
    expect(skillRisk('NPC_METAMORPHOSIS')).toBe('transforms');
    expect(skillRisk('NPC_STUNATTACK')).toBe('locks');
    expect(skillRisk('MG_FROSTDIVER')).toBe('locks');
    expect(skillRisk('HT_ANKLESNARE')).toBe('locks');
  });

  it('leaves a skill unclassified when its name does not say what it does', () => {
    // NPC_EMOTION is widely said to change a monster's mode, which would matter
    // more than anything else on this page. Our rows carry no value column to
    // show it, so flagging it would be repeating a rumour as data.
    expect(skillRisk('NPC_EMOTION')).toBeNull();
    expect(skillRisk('NPC_EMOTION_ON')).toBeNull();
    expect(skillRisk('AL_HEAL')).toBeNull();
    expect(skillRisk('NPC_FIREATTACK')).toBeNull();
  });
});

describe('riskySkills', () => {
  it('reports each risky skill once and drops the rest', () => {
    expect(
      riskySkills(['NPC_EMOTION', 'NPC_SUMMONSLAVE', 'NPC_SUMMONSLAVE', 'MG_FIREBOLT', 'NPC_STUNATTACK']),
    ).toEqual([
      { skillName: 'NPC_SUMMONSLAVE', risk: 'summons' },
      { skillName: 'NPC_STUNATTACK', risk: 'locks' },
    ]);
  });

  it('returns nothing for a monster with no risky skill', () => {
    expect(riskySkills(['NPC_EMOTION', 'AL_TELEPORT'])).toEqual([]);
  });
});

describe('afkVerdict', () => {
  // The user's own character on 7 Sep 2026: FLEE 267, HIT 290, 400 a hit.
  const me = { flee: 267, hit: 290, damagePerHit: 400 };
  const eclipse = { hp: 1168, flee95: 249, hit100: 273, isAggressive: false, mapAggroCount: 0 };

  it('passes a Lv 34 monster the old one-hit rule threw away', () => {
    const v = afkVerdict({ style: 'melee', monster: eclipse, me, maxHits: 5 });
    expect(v.ok).toBe(true);
    expect(v.theirHitPct).toBe(5); // 5 + 249 - 267 clamps to the floor
    expect(v.myHitPct).toBe(100); // 100 + 290 - 273 clamps to the ceiling
    expect(v.hits).toBe(3);
    expect(v.dodgeCap).toBe(20);
  });

  it('holds a passive monster to one hit in five', () => {
    // flee_95 282 -> 5 + 282 - 267 = 20: right at the cap, allowed.
    expect(afkVerdict({ style: 'melee', monster: { ...eclipse, flee95: 282 }, me, maxHits: 5 }).ok).toBe(true);
    const v = afkVerdict({ style: 'melee', monster: { ...eclipse, flee95: 283 }, me, maxHits: 5 });
    expect(v.ok).toBe(false);
    expect(v.fails).toEqual(['dodge']);
  });

  it('holds an aggressive monster, a map with aggressive neighbours, and a caster to one in ten', () => {
    const near = { ...eclipse, flee95: 280 }; // 18%: fine relaxed, not strict
    expect(afkVerdict({ style: 'melee', monster: near, me, maxHits: 5 }).ok).toBe(true);
    expect(afkVerdict({ style: 'melee', monster: { ...near, isAggressive: true }, me, maxHits: 5 }).fails).toEqual(['dodge']);
    expect(afkVerdict({ style: 'melee', monster: { ...near, mapAggroCount: 2 }, me, maxHits: 5 }).fails).toEqual(['dodge']);
    expect(afkVerdict({ style: 'magic', monster: near, me, maxHits: 5 }).fails).toEqual(['dodge']);
  });

  it('wants us to land 80% for melee, and never checks hit for magic', () => {
    const slippery = { ...eclipse, hit100: 311 }; // 100 + 290 - 311 = 79
    expect(afkVerdict({ style: 'melee', monster: slippery, me, maxHits: 5 }).fails).toEqual(['hit']);
    expect(afkVerdict({ style: 'melee', monster: { ...eclipse, hit100: 310 }, me, maxHits: 5 }).ok).toBe(true);
    const magic = afkVerdict({ style: 'magic', monster: slippery, me: { ...me, hit: null }, maxHits: 5 });
    expect(magic.ok).toBe(true);
    expect(magic.myHitPct).toBe(100);
  });

  it('caps the fight length, and the cap belongs to the caller', () => {
    const tanky = { ...eclipse, hp: 2001 }; // 6 hits of 400
    expect(afkVerdict({ style: 'melee', monster: tanky, me, maxHits: 5 }).fails).toEqual(['hits']);
    expect(afkVerdict({ style: 'melee', monster: tanky, me, maxHits: 6 }).ok).toBe(true);
  });

  it('fails, not passes, when a threshold it needs is missing', () => {
    expect(afkVerdict({ style: 'melee', monster: { ...eclipse, flee95: null }, me, maxHits: 5 }).fails).toEqual(['unknown_flee']);
    expect(afkVerdict({ style: 'melee', monster: { ...eclipse, hit100: null }, me, maxHits: 5 }).fails).toEqual(['unknown_hit']);
    expect(afkVerdict({ style: 'melee', monster: eclipse, me: { ...me, hit: null }, maxHits: 5 }).fails).toEqual(['unknown_hit']);
    expect(afkVerdict({ style: 'melee', monster: { ...eclipse, hp: 0 }, me, maxHits: 5 }).fails).toEqual(['unknown_hp']);
  });
});
