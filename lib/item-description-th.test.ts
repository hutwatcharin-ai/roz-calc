import { describe, it, expect } from 'vitest';
import { classifyLine, composeThaiDescription, type ThaiDictionaries } from './item-description-th';

const dict: ThaiDictionaries = {
  lines: new Map([
    ['Can be sold to the Collector.', 'ขายให้ Collector ได้'],
    ['Unbreakable.', 'ไม่แตก'],
  ]),
  terms: new Map<string, string | null>([
    ['Equippable by', 'อาชีพที่ใส่ได้'],
    ['Weight', 'น้ำหนัก'],
    ['ATK', null],
    ['MHP', 'MHP'],
  ]),
};

describe('classifyLine', () => {
  it('reads a structural label and its value', () => {
    expect(classifyLine('Equippable by : All Jobs')).toEqual({
      kind: 'label', term: 'Equippable by', value: 'All Jobs', source: 'Equippable by : All Jobs',
    });
  });

  it('reads a stat name and its signed value', () => {
    expect(classifyLine('MHP +100')).toEqual({
      kind: 'stat', term: 'MHP', value: '+100', source: 'MHP +100',
    });
  });

  it('keeps a trailing period out of the stat value', () => {
    expect(classifyLine('ATK +5.')?.value).toBe('+5');
  });

  it('handles a percent value', () => {
    expect(classifyLine('Perfect Dodge +10%')).toEqual({
      kind: 'stat', term: 'Perfect Dodge', value: '+10%', source: 'Perfect Dodge +10%',
    });
  });

  it('handles a negative value', () => {
    expect(classifyLine('HIT -10')?.value).toBe('-10');
  });

  it('treats a sentence as prose even when it contains a colon', () => {
    // Seven "labels" in the real data are prose with a colon in them. Sending
    // them to the terms table would put whole sentences in a term dictionary.
    const s = 'For each level of Faith learned : DEF +1';
    expect(classifyLine(s)?.kind).toBe('label');
    // The guard is length, not the colon: a term this long is not a label.
    const long = 'A skull-shaped ring whose inner band bears an inscription carved with a sharp blade : DEF +1';
    expect(classifyLine(long)?.kind).toBe('prose');
  });

  it('treats an ordinary sentence as prose', () => {
    expect(classifyLine('Can be sold to the Collector.')).toEqual({
      kind: 'prose', term: 'Can be sold to the Collector.', value: '',
      source: 'Can be sold to the Collector.',
    });
  });

  it('strips a colour code before classifying', () => {
    expect(classifyLine('^FF0000Unbreakable.')?.term).toBe('Unbreakable.');
  });

  it('returns null for a blank line', () => {
    expect(classifyLine('   ')).toBeNull();
  });

  it('distinguishes label and stat patterns: disjoint shapes', () => {
    // STAT pattern name class excludes `:`, LABEL requires `:`. No string can
    // match both. Verify that colon forces label, and that a signed number in
    // a label value (e.g. "Cooldown : +5") preserves the value untouched.
    const labelOnly = classifyLine('Cooldown : +5');
    expect(labelOnly?.kind).toBe('label');
    expect(labelOnly?.term).toBe('Cooldown');
    expect(labelOnly?.value).toBe('+5'); // signed number survives as label value
  });
});

describe('composeThaiDescription', () => {
  it('returns an empty array for a null description', () => {
    expect(composeThaiDescription(null, dict)).toEqual([]);
  });

  it('translates a label and passes its value through untouched', () => {
    const [line] = composeThaiDescription('Equippable by : Swordsman Class', dict);
    expect(line.thai).toBe('อาชีพที่ใส่ได้ : Swordsman Class');
  });

  it('translates a whole prose line', () => {
    const [line] = composeThaiDescription('Can be sold to the Collector.', dict);
    expect(line.thai).toBe('ขายให้ Collector ได้');
  });

  it('returns the source line for a term deliberately left in English', () => {
    // ATK has a row with a null translation: considered and left. The line must
    // render as-is, not as untranslated-and-pending.
    const [line] = composeThaiDescription('ATK +5', dict);
    expect(line.thai).toBe('ATK +5');
  });

  it('returns null thai for a line that is in no dictionary', () => {
    const [line] = composeThaiDescription('Some line nobody has translated yet.', dict);
    expect(line.thai).toBeNull();
    expect(line.source).toBe('Some line nobody has translated yet.');
  });

  it('keeps one entry per source line, in order', () => {
    const out = composeThaiDescription('Unbreakable.\nCan be sold to the Collector.', dict);
    expect(out.map((l) => l.thai)).toEqual(['ไม่แตก', 'ขายให้ Collector ได้']);
  });

  it('drops blank lines rather than emitting empty entries', () => {
    const out = composeThaiDescription('Unbreakable.\n\n\nUnbreakable.', dict);
    expect(out).toHaveLength(2);
  });

  it('strips colour codes from the source it reports', () => {
    const [line] = composeThaiDescription('^0000FFUnbreakable.', dict);
    expect(line.source).toBe('Unbreakable.');
    expect(line.thai).toBe('ไม่แตก');
  });
});
