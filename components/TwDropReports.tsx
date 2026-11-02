// Costume drops players report on the Taiwan server (lib/costume-drops-tw),
// shown under the Global data with a label so nobody reads them as Global
// game data. Two shapes: on a costume page, the monsters; on a monster page,
// the costumes.

import Link from 'next/link';
import ItemIcon from '@/components/ItemIcon';
import { COSTUME_CATEGORY } from '@/lib/item-href';
import { costumeId } from '@/lib/costume-twins';
import { TW_SHEET_EDITED, TW_SOURCE_URL, thaiDate, twMonsterLabel, type TwMonster, type TwReport } from '@/lib/costume-drops-tw';

function Badge() {
  return <span className="twdrops__badge">ผู้เล่นรายงาน · เซิร์ฟ TW</span>;
}

function Source() {
  return (
    <p className="twdrops__src">
      ที่มา: ตารางที่ผู้เล่นไต้หวันรวบรวม (แก้ล่าสุด {thaiDate(TW_SHEET_EDITED)}) ผ่าน{' '}
      <a href={TW_SOURCE_URL} target="_blank" rel="noopener noreferrer">กระทู้บาฮามุท</a> · ยังไม่มีใครยืนยันใน Global
    </p>
  );
}

export function TwMonsterName({ m }: { m: TwMonster }) {
  if (m.id === null) {
    return (
      <span>
        <strong>{twMonsterLabel(m)}</strong> <span className="twdrops__none">ยังไม่มีมอนตัวนี้ใน Global</span>
      </span>
    );
  }
  return (
    <span>
      <Link href={`/database/monsters/${m.id}`} className="twdrops__mob">{twMonsterLabel(m)}</Link>{' '}
      <span className="muted">({m.name_zh})</span>
    </span>
  );
}

/** Costume page: which monsters drop this on TW. */
export function TwDroppersCard({ reports, hasGlobal }: { reports: TwReport[]; hasGlobal: boolean }) {
  if (reports.length === 0) return null;
  const monsters = reports.flatMap((r) => r.monsters);
  const guess = reports.some((r) => r.guess);
  return (
    <div className="twdrops" style={hasGlobal ? { marginTop: 14 } : undefined}>
      <p className="twdrops__head">
        <Badge /> {hasGlobal ? 'เซิร์ฟไต้หวันมีมอนดรอปเพิ่ม:' : 'Global ยังไม่มีข้อมูลมอนที่ดรอป แต่เซิร์ฟไต้หวันมีรายงานว่าดรอปจาก:'}
      </p>
      <ul className="twdrops__list">
        {monsters.map((m) => (
          <li key={`${m.id}-${m.name_zh}`}><TwMonsterName m={m} /></li>
        ))}
      </ul>
      {guess && <p className="twdrops__src">ชื่อในเซิร์ฟ TW คือ {reports.map((r) => r.name_zh).join(', ')} จับคู่กับชิ้นนี้จากความหมายของชื่อ</p>}
      <Source />
    </div>
  );
}

/** Monster page: which costumes this monster drops on TW. */
export function TwCostumesCard({ reports }: { reports: TwReport[] }) {
  if (reports.length === 0) return null;
  return (
    <div className="twdrops" style={{ marginTop: 14 }}>
      <p className="twdrops__head"><Badge /> เซิร์ฟไต้หวันรายงานว่ามอนตัวนี้ดรอปคอสตูม:</p>
      <ul className="twdrops__list">
        {reports.map((r) => (
          <li key={r.item_id} className="twdrops__costume">
            <ItemIcon iconUrl={`/images/items/${r.item_id}.gif`} category={COSTUME_CATEGORY} size={24} />
            <span className="twdrops__kind">คอสตูม</span>
            <Link href={`/database/costumes/${costumeId(r.item_id)}`} className="twdrops__mob">{r.name}</Link>
            <span className="muted">({r.name_zh})</span>
          </li>
        ))}
      </ul>
      <Source />
    </div>
  );
}
