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
// Exported so the disjointness property can be asserted directly rather than
// inferred from classifyLine's output: a test that only checks which branch
// classifyLine took stays green when the two patterns start overlapping.
export const LABEL = /^([A-Za-z][A-Za-z '\/-]*?)\s*:\s*(.+)$/;
export const STAT = /^([A-Za-z][A-Za-z %'-]*?)\s*([+-]\s*\d+%?)\s*\.?$/;

// Some lines in the real data are sentences containing a colon, so the colon
// alone cannot separate a structural label from prose -- length does.
//
// Measured against the live data at 10: the 20 label terms this admits top out
// at "For each level of Faith learned" (six words). Raising the bound admits
// more sentences as labels; lowering it to four would push two real labels
// ("When worn with Prisoner Uniform" and "For each level of Faith learned")
// into prose. The boundary is tested on both sides in
// item-description-th.test.ts, so a future drift shows up as a red test.
const MAX_LABEL_WORDS = 10;

export function classifyLine(rawLine: string): ClassifiedLine | null {
  const source = rawLine.replace(COLOUR_CODE, '').trim();
  if (source === '') return null;

  // Check label shape. Label requires a colon; stat name class excludes colons.
  // The two patterns are structurally disjoint (no string matches both), so the
  // order is arbitrary. Checked first for readability — labels are the larger,
  // more obvious case.
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

// An empty or whitespace-only translation is not a translation. `?? null` lets
// `''` through as if it were real Thai, which renders a blank where an English
// effect used to be (or `" : Card"` for a term) -- a silent drop, the worst
// failure mode this feature has. Migration 0009 rejects such rows at the
// database, and this treats any that predate it as absent.
function usable(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return null;
  return value.trim() === '' ? null : value;
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
      out.push({ source: classified.source, thai: usable(dict.lines.get(classified.term)) });
      continue;
    }

    // A whole-line translation outranks a term translation, always. The line
    // dictionary holds a deliberate decision about this exact sentence; a term
    // match is a generic substitution that happens to apply. Three lines in the
    // data are sentences that merely start with a label term
    // (`During transformation : ATK +70`), and composing them from the term
    // leaves the rest in English. Batch 2 translates them whole, and it should
    // not have to delete the term row to do it.
    const wholeLine = usable(dict.lines.get(classified.source));
    if (wholeLine !== null) {
      out.push({ source: classified.source, thai: wholeLine });
      continue;
    }

    const stored = dict.terms.get(classified.term);
    const blankRow = typeof stored === 'string' && stored.trim() === '';
    if (!dict.terms.has(classified.term) || blankRow) {
      // No row means "not translated yet" -- distinct from a row holding NULL,
      // which means "considered, deliberately English" and is handled below.
      // Collapsing the two would make every untranslated term look finished.
      // The line dictionary was already consulted above and had nothing.
      out.push({ source: classified.source, thai: null });
      continue;
    }

    const thaiTerm = stored;
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
