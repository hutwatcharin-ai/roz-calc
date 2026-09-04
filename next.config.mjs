/** @type {import('next').NextConfig} */
const nextConfig = {
  // Framework fingerprint header off (SEO audit 2026-09-01, Low #9).
  poweredByHeader: false,
  // The reference tables and the written guide moved out of /tools on
  // 3 Sep 2026: /tools is where you put your own numbers in and get an answer,
  // /guides is what you read. Permanent, because the new path is where these
  // pages live now -- anything already linking or indexed follows once.
  async redirects() {
    return [
      { source: '/tools/elements', destination: '/guides/elements', permanent: true },
      { source: '/tools/sizes', destination: '/guides/sizes', permanent: true },
      { source: '/tools/exp', destination: '/guides/exp', permanent: true },
      { source: '/tools/farm-guide', destination: '/guides/farm-guide', permanent: true },
      // Three tools became one on 4 Sep 2026: they ran the same arithmetic
      // behind three identical forms and differed only in which monsters were
      // in scope. Each old URL lands on the mode it used to be.
      { source: '/tools/afk-finder', destination: '/tools/leveling-spots?mode=afk', permanent: true },
      { source: '/tools/farm-planner', destination: '/tools/leveling-spots?mode=plan', permanent: true },
    ];
  },
  async headers() {
    return [
      {
        // Security headers on every route (audit Critical #2). CSP is
        // frame-ancestors only: a full policy would need unsafe-inline for
        // Next's own scripts and buys little here.
        source: '/:path*',
        headers: [
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Content-Security-Policy', value: "frame-ancestors 'self'" },
        ],
      },
      {
        // Game sprites are id-addressed and never change in place — cache
        // like _next/static instead of the 4h default the CDN kept expiring.
        source: '/images/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ];
  },
};
export default nextConfig;
