// "อยากได้ HIT/FLEE เพิ่ม กินอะไร" -- the food and buff items that raise HIT,
// FLEE or CRI, biggest first (lib/food-buffs, owner 6 Oct 2026). Server
// component, plain links: it answers the question the HIT/FLEE table raises.

import Link from 'next/link';
import { foodsFor, foodText, type Aim } from '@/lib/food-buffs';

const AIMS: { aim: Aim; title: string }[] = [
  { aim: 'hit', title: 'เพิ่ม HIT' },
  { aim: 'flee', title: 'เพิ่ม FLEE' },
  { aim: 'crit', title: 'เพิ่ม CRI' },
];

export default function FoodBuffList({ top = 8 }: { top?: number }) {
  return (
    <section className="card" style={{ marginTop: 20 }} aria-labelledby="foods-title">
      <h2 id="foods-title" className="section-title">อาหารและบัฟที่ช่วย</h2>
      <div className="foodbuffs">
        {AIMS.map(({ aim, title }) => (
          <div key={aim}>
            <h3 className="mapdrops__title">{title}</h3>
            <ol className="foodbuffs__list">
              {foodsFor(aim).slice(0, top).map(({ food, gain }) => (
                <li key={food.id}>
                  <Link href={`/database/items/${food.id}`}>{food.name}</Link>
                  <span className="mono foodbuffs__gain">≈ +{Math.floor(gain * 10) / 10}</span>
                  <small className="muted">{foodText(food)}</small>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
      <p className="muted" style={{ marginTop: 10, fontSize: 12.5 }}>
        คิดจากสูตรที่วัดในเกมแล้ว: DEX และ HIT เพิ่ม HIT 1 ต่อ 1, AGI และ FLEE เพิ่ม FLEE 1 ต่อ 1, LUK เพิ่ม HIT 1/3 FLEE 1/5 CRI 0.3 ·
        รายการอาหารจาก roz.prontera.info · อาหารสเตตัสเดียวกันซ้อนกันได้ไหม ตรวจในเกมก่อน
      </p>
    </section>
  );
}
