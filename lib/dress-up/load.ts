// Fetch one exported sprite part (its JSON and atlas WebP) from the dress-up
// bucket and decode the atlas to RGBA. Browser only for the decode; memoised per
// key. Any failure -- no base URL, a network error, a non-200, a bad image --
// is DressUpUnavailable, so the page has one thing to catch (Review Focus 4).
import { INDEX } from './look';
import type { Atlas, PartData } from './types';

export class DressUpUnavailable extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DressUpUnavailable';
  }
}

export type LoadedPart = { part: PartData; atlas: Atlas };

const cache = new Map<string, Promise<LoadedPart>>();

function base(): string {
  // Spelled out in full so Next inlines it into the client bundle.
  const b = process.env.NEXT_PUBLIC_DRESSUP_BASE;
  if (!b) throw new DressUpUnavailable('NEXT_PUBLIC_DRESSUP_BASE is not set');
  return b.endsWith('/') ? b : `${b}/`;
}

async function fetchOk(url: string): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(url);
  } catch {
    throw new DressUpUnavailable(`fetch failed: ${url}`);
  }
  if (!res.ok) throw new DressUpUnavailable(`HTTP ${res.status}: ${url}`);
  return res;
}

async function decode(blob: Blob): Promise<Atlas> {
  try {
    const bmp = await createImageBitmap(blob, { premultiplyAlpha: 'none', colorSpaceConversion: 'none' });
    const { width: w, height: h } = bmp;
    let ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D | null;
    if (typeof OffscreenCanvas !== 'undefined') {
      ctx = new OffscreenCanvas(w, h).getContext('2d', { willReadFrequently: true });
    } else {
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      ctx = c.getContext('2d', { willReadFrequently: true });
    }
    if (!ctx) throw new Error('no 2d context');
    ctx.drawImage(bmp, 0, 0);
    bmp.close();
    return { w, h, data: ctx.getImageData(0, 0, w, h).data };
  } catch (e) {
    if (e instanceof DressUpUnavailable) throw e;
    throw new DressUpUnavailable('atlas decode failed');
  }
}

async function load(key: string): Promise<LoadedPart> {
  const root = base();
  const hash = INDEX.files[key];
  if (!hash) throw new DressUpUnavailable(`no file for ${key}`);
  const stem = `${root}${key}.${hash}`;
  const [jsonRes, webpRes] = await Promise.all([fetchOk(`${stem}.json`), fetchOk(`${stem}.webp`)]);
  let part: PartData;
  try {
    part = (await jsonRes.json()) as PartData;
  } catch {
    throw new DressUpUnavailable(`bad JSON: ${key}`);
  }
  const atlas = await decode(await webpRes.blob());
  return { part, atlas };
}

/** The part behind a logical key (body/knight-m-0, acc/17-f, ...), fetched once. */
export function loadPart(key: string): Promise<LoadedPart> {
  let p = cache.get(key);
  if (!p) {
    p = load(key);
    cache.set(key, p);
    // A failure is not remembered, so a retry can succeed once the bucket answers.
    p.catch(() => cache.delete(key));
  }
  return p;
}
