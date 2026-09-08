import { describe, it, expect } from 'vitest';
import { tipFacts, tipLevel, type SkillLevelMap } from './skill-details';

// Real rows: Bash from skill_levels, which carries an effect and an SP cost
// but no cast time.
const LEVELS: SkillLevelMap = {
  bash: {
    '1': { e: 'ATK 130%, Accuracy bonus: 5%', sp: 8, r: 1 },
    '2': { e: 'ATK 160%, Accuracy bonus: 10%', sp: 8, r: 1 },
    '3': { e: 'ATK 190%, Accuracy bonus: 15%', sp: 8, r: 1 },
  },
  'acid-bomb': { '1': { e: 'ATK 400%', sp: 50, r: 9, c: 1000 } },
  gappy: { '1': { e: 'one' }, '5': { e: 'five' } },
};

describe('tipLevel', () => {
  it('describes the level the player chose', () => {
    expect(tipLevel(LEVELS, 'bash', 3)).toBe(3);
  });

  it('describes level 1 when nothing is spent, since that is what a point buys', () => {
    expect(tipLevel(LEVELS, 'bash', 0)).toBe(1);
  });

  it('falls back to the nearest level below when the source skipped one', () => {
    expect(tipLevel(LEVELS, 'gappy', 4)).toBe(1);
    expect(tipLevel(LEVELS, 'gappy', 5)).toBe(5);
  });

  it('answers null for a skill with no rows at all', () => {
    expect(tipLevel(LEVELS, 'nope', 1)).toBeNull();
  });
});

describe('tipFacts', () => {
  it('leads with the effect and skips fields the source does not carry', () => {
    expect(tipFacts(LEVELS, 'bash', 3)).toEqual([
      { label: 'ผล', value: 'ATK 190%, Accuracy bonus: 15%' },
      { label: 'SP', value: '8' },
      { label: 'ระยะ', value: '1 ช่อง' },
    ]);
  });

  it('shows a cast time in seconds once it passes a second', () => {
    const facts = tipFacts(LEVELS, 'acid-bomb', 1);
    expect(facts.find((f) => f.label === 'ร่าย')).toEqual({ label: 'ร่าย', value: '1 วิ' });
  });

  it('says nothing rather than an empty box for a skill we have no data on', () => {
    expect(tipFacts(LEVELS, 'nope', 2)).toEqual([]);
  });
});
