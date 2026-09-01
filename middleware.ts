import { NextRequest, NextResponse } from 'next/server';

// Host canonicalization (SEO audit 2026-09-01, Critical #1): www and the
// sslip.io fallback hostname served byte-identical 200s with no redirect,
// leaving Google two extra live copies of the site. Everything that is not
// the apex 301s to it, path and query preserved. localhost/127.* stay
// untouched so local prod tests keep working.
const CANONICAL_HOST = 'rozerothai.com';

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') ?? '';
  const bare = host.split(':')[0];
  if (bare === CANONICAL_HOST || bare === 'localhost' || bare.startsWith('127.')) {
    return NextResponse.next();
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
