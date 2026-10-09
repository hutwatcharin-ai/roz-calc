// The shared body of every crafting guide: the source caveat, the confirmed
// recipes, and the rest kept apart with the reason they are kept apart.
//
// One component because the guides differ only in their intro and which
// kind they list -- and because the honesty rule has to be applied the same
// way on all of them. A list that quietly mixed 212 confirmed arrow recipes
// with 5 unconfirmed ones would look identical to one that did not, which is
// exactly the failure mode to design out.
//
// Two views (owner, 8 Oct 2026): cards with search and filter chips, which
// every guide now uses, and the old table, which the arrow guide keeps under
// its own picker for reading every recipe at once.

import Caveat from '@/components/Caveat';
import RecipeTable from '@/components/RecipeTable';
import RecipeCards from '@/components/RecipeCards';
import RecipeFilter, { type RecipeFacet } from '@/components/RecipeFilter';
import { recipesOfKind, splitByConfidence, type CraftKind, type Recipe } from '@/lib/crafting';

export default function CraftGuide({
  kind,
  children,
  extra,
  sortBy = 'product',
  view = 'cards',
  facets,
  tagsOf,
  badgeOf,
  placeholder = 'ค้นชื่อของที่ได้ หรือวัตถุดิบ',
  title,
  calc = false,
}: {
  kind: CraftKind;
  /** Which column the reader looks things up in. See sortRecipes. */
  sortBy?: 'product' | 'material';
  view?: 'cards' | 'table';
  /** Filter chip rows; each option value must appear in tagsOf for its recipes. */
  facets?: RecipeFacet[];
  tagsOf?: (r: Recipe) => string[];
  badgeOf?: (r: Recipe) => string | null;
  placeholder?: string;
  /** Section heading over the cards. */
  title?: string;
  /** Cards get a quantity control; the page wraps this in a CraftCalc. */
  calc?: boolean;
  /** The guide's own intro: what the skill is, who gets it, how it plays. */
  children: React.ReactNode;
  /** Anything after the recipes (rate advice, related links). */
  extra?: React.ReactNode;
}) {
  const { confirmed, unconfirmed } = splitByConfidence(recipesOfKind(kind), sortBy);
  const total = confirmed.length + unconfirmed.length;

  const caveat = (
    <Caveat label="ที่มาของสูตร">
      <strong>ที่มาของสูตร:</strong> ทานกัน 2 แหล่ง ตารางการผลิตฝั่งเซิร์ฟเวอร์ของ{' '}
      <a href="https://github.com/rathena/rathena" rel="noopener nofollow" target="_blank">rAthena</a>{' '}
      (RO คลาสสิก) กับฐานข้อมูล Zero ของ prontera.info · เอาเฉพาะสูตรที่ทั้งของที่ได้และวัตถุดิบทุกตัว
      มีจริงในฐานข้อมูลไอเทม{' '}
      <strong>{confirmed.length} จาก {total} สูตรตรงกันทั้ง 2 แหล่ง</strong>{' '}
      {view === 'cards' ? 'ที่เหลือซ่อนไว้ ติ๊ก "รวมสูตรที่ยังไม่ยืนยัน" เพื่อดู' : 'ที่เหลืออยู่ในส่วนล่างพร้อมป้ายบอก'}
      {' '}· ตัวเลขอัตราสำเร็จไม่ได้ทดสอบในเกมจริง
    </Caveat>
  );

  if (view === 'cards') {
    return (
      <>
        {children}
        <section className="card rguide" style={{ marginTop: 16 }}>
          <h2 className="section-title">{title ?? `สูตรทั้งหมด (${confirmed.length})`}</h2>
          {total > 8 && <RecipeFilter group={kind} facets={facets} placeholder={placeholder} unsureCount={unconfirmed.length} />}
          <RecipeCards group={kind} rows={[...confirmed, ...unconfirmed]} tagsOf={tagsOf} badgeOf={badgeOf} calc={calc} />
          {total <= 8 && unconfirmed.length > 0 && (
            <p className="muted" style={{ marginTop: 10 }}>มีอีก {unconfirmed.length} สูตรที่ยังไม่ยืนยันกับ Zero ไม่ได้แสดง</p>
          )}
        </section>
        {caveat}
        {extra}
      </>
    );
  }

  return (
    <>
      {children}

      {caveat}

      {confirmed.length > 0 && (
        <div className="card" style={{ marginTop: 16 }}>
          <h2 className="section-title">สูตรที่ตรงกัน 2 แหล่ง ({confirmed.length})</h2>
          <RecipeTable rows={confirmed} materialFirst={sortBy === 'material'} />
        </div>
      )}

      {unconfirmed.length > 0 && (
        <details className="disclose" style={{ marginTop: 16 }}>
          <summary>
            สูตรที่ยังยืนยันไม่ได้
            <span className="disclose__count">{unconfirmed.length} สูตร</span>
          </summary>
          <div className="disclose__body">
            <p className="muted" style={{ marginTop: 0 }}>
              มีอยู่ในแหล่งเดียว อาจใช้ได้จริงใน Zero หรืออาจเป็นสูตรของ RO เวอร์ชันอื่น
              ชี้เมาส์ที่ป้ายเพื่อดูว่ามาจากไหน
            </p>
            <RecipeTable rows={unconfirmed} materialFirst={sortBy === 'material'} />
          </div>
        </details>
      )}

      {extra}
    </>
  );
}
