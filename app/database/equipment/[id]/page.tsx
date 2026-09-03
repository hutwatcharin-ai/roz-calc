// app/database/equipment/[id]/page.tsx
//
// Gear gets its own detail route, split off /database/items/[id] on 3 Sep 2026.
// Weapons and armour were rendering through the same template as potions and
// crafting junk, so a Claymore read as one more generic row -- and the pages a
// player actually plans around were the ones with the least structure. The two
// routes redirect to each other on a category mismatch, so a row has exactly
// one canonical URL either way (see lib/item-href.ts for the rule they share).
import { isCVariant } from '@/lib/c-variant';
import JsonLd from '@/components/JsonLd';
import { breadcrumbJsonLd, entityJsonLd } from '@/lib/jsonld';
import Link from 'next/link';
import RecordVisit from '@/components/RecordVisit';
import ItemIcon from '@/components/ItemIcon';
import { supabaseBrowser } from '@/lib/supabase';
import FeedbackButton from '@/components/FeedbackButton';
import DescriptionLanguageToggle from '@/components/DescriptionLanguageToggle';
import RandomOptionsCard from '@/components/RandomOptionsCard';
import { composeThaiDescription } from '@/lib/item-description-th';
import { fetchAllRows } from '@/lib/fetch-all-rows';
import { randomOptionsFor } from '@/lib/random-options';
import { isEquipmentCategory } from '@/lib/item-href';
import type { Metadata } from 'next';
import { cache } from 'react';
import { notFound, permanentRedirect } from 'next/navigation';

export const revalidate = 86400;

export async function generateStaticParams() {
  return [];
}

const CATEGORY_LABELS: Record<string, string> = {
  Weapon: 'อาวุธ',
  Armor: 'เกราะ/สวมใส่',
  'Costume Equipment': 'คอสตูม',
};

const getItem = cache(async (id: number) => {
  return await supabaseBrowser().from('items').select('*').eq('id', id).maybeSingle();
});

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const { data: item, error } = await getItem(Number(params.id));

  // A failed query says nothing about whether the row exists, so it makes no
  // title claim either way rather than telling a crawler a live page is dead.
  if (error) {
    console.error('equipment detail query failed (metadata)', error);
    return {};
  }

  if (!item) return { title: 'ไม่พบอุปกรณ์ชิ้นนี้' };

  const parts: string[] = [];
  if (item.weapon_type) parts.push(item.weapon_type);
  if (item.atk !== null) parts.push(`ATK ${item.atk}`);
  if (item.required_level !== null) parts.push(`ใช้ได้ที่เลเวล ${item.required_level}`);

  return {
    title: `${item.name_en}${item.slots > 0 ? ` [${item.slots}]` : ''} — ค่าพลังและออปชั่นสุ่ม`,
    description: `${item.name_en}${parts.length ? ` ${parts.join(' ')}` : ''} — อาชีพที่ใส่ได้ ออปชั่นสุ่มที่ทอยได้ และมอนสเตอร์ที่ดรอปใน RO Zero Thai`,
  };
}

