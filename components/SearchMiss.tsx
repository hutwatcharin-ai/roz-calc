// What a page shows when its search found nothing.
//
// The empty state used to be one sentence saying so. 17% of real searches
// end here (GA4, 60 days to 7 Sep 2026), and most of them had an answer one
// section over or one letter away, so this is where those go.

import Link from 'next/link';
import { KIND_LABELS, type SearchMiss as Miss } from '@/lib/search-catalog';

export default function SearchMiss({ query, miss }: { query: string; miss: Miss }) {
  const nothing = miss.elsewhere.length === 0 && miss.didYouMean.length === 0;

  return (
    <div className="searchmiss">
      <p className="searchmiss__head">
        ไม่เจอ <strong>{query}</strong> ในหมวดนี้
      </p>

      {miss.elsewhere.length > 0 && (
        <p className="searchmiss__line">
          เจอในหมวดอื่น:{' '}
          {miss.elsewhere.map((e, i) => (
            <span key={`${e.kind}-${e.href}`}>
              {i > 0 && ' · '}
              <Link className="chiplink" href={e.href}>
                {e.name}
                <span className="searchmiss__kind">{KIND_LABELS[e.kind]}</span>
              </Link>
            </span>
          ))}
        </p>
      )}

      {miss.didYouMean.length > 0 && (
        <p className="searchmiss__line">
          หรือหมายถึง:{' '}
          {miss.didYouMean.map((e, i) => (
            <span key={`${e.kind}-${e.href}`}>
              {i > 0 && ' · '}
              <Link className="chiplink" href={e.href}>
                {e.name}
              </Link>
            </span>
          ))}
        </p>
      )}

      {nothing && (
        // Said plainly: Zero has fewer monsters and items than the classic
        // game, and several real misses in the log ("anacon", "geographer",
        // "temari") were things that simply are not in this version.
        <p className="searchmiss__line muted">
          อาจยังไม่มีในเซิร์ฟนี้ หรือสะกดต่างจากในเกม · ลองพิมพ์สั้นลงเหลือ 3-4 ตัวอักษร
        </p>
      )}
    </div>
  );
}
