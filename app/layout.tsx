import './globals.css';
import Nav from '@/components/Nav';
import CharacterBar from '@/components/CharacterBar';
import SiteFooter from '@/components/SiteFooter';
import { CharacterContextProvider } from '@/components/CharacterContextProvider';
import { FarmPlanProvider } from '@/components/FarmPlanProvider';
import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/site';

// metadataBase turns the relative OG path below into the absolute URL that
// crawlers and chat clients require -- a relative og:image is ignored.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
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
    images: ['/og-default.png'],
  },
  twitter: { card: 'summary_large_image' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@600;700&family=Sarabun:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap"
        />
      </head>
      <body>
        {/* The character context wraps the whole app: the aggro badge grades
            itself from it on every page, so a provider mounted per page would
            leave the badge ungraded wherever someone forgot to add one. */}
        <CharacterContextProvider>
          <Nav />
          <CharacterBar />
          {children}
          <SiteFooter />
        </CharacterContextProvider>
      </body>
    </html>
  );
}
