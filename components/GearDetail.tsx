// The body of a wearable's detail page, shared by /database/equipment/[id] and
// /database/costumes/[id]. The two routes differ only in which section they sit
// under -- same row, same tiles, same drop list -- so the markup lives here and
// each route passes its own section rather than keeping a second copy in sync.

import Link from 'next/link';
import { isCVariant } from '@/lib/c-variant';
import JsonLd from '@/components/JsonLd';
import { breadcrumbJsonLd, entityJsonLd } from '@/lib/jsonld';
import RecordVisit from '@/components/RecordVisit';
import ItemIcon from '@/components/ItemIcon';
import FeedbackButton from '@/components/FeedbackButton';
import DescriptionLanguageToggle from '@/components/DescriptionLanguageToggle';
import RandomOptionsCard from '@/components/RandomOptionsCard';
import { composeThaiDescription } from '@/lib/item-description-th';
import { randomOptionsFor } from '@/lib/random-options';
import type { GearExtras } from '@/lib/gear-detail';

export const CATEGORY_LABELS: Record<string, string> = {
  Weapon: 'อาวุธ',
  Armor: 'เกราะ/สวมใส่',
  'Costume Equipment': 'คอสตูม',
};

export interface GearSection {
  /** Route prefix this page lives under, e.g. /database/equipment */
  basePath: string;
  /** What the breadcrumb and the "kind" wording call this section */
  label: string;
  /** RecordVisit kind, so the "เพิ่งดู" strip links back to the right route */
  recentKind: 'equipment' | 'costume';
  feedbackPageType: string;
  /**
   * Breadcrumb link back to this row's own kind in the list. The two lists
   * take different params -- the gear list ignores `type` unless `category`
   * comes with it -- so each route builds its own rather than this guessing.
   */
  subtypeHref: (item: { category: string | null; weapon_type: string | null }) => string;
}

