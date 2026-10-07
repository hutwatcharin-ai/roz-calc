// The build simulator on the homepage: a strip under the hero that sends
// players to /tools/build (owner, 7 Oct 2026). Plain on purpose: no saved
// builds, nothing read from the browser -- the owner found anything about
// "your build" here confusing. One button, and a status window showing what
// the tool works out. A server component: no JavaScript reaches the page.
//
// The owner picked this look (a status window) over an arcade parade of
// classes and a class-select roster, on 7 Oct 2026.

import Link from 'next/link';

// Real numbers: the owner's own Blacksmith Lv 60, checked against the game's
// status window on 7 Oct 2026 (docs/GAME_MODEL.md).
const SAMPLE: [string, string][] = [['HIT', '268'], ['FLEE', '248'], ['ASPD', '168'], ['CRI', '21']];

export default function HomeBuildStrip() {
  return (
    <section className="homebuild" aria-labelledby="homebuild-h">
      <div className="homebuild__body">
        <p className="homebuild__kicker mono">▶ BUILD SIMULATOR</p>
        <h2 id="homebuild-h" className="homebuild__title">จำลองบิลด์ ลองก่อนลงแต้มจริง</h2>
        <p className="homebuild__lead">อัปสเตตัส ใส่ของ ตีบวก การ์ด แล้วดูค่าในหน้าต่างสเตตัส ก่อนลงแต้มจริงในเกม</p>
        <Link href="/tools/build" className="homebuild__go">
          เริ่มจำลองบิลด์ <span aria-hidden="true">▶</span>
        </Link>
      </div>
      <div className="homebuild__window" aria-hidden="true">
        <p className="homebuild__wintitle mono">STATUS · Blacksmith Lv 60</p>
        <dl>
          {SAMPLE.map(([k, v]) => (
            <div key={k}>
              <dt className="mono">{k}</dt>
              <dd className="mono">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="homebuild__winnote">ตัวอย่างจากตัวละครจริง ตรงกับหน้าต่างในเกม</p>
      </div>
    </section>
  );
}