export default async function EquipmentDetailPage({ params }: { params: { id: string } }) {
  const db = supabaseBrowser();
  const id = Number(params.id);

  const { data: item, error } = await getItem(id);

  if (error) {
    console.error('equipment detail query failed', error);
    return <main className="shell" style={{ paddingBlock: 32 }}>เกิดข้อผิดพลาด ลองใหม่อีกครั้ง</main>;
  }

  if (!item) {
    notFound();
  }

  // A non-gear id under this route has a canonical home on the item route.
  // Redirect rather than render, so the same row can never be served (and
  // indexed) at two URLs.
  if (!isEquipmentCategory(item.category)) {
    permanentRedirect(`/database/items/${id}`);
  }

  const { data: droppedBy, error: droppedByError } = await db
    .from('monster_drops')
    .select('rate, monsters(id, name_en, image_url, level)')
    .eq('item_id', id)
    .order('rate', { ascending: false });
  if (droppedByError) console.error('equipment dropped-by query failed', droppedByError);

  // Paginated, not a bare select(): PostgREST caps at 1,000 rows and stays
  // silent when it truncates, which would render hundreds of items' effects in
  // English with no error to show for it.
  const [{ data: lineRows, error: linesError }, { data: termRows, error: termsError }] =
    await Promise.all([
      fetchAllRows<{ source_line: string; thai_line: string }>((from, to) =>
        db
          .from('item_description_lines')
          .select('source_line, thai_line')
          .order('source_line')
          .range(from, to),
      ),
      fetchAllRows<{ source_term: string; thai_term: string | null }>((from, to) =>
        db
          .from('item_description_terms')
          .select('source_term, thai_term')
          .order('source_term')
          .range(from, to),
      ),
    ]);

  if (linesError) console.error('item description lines query failed', linesError);
  if (termsError) console.error('item description terms query failed', termsError);

  const dict = {
    lines: new Map((lineRows ?? []).map((r) => [r.source_line, r.thai_line])),
    terms: new Map((termRows ?? []).map((r) => [r.source_term, r.thai_term])),
  };

  const displayName = item.slots > 0 ? `${item.name_en} [${item.slots}]` : item.name_en;
  const categoryLabel = CATEGORY_LABELS[item.category ?? ''] ?? item.category ?? 'อุปกรณ์';
  const randomOptions = randomOptionsFor(item.category, item.weapon_type, item.weapon_level);

  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <nav className="crumbs" aria-label="ตำแหน่งหน้า">
        <Link href="/database/equipment">อุปกรณ์</Link>
        <span className="crumbs__sep" aria-hidden="true">›</span>
        <Link href={`/database/equipment?category=${encodeURIComponent(item.category ?? '')}`}>{categoryLabel}</Link>
        <span className="crumbs__sep" aria-hidden="true">›</span>
        <span className="crumbs__here">{item.name_en}</span>
      </nav>
      <RecordVisit kind="equipment" id={item.id} name={displayName} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'หน้าแรก', path: '/' },
          { name: 'อุปกรณ์', path: '/database/equipment' },
          { name: item.name_en, path: `/database/equipment/${item.id}` },
        ])}
      />
      <JsonLd
        data={entityJsonLd({
          path: `/database/equipment/${item.id}`,
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

      {/* Hero: sprite, name, and the chips that say what slot this fills and
          who can wear it -- the two questions a player asks before any number
          on the page matters. */}
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
          {(() => {
            const rows = (droppedBy ?? []).filter((d: any) => d.monsters && !isCVariant(d.monsters.name_en));
            const lowest = rows.length
              ? rows.reduce((a: any, b: any) => ((b.monsters.level ?? 999) < (a.monsters.level ?? 999) ? b : a))
              : null;
            return (
              <p className="muted" style={{ marginTop: 6, maxWidth: '65ch' }}>
                {item.name_en} เป็น{categoryLabel}
                {item.weapon_type ? ` ชนิด ${item.weapon_type}` : ''}
                {item.atk !== null ? ` ATK ${item.atk}` : ''}
                {item.required_level !== null ? ` ใส่ได้ที่เลเวล ${item.required_level}` : ''}
                {rows.length > 0 && lowest?.monsters
                  ? ` ดรอปจากมอนสเตอร์ ${rows.length} ชนิด ตัวเลเวลต่ำสุดคือ ${(lowest.monsters as any).name_en} (Lv.${(lowest.monsters as any).level ?? '—'}${lowest.rate != null ? ` อัตรา ${lowest.rate}%` : ''})`
                  : ''}
              </p>
            );
          })()}
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
          <p style={{ color: 'var(--faint)' }}>ไม่มีข้อมูลมอนสเตอร์ที่ดรอปอุปกรณ์ชิ้นนี้</p>
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
        <FeedbackButton pageType="equipment" entityId={String(item.id)} />
      </div>
    </main>
  );
}
