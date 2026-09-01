// JSON-LD builders (SEO audit 2026-09-01, Critical #3). Rules that matter:
// in-game entities are schema.org Thing with PropertyValue facts — never
// Product/Offer (misrepresenting virtual goods as purchasable risks a manual
// action). No HowTo, no new FAQPage.
import { SITE_URL } from '@/lib/site';

export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'RO Zero Thai',
    url: `${SITE_URL}/`,
    description:
      'ฐานข้อมูลมอนสเตอร์ ไอเทม การ์ด เควส ภาษาไทยของ Ragnarok Zero Global พร้อมเครื่องมือค้นของดรอปและคำนวณ HIT/FLEE',
    inLanguage: 'th',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/drop-finder?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export interface Crumb {
  name: string;
  path: string;
}

export function breadcrumbJsonLd(crumbs: Crumb[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: `${SITE_URL}${c.path}`,
    })),
  };
}

export function entityJsonLd(opts: {
  path: string;
  name: string;
  description?: string | null;
  properties: { name: string; value: string | number; unitText?: string }[];
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Thing',
    '@id': `${SITE_URL}${opts.path}#entity`,
    name: opts.name,
    ...(opts.description ? { description: opts.description } : {}),
    additionalProperty: opts.properties.map((p) => ({
      '@type': 'PropertyValue',
      name: p.name,
      value: p.value,
      ...(p.unitText ? { unitText: p.unitText } : {}),
    })),
  };
}

/** Serialize for a <script type="application/ld+json"> body. `<` is escaped so
 *  data can never close the script tag early. */
export function jsonLdString(data: object): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
