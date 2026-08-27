import { describe, it, expect } from 'vitest';
import { diesInOneHit, riskySkills, skillRisk } from './afk-safety';

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

describe('diesInOneHit', () => {
  it('is true only when one hit covers the whole HP bar', () => {
    expect(diesInOneHit(140, 1200)).toBe(true);
    expect(diesInOneHit(1200, 1200)).toBe(true);
    expect(diesInOneHit(1201, 1200)).toBe(false);
  });

  it('never treats the unknown-HP marker as a one-hit kill', () => {
    // hp 0 is the importer's marker for a "???" feed value. Reading it as
    // "dies instantly" would put the monsters we know least about at the top of
    // a page whose whole purpose is safety.
    expect(diesInOneHit(0, 1200)).toBe(false);
    expect(diesInOneHit(null, 1200)).toBe(false);
  });

  it('refuses to answer without a real damage figure', () => {
    expect(diesInOneHit(140, 0)).toBe(false);
    expect(diesInOneHit(140, Number.NaN)).toBe(false);
  });
});
