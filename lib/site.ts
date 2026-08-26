// The deployed origin. Needed in two places -- the OG image URL and the sitemap
// -- so it lives in its own module rather than being exported from a route file
// that also imports global CSS.
//
// NEXT_PUBLIC_SITE_URL is a build-time variable in Coolify. The fallback keeps
// local development working; it must not be what production ships.
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
