import { describe, it, expect } from 'vitest';
import {
  MIN_HUB_SIZE,
  OTHER_KEY,
  assignTownKeys,
  hubLabel,
  naturalKey,
  slugifyZone,
} from './quest-towns';

const q = (zone: string | null, type = 'story') => ({ zone, type });

describe('slugifyZone', () => {
  it('slugs multi-word and mixed-case zones to one spelling', () => {
    expect(slugifyZone('Alberta')).toBe('alberta');
    expect(slugifyZone('Prontera Region')).toBe('prontera-region');
    expect(slugifyZone('  Mjolnir Mountains ')).toBe('mjolnir-mountains');
  });
});

describe('naturalKey', () => {
  it('groups by zone when there is one, by type when there is not', () => {
    expect(naturalKey(q('Alberta'))).toBe('alberta');
    expect(naturalKey(q(null, 'kill'))).toBe('type-kill');
  });

  it('does not split one town across case variants', () => {
    expect(naturalKey(q('ALBERTA'))).toBe(naturalKey(q('Alberta')));
  });
});

describe('assignTownKeys', () => {
  it('folds a hub below the minimum into other', () => {
    // Four Alberta quests: one short of a hub, all fold.
    const quests = Array.from({ length: MIN_HUB_SIZE - 1 }, () => q('Alberta'));
    const keys = assignTownKeys(quests);
    for (const quest of quests) expect(keys.get(quest)).toBe(OTHER_KEY);
  });

  it('keeps a hub exactly at the minimum', () => {
    const quests = Array.from({ length: MIN_HUB_SIZE }, () => q('Alberta'));
    const keys = assignTownKeys(quests);
    for (const quest of quests) expect(keys.get(quest)).toBe('alberta');
  });

  it('folds each small hub independently of the big ones', () => {
    const big = Array.from({ length: 10 }, () => q('Payon'));
    const small = [q('Umbala'), q('Umbala')];
    const typed = Array.from({ length: 6 }, () => q(null, 'kill'));
    const keys = assignTownKeys([...big, ...small, ...typed]);
    expect(keys.get(big[0])).toBe('payon');
    expect(keys.get(small[0])).toBe(OTHER_KEY);
    expect(keys.get(typed[0])).toBe('type-kill');
  });
});

describe('hubLabel', () => {
  it('names the fold bucket and the type buckets in Thai', () => {
    expect(hubLabel(OTHER_KEY)).toBe('เมืองอื่นๆ และเควสย่อย');
    expect(hubLabel('type-kill')).toContain('ล่ามอนสเตอร์');
  });

  it('prefers the zone spelling the data actually has', () => {
    expect(hubLabel('alberta', 'Alberta')).toBe('Alberta');
    expect(hubLabel('alberta', null)).toBe('alberta');
  });
});
