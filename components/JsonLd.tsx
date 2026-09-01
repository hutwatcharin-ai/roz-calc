import { jsonLdString } from '@/lib/jsonld';

// One JSON-LD block. Server component — renders into the initial HTML so
// non-JS crawlers see it.
export default function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: jsonLdString(data) }}
    />
  );
}
