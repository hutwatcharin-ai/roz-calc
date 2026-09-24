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
export interface Segment {
  text: string;
  tone: Tone;
  /** Set when the segment came from a client waypoint: the map page to link to. */
  href?: string;
}

const CODE = /\^([0-9a-fA-F]{6})/g;

// The client also marks up a clickable waypoint:
//   <NAVI>[Nagging Old Man]<INFO>prontera,272,260,0,100,0,0</INFO></NAVI>
// In the game that is a link that walks you there. Printed raw it is the
// ugliest thing on the page, and 147 of our item descriptions carry one
// (checked 24 Sep 2026), which is how it reached a guide table unnoticed.
// Rewritten here into "Name (map x,y)" so every place that renders item text
// gets it at once, with the map page as the link.
// The Thai text colours the NPC's name, so a ^RRGGBB code can sit between any
// two pieces of the markup. Missing that was why the Thai line still printed
// raw while the English one came out clean.
const C = '(?:\\^[0-9a-fA-F]{6})*';
const WAYPOINT = new RegExp(
  `${C}<NAVI>${C}\\[([^\\]]*)\\]${C}<INFO>${C}([^,<]+),(\\d+),(\\d+)[^<]*</INFO>${C}</NAVI>${C}`,
  'gi',
);

export interface Waypoint { name: string; map: string; x: number; y: number }

/** "Name (map x,y)", the readable form of one waypoint. */
export function waypointText(w: Waypoint): string {
  return `${w.name} (${w.map} ${w.x},${w.y})`;
}

/** Every waypoint in a line, in the order they appear. */
export function waypoints(line: string): Waypoint[] {
  return [...line.matchAll(WAYPOINT)].map((m) => ({
    name: m[1].replace(CODE, '').trim(),
    map: m[2].replace(CODE, '').trim(),
    x: Number(m[3]),
    y: Number(m[4]),
  }));
}

function toneOf(hex: string): Tone {
  const h = hex.toLowerCase();
  if (h === '000000' || h === 'ffffff') return 'default';
  if (h === '777777') return 'muted';
  return 'accent';
}

export function isSpacerLine(line: string): boolean {
  return /^\^[fF]{6}_\^0{6}$/.test(line.trim());
}

/** Colour codes only, for one stretch of text with no waypoint in it. */
function coloured(line: string, startTone: Tone): { parts: Segment[]; tone: Tone } {
  const parts: Segment[] = [];
  let tone = startTone;
  let last = 0;
  for (const m of line.matchAll(CODE)) {
    if (m.index! > last) parts.push({ text: line.slice(last, m.index), tone });
    tone = toneOf(m[1]);
    last = m.index! + m[0].length;
  }
  if (last < line.length) parts.push({ text: line.slice(last), tone });
  return { parts, tone };
}

export function segments(line: string): Segment[] {
  const out: Segment[] = [];
  // A waypoint interrupts the colour run, so the tone carries across it: the
  // client's own codes keep applying to the text after the link.
  let tone: Tone = 'default';
  let last = 0;
  for (const m of line.matchAll(WAYPOINT)) {
    const before = coloured(line.slice(last, m.index), tone);
    out.push(...before.parts);
    tone = before.tone;
    const place = {
      name: m[1].replace(CODE, '').trim(),
      map: m[2].replace(CODE, '').trim(),
      x: Number(m[3]),
      y: Number(m[4]),
    };
    out.push({
      text: waypointText(place),
      tone: 'accent',
      href: `/database/maps/${encodeURIComponent(place.map)}`,
    });
    last = m.index! + m[0].length;
  }
  out.push(...coloured(line.slice(last), tone).parts);
  return out.filter((s) => s.text !== '');
}

export function stripCodes(line: string): string {
  return line
    .replace(WAYPOINT, (_, name, map, x, y) =>
      waypointText({
        name: String(name).replace(CODE, '').trim(),
        map: String(map).replace(CODE, '').trim(),
        x: Number(x),
        y: Number(y),
      }),
    )
    .replace(CODE, '');
}
