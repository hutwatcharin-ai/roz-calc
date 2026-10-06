// GET /b/<id>/card.png: the shared build's picture (lib/build-card).
//
// An id names one build forever (lib/build-share), so the picture never
// changes: browsers and Cloudflare may keep it a year, and the ".png" path
// is one Cloudflare caches by default. In practice each shared build is drawn
// once. An unknown id gets the site's default card rather than a drawing.
import { NextResponse } from 'next/server';
import { loadBuild } from '@/lib/build-share';
import { buildCardPng } from '@/lib/build-card';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const build = await loadBuild(params.id);
  if (!build) return NextResponse.redirect(new URL('/og-default.jpg', req.url), 302);
  const started = Date.now();
  const png = await buildCardPng(build, params.id);
  return new NextResponse(Buffer.from(png), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Server-Timing': `draw;dur=${Date.now() - started}`,
    },
  });
}
