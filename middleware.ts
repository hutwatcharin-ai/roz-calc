import { NextRequest, NextResponse } from 'next/server';

// Host canonicalization (SEO audit 2026-09-01, Critical #1): www and the
// sslip.io fallback hostname served byte-identical 200s with no redirect,
// leaving Google two extra live copies of the site. Everything that is not
// the apex 301s to it, path and query preserved. localhost/127.* stay
// untouched so local prod tests keep working.
import { CANONICAL_HOST } from './lib/site';

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') ?? '';
  const bare = host.split(':')[0];
  // 100.64.0.0/10 is Tailscale: the owner's phone preview of a local build
  // (http://100.108.70.113:3178) must stay on that build, not bounce to prod.
  const tailnet = /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./.test(bare);
  if (bare === CANONICAL_HOST || bare === 'localhost' || bare.startsWith('127.') || tailnet) {
    const response = NextResponse.next();
    // The /database/* index pages read searchParams for their filters, which
    // makes Next render them per request and stamp them private/no-cache --
    // so the most-visited pages on the site were the only ones the CDN never
    // cached (24 Sep 2026 audit: 11 of 12 BYPASS). An index URL with no
    // query string is the same page for everyone; let the CDN hold it for
    // the same day the ISR pages get. Filtered views keep Next's headers.
    // Every deploy purges the CDN (scripts/deploy.mjs), so a new build is
    // never served stale.
    if (/^\/database\/[a-z-]+$/.test(request.nextUrl.pathname) && request.nextUrl.search === '') {
      response.headers.set('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=3600');
    }
    return response;
  }
  const url = request.nextUrl.clone();
  url.host = CANONICAL_HOST;
  url.port = '';
  url.protocol = 'https';
  return NextResponse.redirect(url, 301);
}

export const config = {
  // Skip static assets — only pages need host canonicalization.
  matcher: ['/((?!_next/|images/|favicon|icon|apple-icon|og-default).*)'],
};
