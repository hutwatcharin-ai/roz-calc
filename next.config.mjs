/** @type {import('next').NextConfig} */
const nextConfig = {
  // Framework fingerprint header off (SEO audit 2026-09-01, Low #9).
  poweredByHeader: false,
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
