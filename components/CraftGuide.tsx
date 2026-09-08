// The shared body of every crafting guide: the source caveat, the confirmed
// recipe table, and the rest folded away with the reason it is folded.
//
// One component because the five guides differ only in their intro and
// which kind they list -- and because the honesty rule has to be applied
// the same way on all of them. A table that quietly mixed 212 confirmed
// arrow recipes with 5 unconfirmed ones would look identical to one that
// did not, which is exactly the failure mode to design out.

import Caveat from '@/components/Caveat';
import RecipeTable from '@/components/RecipeTable';
import { recipesOfKind, splitByConfidence, type CraftKind } from '@/lib/crafting';

export default function CraftGuide({
  kind,
  children,
  extra,
  sortBy = 'product',
}: {
  kind: CraftKind;
  /** Which column the reader looks things up in. See sortRecipes. */
  sortBy?: 'product' | 'material';
  /** The guide's own intro: what the skill is, who gets it, how it plays. */
  children: React.ReactNode;
  /** Anything after the tables (rate advice, related links). */
  extra?: React.ReactNode;
}) {
  const { confirmed, unconfirmed } = splitByConfidence(recipesOfKind(kind), sortBy);
  const total = confirmed.length + unconfirmed.length;

  return (
    <>
      {children}

      <Caveat label="ที่มาของสูตร">
        <strong>ที่มาของสูตร:</strong> ทานกัน 2 แหล่ง — ตารางการผลิตฝั่งเซิร์ฟเวอร์ของ{' '}
        <a href="https://github.com/rathena/rathena" rel="noopener nofollow" target="_blank">rAthena</a>{' '}
        (RO คลาสสิก) กับฐานข้อมูล Zero ของ prontera.info · เอาเฉพาะสูตรที่ทั้งของที่ได้และวัตถุดิบทุกตัว
        มีจริงในฐานข้อมูลไอเทม {' '}
        <strong>{confirmed.length} จาก {total} สูตรตรงกันทั้ง 2 แหล่ง</strong> ที่เหลืออยู่ในส่วนล่างพร้อมป้ายบอก
        · ตัวเลขอัตราสำเร็จไม่ได้ทดสอบในเกมจริง
      </Caveat>

      {confirmed.length > 0 && (
        <div className="card" style={{ marginTop: 16 }}>
          <h2 className="section-title">สูตรที่ตรงกัน 2 แหล่ง ({confirmed.length})</h2>
          <RecipeTable rows={confirmed} showConfidence={false} materialFirst={sortBy === 'material'} />
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
              มีอยู่ในแหล่งเดียว — อาจใช้ได้จริงใน Zero หรืออาจเป็นสูตรของ RO เวอร์ชันอื่น
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
