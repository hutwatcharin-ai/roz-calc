// The build simulator on the homepage: a strip under the hero that sends
// players to /tools/build (owner, 7 Oct 2026). Plain on purpose: no saved
// builds, nothing read from the browser -- the owner found anything about
// "your build" here confusing. One button, and something nice to look at.
// A server component: no JavaScript reaches the page for it.
//
// Three looks for the owner to choose from (?hb=1|2|3); the pick stays,
// the others go.

import Link from 'next/link';

const PARADE = ['knight', 'wizard', 'hunter', 'priest', 'assassin', 'blacksmith'];
const SELECT = ['knight', 'wizard', 'hunter', 'priest', 'assassin', 'blacksmith', 'monk', 'dancer'];

function Go({ label }: { label: string }) {
  return (
    <Link href="/tools/build" className="homebuild__go">
      {label} <span aria-hidden="true">▶</span>
    </Link>
  );
}

export default function HomeBuildStrip({ variant = 1 }: { variant?: 1 | 2 | 3 }) {
  if (variant === 2) {
    // The status window the tool works out, with real numbers: the owner's
    // own Blacksmith, checked against the game's window on 7 Oct 2026.
    const rows: [string, string][] = [['HIT', '268'], ['FLEE', '248'], ['ASPD', '168'], ['CRI', '21']];
    return (
      <section className="homebuild homebuild--stat" aria-labelledby="homebuild-h">
        <div className="homebuild__body">
          <p className="homebuild__kicker mono">▶ BUILD SIMULATOR</p>
          <h2 id="homebuild-h" className="homebuild__title">จำลองบิลด์ ลองก่อนลงแต้มจริง</h2>
          <p className="homebuild__lead">อัปสเตตัส ใส่ของ ตีบวก การ์ด แล้วดูค่าในหน้าต่างสเตตัส ก่อนลงแต้มจริงในเกม</p>
          <Go label="เริ่มจำลองบิลด์" />
        </div>
        <div className="homebuild__window" aria-hidden="true">
          <p className="homebuild__wintitle mono">STATUS · Blacksmith Lv 60</p>
          <dl>
            {rows.map(([k, v]) => (
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
  if (variant === 3) {
    return (
      <section className="homebuild homebuild--select" aria-labelledby="homebuild-h">
        <p className="homebuild__kicker mono">▶ SELECT YOUR CLASS</p>
        <div className="homebuild__roster" aria-hidden="true">
          {SELECT.map((c, i) => (
            <span key={c} className={i === 0 ? 'is-on' : undefined} style={{ ['--i' as string]: i }}>
              <img src={`/images/jobs/${c}.png`} alt="" width={56} height={56} loading="lazy" />
            </span>
          ))}
        </div>
        <div className="homebuild__row">
          <div>
            <h2 id="homebuild-h" className="homebuild__title">จำลองบิลด์ ลองก่อนลงแต้มจริง</h2>
            <p className="homebuild__lead">เลือกอาชีพ อัปสเตตัส ใส่ของ แล้วดูว่าตีโดนกี่ % หลบได้กี่ %</p>
          </div>
          <Go label="เริ่มจำลองบิลด์" />
        </div>
      </section>
    );
  }
  // 1: an arcade marquee, the classes marching along the floor.
  return (
    <section className="homebuild homebuild--marquee" aria-labelledby="homebuild-h">
      <div className="homebuild__body">
        <p className="homebuild__kicker mono">▶ BUILD SIMULATOR</p>
        <h2 id="homebuild-h" className="homebuild__title">จำลองบิลด์ ลองก่อนลงแต้มจริง</h2>
        <p className="homebuild__lead">อัปสเตตัส ใส่ของ ตีบวก การ์ด อาหาร แล้วดูค่าจริงก่อนลงแต้ม</p>
      </div>
      <div className="homebuild__parade" aria-hidden="true">
        {PARADE.map((c, i) => (
          <img key={c} src={`/images/jobs/${c}.png`} alt="" width={64} height={64} loading="lazy" style={{ ['--i' as string]: i }} />
        ))}
      </div>
      <Link href="/tools/build" className="homebuild__go homebuild__go--start">
        <span className="homebuild__press mono" aria-hidden="true">PRESS START</span>
        เริ่มจำลองบิลด์ <span aria-hidden="true">▶</span>
      </Link>
    </section>
  );
}
