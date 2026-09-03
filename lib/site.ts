// The deployed origin. Needed in two places -- the OG image URL and the sitemap
// -- so it lives in its own module rather than being exported from a route file
// that also imports global CSS.
//
// NEXT_PUBLIC_SITE_URL is a build-time variable in Coolify. The fallback keeps
// local development working; it must not be what production ships. Built
// without it, the build used to succeed silently and every one of the 1,828
// sitemap entries -- and every og:image -- read http://localhost:3000/...
// A deploy that would have shipped localhost must fail loudly instead.
function resolveSiteUrl(): string {
  const value = process.env.NEXT_PUBLIC_SITE_URL;
  if (value) return value;

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'NEXT_PUBLIC_SITE_URL is not set. It must be provided as a build-time environment variable in production -- without it, the sitemap and OG images would silently ship http://localhost:3000 URLs.',
    );
  }

  return 'http://localhost:3000';
}

export const SITE_URL = resolveSiteUrl();

// The live host, independent of NEXT_PUBLIC_SITE_URL. That variable is what
// the current build renders as its own origin -- locally it is localhost --
// so anything talking to the real site (a CDN purge, a canonical redirect)
// must not read it. middleware.ts and scripts/purge-cloudflare.ts both key off
// this instead.
export const CANONICAL_HOST = 'rozerothai.com';
export const CANONICAL_ORIGIN = `https://${CANONICAL_HOST}`;
