import './globals.css';
import Nav from '@/components/Nav';
import SiteFooter from '@/components/SiteFooter';
import { FarmPlanProvider } from '@/components/FarmPlanProvider';
import type { Metadata } from 'next';
import { Sarabun, Chakra_Petch, IBM_Plex_Mono } from 'next/font/google';
import { GoogleAnalytics } from '@next/third-parties/google';
import { SITE_URL } from '@/lib/site';

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={`${sarabun.variable} ${chakra.variable} ${plexMono.variable}`}>

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
        {/* Only in production: a dev server hitting GA4 would mix local
            traffic into the real property's numbers. */}
        {process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_GA_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
        )}
      </body>
    </html>
  );
}
