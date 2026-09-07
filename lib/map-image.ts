// Which maps have a mirrored minimap, and where each picture came from.
//
// The files are produced by scripts/mirror-map-images.mjs. Coverage is partial
// by construction, so every caller has to handle "no image" -- a map with no
// picture shows no picture rather than a broken one.
import fs from 'node:fs';
import path from 'node:path';

const DIR = path.join(process.cwd(), 'public', 'images', 'maps');

export type MapImage = {
  /** Path under /public, ready for <img src>. */
  src: string;
  /** Set when the picture is filed under the map's classic RO code instead of the Zero one. */
  fromCode: string | null;
  /**
   * 'full' is prontera.info's ~512 px terrain render (public/images/maps/full,
   * WebP); 'mini' is ratemyserver's 205 px minimap GIF. Full wins when both
   * exist: it is the picture a player recognises the place by (user, 7 Sep
   * 2026, "maps should have a picture like prontera's").
   */
  kind: 'full' | 'mini';
  width: number;
  height: number;
};

type FullIndex = Record<string, { prontera: string; name: string }>;

let cache: { codes: Set<string>; source: Record<string, string>; full: FullIndex } | null = null;

function load() {
  if (cache) return cache;
  let codes = new Set<string>();
  let source: Record<string, string> = {};
  try {
    codes = new Set(
      fs
        .readdirSync(DIR)
        .filter((f) => f.endsWith('.gif'))
        .map((f) => f.slice(0, -4)),
    );
  } catch {
    // No mirror yet (a fresh clone that has not run the script): every lookup
    // returns null, which is the same path a missing map takes.
  }
  try {
    source = JSON.parse(fs.readFileSync(path.join(DIR, '_source.json'), 'utf8'));
  } catch {
    // Optional: absence only means no map needed a classic-code fallback.
  }
  let full: FullIndex = {};
  try {
    full = JSON.parse(fs.readFileSync(path.join(DIR, 'full', '_index.json'), 'utf8'));
  } catch {
    // No prontera mirror on disk: the minimaps alone still work.
  }
  cache = { codes, source, full };
  return cache;
}

export function mapImage(code: string): MapImage | null {
  const { codes, source, full } = load();
  const hit = full[code];
  if (hit) {
    return {
      src: `/images/maps/full/${hit.prontera}.webp`,
      fromCode: hit.prontera === code ? null : hit.prontera,
      kind: 'full',
      // Renders are 512 px on the long side at most; the box is square so
      // the layout never shifts while the picture loads.
      width: 512,
      height: 512,
    };
  }
  if (!codes.has(code)) return null;
  return { src: `/images/maps/${code}.gif`, fromCode: source[code] ?? null, kind: 'mini', width: 205, height: 205 };
}

/** For tests and for reporting coverage without touching the filesystem twice. */
export function mirroredMapCodes(): string[] {
  return [...load().codes].sort();
}
