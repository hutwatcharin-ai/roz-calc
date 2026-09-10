import './globals.css';
import Nav from '@/components/Nav';
import SiteFooter from '@/components/SiteFooter';
import BottomNav from '@/components/BottomNav';
import { FarmPlanProvider } from '@/components/FarmPlanProvider';
import type { Metadata } from 'next';
import localFont from 'next/font/local';
import Analytics from '@/components/Analytics';
import { SITE_URL } from '@/lib/site';
import { GA_DEBUG, gaBootstrap } from '@/lib/analytics';

// Self-hosted from files in the repo (assets/fonts/web, OFL, subset to
// Thai+Latin with fontTools). This used to be next/font/google, which
// downloads the fonts at build time: on 7 Sep 2026 the VPS could not reach
// fonts.googleapis.com and the build died on it, so the deploy failed on a
// change that had nothing to do with fonts. Now the build needs no network.
// CSS refers to the families through these variables.
const sarabun = localFont({
  src: [
    { path: '../assets/fonts/web/Sarabun-Regular.woff2', weight: '400', style: 'normal' },
    { path: '../assets/fonts/web/Sarabun-Medium.woff2', weight: '500', style: 'normal' },
    { path: '../assets/fonts/web/Sarabun-SemiBold.woff2', weight: '600', style: 'normal' },
    { path: '../assets/fonts/web/Sarabun-Bold.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-sarabun',
  display: 'swap',
});
const chakra = localFont({
  src: [
    { path: '../assets/fonts/web/ChakraPetch-SemiBold.woff2', weight: '600', style: 'normal' },
    { path: '../assets/fonts/web/ChakraPetch-Bold.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-chakra',
  display: 'swap',
});
const plexMono = localFont({
  src: [
    { path: '../assets/fonts/web/IBMPlexMono-Regular.woff2', weight: '400', style: 'normal' },
    { path: '../assets/fonts/web/IBMPlexMono-Medium.woff2', weight: '500', style: 'normal' },
    { path: '../assets/fonts/web/IBMPlexMono-SemiBold.woff2', weight: '600', style: 'normal' },
    { path: '../assets/fonts/web/IBMPlexMono-Bold.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-mono',
  display: 'swap',
});

// metadataBase turns the relative OG path below into the absolute URL that
// crawlers and chat clients require -- a relative og:image is ignored.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  // Relative canonical: Next 14.2 resolves './' to the current route's path
  // (query stripped) against metadataBase, so every page self-canonicalizes
  // without touching each generateMetadata (audit Critical #1).
  alternates: { canonical: './' },
  title: {
    default: 'RO Zero Thai — ฐานข้อมูลและเครื่องมือ Ragnarok Zero Global ภาษาไทย',
    // Every page that sets its own title gets the site name appended.
    template: '%s | RO Zero Thai',
  },
  description:
    'ฐานข้อมูลมอนสเตอร์ ไอเทม และเครื่องมือหาจุดฟาร์มของ Ragnarok Zero Global ภาษาไทย คำนวณ EXP ต่อชั่วโมงและหาของดรอปได้ในที่เดียว',
  openGraph: {
    type: 'website',
    siteName: 'RO Zero Thai',
    locale: 'th_TH',
    images: ['/og-default.jpg'],
  },
  twitter: { card: 'summary_large_image' },
};

// Production only, unless NEXT_PUBLIC_GA_DEBUG=1 asks for DebugView from a dev
// server: a dev server hitting GA4 would mix local traffic into the real
// property's numbers. With the debug flag every event carries debug_mode,
// which GA4 keeps out of the reports.
const GA_ID = (process.env.NODE_ENV === 'production' || GA_DEBUG) && process.env.NEXT_PUBLIC_GA_ID ? process.env.NEXT_PUBLIC_GA_ID : null;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={`${sarabun.variable} ${chakra.variable} ${plexMono.variable}`}>
      {/* Synchronous, ahead of hydration: the gtag stub must exist before the
          first page_view effect runs, or that view is dropped.
          The commit marker rides along in the same head: Coolify sets
          SOURCE_COMMIT when it builds, so every page states which commit
          produced it. scripts/deploy.mjs waits for that to equal the commit it
          pushed -- on 10 Sep 2026 it mistook another build finishing for its
          own and reported a deploy that had not happened. */}
      <head>
        <meta name="x-commit" content={process.env.SOURCE_COMMIT ?? 'dev'} />
        {GA_ID && <script dangerouslySetInnerHTML={{ __html: gaBootstrap(GA_ID) }} />}
      </head>

      <body>
        {/* The character context wraps the whole app: the aggro badge grades
            itself from it on every page, so a provider mounted per page would
            leave the badge ungraded wherever someone forgot to add one. */}
          {/* Farm plan wraps the app for the same reason: the add button on a
              monster page and the planner page must share one plan. Without
              this wrapper every consumer gets the default context and the
              whole feature silently renders nothing (shipped broken once). */}
          <FarmPlanProvider>
            <Nav />
            {children}
            <SiteFooter />
            {/* Phone only (CSS breakpoint): the five primary links move down
                here and the top row hides itself, so the same links are never
                on screen twice. */}
            <BottomNav />
          </FarmPlanProvider>
        {GA_ID && <Analytics gaId={GA_ID} />}
      </body>
    </html>
  );
}
