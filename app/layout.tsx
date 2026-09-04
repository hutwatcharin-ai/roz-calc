import './globals.css';
import Nav from '@/components/Nav';
import SiteFooter from '@/components/SiteFooter';
import { FarmPlanProvider } from '@/components/FarmPlanProvider';
import type { Metadata } from 'next';
import { Sarabun, Chakra_Petch, IBM_Plex_Mono } from 'next/font/google';
import Analytics from '@/components/Analytics';
import { SITE_URL } from '@/lib/site';
import { GA_DEBUG, gaBootstrap } from '@/lib/analytics';

// Self-hosted via next/font (SEO audit High #5): kills the render-blocking
// fonts.googleapis.com round trip and auto-tunes fallback metrics against
// font-swap layout shift. CSS refers to the families through these variables.
const sarabun = Sarabun({ subsets: ['thai', 'latin'], weight: ['400', '500', '600', '700'], variable: '--font-sarabun', display: 'swap' });
const chakra = Chakra_Petch({ subsets: ['thai', 'latin'], weight: ['600', '700'], variable: '--font-chakra', display: 'swap' });
const plexMono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-mono', display: 'swap' });

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
          first page_view effect runs, or that view is dropped. */}
      {GA_ID && (
        <head>
          <script dangerouslySetInnerHTML={{ __html: gaBootstrap(GA_ID) }} />
        </head>
      )}

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
          </FarmPlanProvider>
        {GA_ID && <Analytics gaId={GA_ID} />}
      </body>
    </html>
  );
}
