import { describe, it, expect } from 'vitest';
import {
  classifyLine,
  composeThaiDescription,
  LABEL,
  STAT,
  type ThaiDictionaries,
} from './item-description-th';

const dict: ThaiDictionaries = {
  lines: new Map([
    ['Can be sold to the Collector.', 'ขายให้ Collector ได้'],
    ['Unbreakable.', 'ไม่แตก'],
    // A label-shaped line that batch 2 translates whole, because its "term" is
    // really a sentence. It is deliberately absent from `terms` below.
    ['During transformation : ATK +70', 'ระหว่างแปลงร่าง : ATK +70'],
  ]),
  terms: new Map<string, string | null>([
    ['Equippable by', 'อาชีพที่ใส่ได้'],
    ['Weight', 'น้ำหนัก'],
    ['ATK', null],
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

  it('separates label from prose by term length, not by the colon', () => {
    // A colon alone does not make a line prose: this six-word "term" is still
    // short enough to be a structural label, and the live data has three like
    // it. Length is the only guard, so the boundary is what matters.
    const s = 'For each level of Faith learned : DEF +1';
    expect(classifyLine(s)?.kind).toBe('label');
    const long = 'A skull-shaped ring whose inner band bears an inscription carved with a sharp blade : DEF +1';
    expect(classifyLine(long)?.kind).toBe('prose');
  });

  it('classifies a colon line at the MAX_LABEL_WORDS boundary', () => {
    // MAX_LABEL_WORDS is 10. Nothing between 7 and 10 words was covered before,
    // so a drift in the constant went unnoticed once already.
    const ten = 'One two three four five six seven eight nine ten : DEF +1';
    expect(classifyLine(ten)?.kind).toBe('label');
    const eleven = 'One two three four five six seven eight nine ten eleven : DEF +1';
    expect(classifyLine(eleven)?.kind).toBe('prose');
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
    // The property classifyLine relies on to make its branch order arbitrary:
    // no string matches both patterns. Assert it on the patterns themselves --
    // asserting only which branch classifyLine took stays green even when STAT
    // starts accepting colons, because LABEL is tried first either way.
    for (const s of ['Cooldown : +5', 'ATK : +5', 'Weapon Level : 3', 'Element : Fire']) {
      expect(LABEL.test(s)).toBe(true);
      expect(STAT.test(s)).toBe(false);
    }
    for (const s of ['ATK +5', 'Perfect Dodge +10%', 'HIT -10.']) {
      expect(STAT.test(s)).toBe(true);
      expect(LABEL.test(s)).toBe(false);
    }

    // And the consequence: a signed number in a label value survives untouched.
    const labelOnly = classifyLine('Cooldown : +5');
    expect(labelOnly?.kind).toBe('label');
    expect(labelOnly?.term).toBe('Cooldown');
    expect(labelOnly?.value).toBe('+5');
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

  it('returns null thai for a label or stat term with no row at all', () => {
    // The branch's headline invariant. A term with NO row is "not translated
    // yet" (thai: null, caller renders English and the checker can see the
    // gap); a row whose thai_term is NULL is "considered, deliberately English"
    // (thai: source). Collapsing the two makes every untranslated term look
    // finished. `Cooldown` and `MHP` have no row in the fixture above.
    const [label] = composeThaiDescription('Cooldown : 5 seconds', dict);
    expect(label.thai).toBeNull();
    expect(label.thai).not.toBe(label.source);

    const [stat] = composeThaiDescription('MHP +100', dict);
    expect(stat.thai).toBeNull();
    expect(stat.thai).not.toBe(stat.source);
  });

  it('falls back to the whole-line dictionary for an unseeded label term', () => {
    // Three real prose sentences classify as labels, plus 144 lines across 107
    // phrase-shaped stat names. Batch 2 translates those whole; without this
    // fallback the row would exist and the page would still show English.
    const [line] = composeThaiDescription('During transformation : ATK +70', dict);
    expect(line.thai).toBe('ระหว่างแปลงร่าง : ATK +70');
  });

  it('treats an empty prose translation as no translation, not as a blank line', () => {
    const blank: ThaiDictionaries = {
      lines: new Map([['Unbreakable.', ''], ['Indestructible.', '   ']]),
      terms: new Map<string, string | null>(),
    };
    expect(composeThaiDescription('Unbreakable.', blank)[0].thai).toBeNull();
    expect(composeThaiDescription('Indestructible.', blank)[0].thai).toBeNull();
  });

  it('treats an empty term translation as no translation, not as a blank term', () => {
    // `'' ?? null` is `''`, so a blank row used to render " : Card" -- the
    // silent-drop class: an English effect replaced by nothing at all.
    const blank: ThaiDictionaries = {
      lines: new Map(),
      terms: new Map<string, string | null>([['Type', ''], ['MHP', '  ']]),
    };
    expect(composeThaiDescription('Type : Card', blank)[0].thai).toBeNull();
    expect(composeThaiDescription('MHP +100', blank)[0].thai).toBeNull();
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