export default function GearDetail({
  item,
  extras,
  section,
}: {
  item: any;
  extras: GearExtras;
  section: GearSection;
}) {
  const { droppedBy, droppedByError, dict } = extras;
  const displayName = item.slots > 0 ? `${item.name_en} [${item.slots}]` : item.name_en;
  const categoryLabel = CATEGORY_LABELS[item.category ?? ''] ?? item.category ?? section.label;
  const randomOptions = randomOptionsFor(item.category, item.weapon_type, item.weapon_level);
  const detailPath = `${section.basePath}/${item.id}`;
  const rows = (droppedBy ?? []).filter((d: any) => d.monsters && !isCVariant(d.monsters.name_en));
  const lowest = rows.length
    ? rows.reduce((a: any, b: any) => ((b.monsters.level ?? 999) < (a.monsters.level ?? 999) ? b : a))
    : null;

  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <nav className="crumbs" aria-label="ตำแหน่งหน้า">
        <Link href={section.basePath}>{section.label}</Link>
        <span className="crumbs__sep" aria-hidden="true">›</span>
        {item.weapon_type ? (
          <>
            <Link href={section.subtypeHref(item)}>{item.weapon_type}</Link>
            <span className="crumbs__sep" aria-hidden="true">›</span>
          </>
        ) : null}
        <span className="crumbs__here">{item.name_en}</span>
      </nav>
      <RecordVisit kind={section.recentKind} id={item.id} name={displayName} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'หน้าแรก', path: '/' },
          { name: section.label, path: section.basePath },
          { name: item.name_en, path: detailPath },
        ])}
      />
      <JsonLd
        data={entityJsonLd({
          path: detailPath,
          name: displayName,
          description: item.description_th ?? item.description,
          properties: [
            ...(item.category ? [{ name: 'Category', value: item.category }] : []),
            ...(item.weapon_type ? [{ name: 'Type', value: item.weapon_type }] : []),
            ...(item.atk !== null ? [{ name: 'ATK', value: item.atk }] : []),
            ...(item.required_level !== null ? [{ name: 'RequiredLevel', value: item.required_level }] : []),
            ...(item.buy_price ? [{ name: 'BuyPrice', value: item.buy_price, unitText: 'Zeny' }] : []),
            ...(item.sell_price ? [{ name: 'SellPrice', value: item.sell_price, unitText: 'Zeny' }] : []),
            ...(item.slots > 0 ? [{ name: 'Slots', value: item.slots }] : []),
          ],
        })}
      />

      {/* Hero: sprite, name, and the chips that say what slot this fills --
          the question a player asks before any number on the page matters. */}
      <div className="equiphero">
        <ItemIcon iconUrl={item.icon_url} category={item.category} size={64} />
        <div>
          <h1 className="pagehead__title">
            {item.name_en}
            {item.slots > 0 && <span className="mono" style={{ color: 'var(--cyan)' }}> [{item.slots}]</span>}
          </h1>
          <p className="equiphero__chips">
            <span className="tag">{categoryLabel}</span>
            {item.weapon_type && <span className="tag">{item.weapon_type}</span>}
            {item.weapon_level !== null && <span className="tag">Weapon Lv {item.weapon_level}</span>}
            <span className="tag mono">ID {item.id}</span>
          </p>
          {/* One liftable sentence carrying the same facts as the tiles below
              (GEO audit): a crawler or an answer engine can quote it whole. */}
          <p className="muted" style={{ marginTop: 6, maxWidth: '65ch' }}>
            {item.name_en} เป็น{categoryLabel}
            {item.weapon_type ? ` ชนิด ${item.weapon_type}` : ''}
            {item.atk !== null ? ` ATK ${item.atk}` : ''}
            {item.required_level !== null ? ` ใส่ได้ที่เลเวล ${item.required_level}` : ''}
            {rows.length > 0 && lowest?.monsters
              ? ` ดรอปจากมอนสเตอร์ ${rows.length} ชนิด ตัวเลเวลต่ำสุดคือ ${lowest.monsters.name_en} (Lv.${lowest.monsters.level ?? '—'}${lowest.rate != null ? ` อัตรา ${lowest.rate}%` : ''})`
              : ''}
          </p>
        </div>
      </div>

      {item.equippable_classes.length > 0 && (
        <p className="muted" style={{ marginTop: 12 }}>สวมใส่ได้: {item.equippable_classes.join(', ')}</p>
      )}

      <div className="statgrid" style={{ marginTop: 16 }}>
        {item.atk !== null && (
          <div className="statgrid__cell">
            <span className="reward-label">ATK</span>
            <span className="reward-value mono">{item.atk}</span>
          </div>
        )}
        {item.slots !== null && item.slots !== undefined && (
          <div className="statgrid__cell">
            <span className="reward-label">Slot</span>
            <span className="reward-value mono">{item.slots > 0 ? `[${item.slots}]` : 'ไม่มี'}</span>
          </div>
        )}
        {item.weapon_level !== null && (
          <div className="statgrid__cell">
            <span className="reward-label">Weapon Lv</span>
            <span className="reward-value mono">{item.weapon_level}</span>
          </div>
        )}
        {item.required_level !== null && (
          <div className="statgrid__cell">
            <span className="reward-label">ใช้ได้ที่เลเวล</span>
            <span className="reward-value mono">{item.required_level}</span>
          </div>
        )}
        <div className="statgrid__cell">
          <span className="reward-label">ราคาซื้อ</span>
          <span className="reward-value mono">
            {item.buy_price === null ? '—' : item.buy_price.toLocaleString('en-US')}
          </span>
        </div>
        <div className="statgrid__cell">
          <span className="reward-label">ราคาขาย</span>
          <span className="reward-value mono">
            {item.sell_price === null ? '—' : item.sell_price.toLocaleString('en-US')}
          </span>
        </div>
        {item.weapon_level !== null && item.weapon_level >= 1 && (
          <Link href="/tools/refine" className="statgrid__cell statgrid__cell--link">
            <span className="reward-label">ตีบวกตัวนี้</span>
            <span className="reward-value">คิดต้นทุน →</span>
          </Link>
        )}
      </div>

      {randomOptions && randomOptions.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <RandomOptionsCard lines={randomOptions} />
        </div>
      )}

      {item.description && (
        <div className="card" style={{ marginTop: 20 }}>
          <h2 className="section-title">คำอธิบาย</h2>
          <DescriptionLanguageToggle
            thaiLines={composeThaiDescription(item.description, dict).map((l) => l.thai ?? l.source)}
            englishLines={item.description.split('\n').map((l: string) => l.replace(/\^[0-9a-fA-F]{6}/g, '').trim()).filter((l: string) => l !== '')}
          />
        </div>
      )}

      <div className="card" style={{ marginTop: 20 }}>
        <h2 style={{ fontFamily: 'var(--font-chakra), sans-serif', marginBottom: 10 }}>มอนสเตอร์ที่ดรอปของนี้</h2>
        {droppedByError ? (
          <p style={{ color: 'var(--faint)' }}>โหลดข้อมูลมอนสเตอร์ที่ดรอปไม่สำเร็จ ลองใหม่อีกครั้ง</p>
        ) : (droppedBy ?? []).length === 0 ? (
          <p style={{ color: 'var(--faint)' }}>ไม่มีข้อมูลมอนสเตอร์ที่ดรอปชิ้นนี้</p>
        ) : (
          (droppedBy ?? []).map((d: any, i: number) => (
            <div key={i} className={isCVariant(d.monsters.name_en) ? 'cvariant' : undefined} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0' }}>
              <Link href={`/database/monsters/${d.monsters.id}`} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {d.monsters.image_url && (
                  <img src={d.monsters.image_url} alt="" width={20} height={20} style={{ imageRendering: 'pixelated' }} />
                )}
                {d.monsters.name_en}
              </Link>
              <span className="mono">{d.rate != null ? `${d.rate}%` : '?'}</span>
            </div>
          ))
        )}
      </div>

      <div style={{ marginTop: 20 }}>
        <FeedbackButton pageType={section.feedbackPageType} entityId={String(item.id)} />
      </div>
    </main>
  );
}
