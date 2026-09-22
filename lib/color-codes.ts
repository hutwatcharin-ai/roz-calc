// The game client colours item text with inline ^RRGGBB codes: ^777777 for a
// label's value, ^000088 for an effect, ^000000 to go back to the default.
// Printed raw they read as noise, and their colours were picked for the
// client's white tooltip -- dark blue and black vanish on this site's dark
// ground. So the codes become three roles instead of literal colours:
//   default  ^000000 / ^FFFFFF (back to normal text)
//   muted    ^777777 (the grey the client uses for label values)
//   accent   anything else (the client's highlight colours)
// A line that is only "^FFFFFF_^000000" is the client's blank spacer line.

export type Tone = 'default' | 'muted' | 'accent';
export interface Segment { text: string; tone: Tone }

const CODE = /\^([0-9a-fA-F]{6})/g;

function toneOf(hex: string): Tone {
  const h = hex.toLowerCase();
  if (h === '000000' || h === 'ffffff') return 'default';
  if (h === '777777') return 'muted';
  return 'accent';
}

export function isSpacerLine(line: string): boolean {
  return /^\^[fF]{6}_\^0{6}$/.test(line.trim());
}

export function segments(line: string): Segment[] {
  const out: Segment[] = [];
  let tone: Tone = 'default';
  let last = 0;
  for (const m of line.matchAll(CODE)) {
    if (m.index! > last) out.push({ text: line.slice(last, m.index), tone });
    tone = toneOf(m[1]);
    last = m.index! + m[0].length;
  }
  if (last < line.length) out.push({ text: line.slice(last), tone });
  return out.filter((s) => s.text !== '');
}

export function stripCodes(line: string): string {
  return line.replace(CODE, '');
}
