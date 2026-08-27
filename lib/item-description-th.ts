// Composing a Thai item description from two dictionaries.
//
// Descriptions are stored in English and translated at render time. Nothing is
// translated per item: the same English line always yields the same Thai, so a
// line is translated once and reused everywhere it appears.

export type LineKind = 'label' | 'stat' | 'prose';

export interface ClassifiedLine {
  kind: LineKind;
  // For a label or stat this is the term alone; for prose it is the whole line.
  term: string;
  // The part that passes through untranslated. Empty for prose.
  value: string;
  source: string;
}

export interface ThaiDictionaries {
  lines: ReadonlyMap<string, string>;
  // null means "deliberately left in English" -- see the migration's comment.
  terms: ReadonlyMap<string, string | null>;
}

export interface DescriptionLine {
  source: string;
  // null means no translation exists, so the caller renders the English.
  thai: string | null;
}

const COLOUR_CODE = /\^[0-9a-fA-F]{6}/g;
const LABEL = /^([A-Za-z][A-Za-z '\/-]*?)\s*:\s*(.+)$/;
const STAT = /^([A-Za-z][A-Za-z %'-]*?)\s*([+-]\s*\d+%?)\s*\.?$/;

// Seven lines in the real data are sentences containing a colon. A structural
// label is short by nature -- the longest real one is "Melee physical attacks"
// at three words -- so length is what separates them, not the colon.
const MAX_LABEL_WORDS = 10;

export function classifyLine(rawLine: string): ClassifiedLine | null {
  const source = rawLine.replace(COLOUR_CODE, '').trim();
  if (source === '') return null;

  // Label before stat, always. Reversed, "DEF : 5" would be read as prose and
  // wait for a whole-line translation -- the growth-with-the-data problem the
  // two-table design exists to prevent.
  const label = LABEL.exec(source);
  if (label && label[1].trim().split(/\s+/).length <= MAX_LABEL_WORDS) {
    return { kind: 'label', term: label[1].trim(), value: label[2].trim(), source };
  }

  const stat = STAT.exec(source);
  if (stat) {
    return { kind: 'stat', term: stat[1].trim(), value: stat[2].replace(/\s+/g, ''), source };
  }

  return { kind: 'prose', term: source, value: '', source };
}

export function composeThaiDescription(
  description: string | null,
  dict: ThaiDictionaries,
): DescriptionLine[] {
  if (!description) return [];

  const out: DescriptionLine[] = [];

  for (const rawLine of description.split('\n')) {
    const classified = classifyLine(rawLine);
    if (!classified) continue;

    if (classified.kind === 'prose') {
      out.push({ source: classified.source, thai: dict.lines.get(classified.term) ?? null });
      continue;
    }

    if (!dict.terms.has(classified.term)) {
      out.push({ source: classified.source, thai: null });
      continue;
    }

    const thaiTerm = dict.terms.get(classified.term);
    if (thaiTerm === null || thaiTerm === undefined) {
      // Deliberately English. The line is finished, not pending.
      out.push({ source: classified.source, thai: classified.source });
      continue;
    }

    const joined =
      classified.kind === 'label'
        ? `${thaiTerm} : ${classified.value}`
        : `${thaiTerm} ${classified.value}`;
    out.push({ source: classified.source, thai: joined });
  }

  return out;
}
