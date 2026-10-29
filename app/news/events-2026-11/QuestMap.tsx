// app/news/events-2026-11/QuestMap.tsx
//
// Where the Gatchaman quest sends you, pinned on the Morocc minimap (owner,
// 29 Oct 2026: "mark the quest's places on a big, easy map"). Only places
// the official notice (roz.mygnjoy.com event 174) gives: the Rift Receptionist
// who starts the main quest, and the Gatchaman base where Ken, Jun and Joe
// stand. The client quest log's in-between stops did not match the game.
// Three looks for the owner to pick from.
//
// The minimap is the client's texture/유저인터페이스/map/morocc.bmp (512 px)
// and covers the whole map: morocc.gat is 320x320 cells, y counts up from the
// bottom.
import NaviCopy from '@/components/NaviCopy';

const W = 320;
const IMG = '/images/events/2026-11';

const START = { x: 196, y: 261 };
const BASE = [
  { x: 29, y: 193, who: 'Ken', what: 'เควส Berg Katse (รายวัน)', img: 'ken' },
  { x: 32, y: 194, who: 'Jun', what: 'เควสรายวัน 3 อย่าง', img: 'jun' },
  { x: 34, y: 192, who: 'Joe', what: 'แลกของด้วยปุ่ม Mid Missile', img: 'joe' },
];
const MID = { x: 31, y: 193 };

// The four gates, read off the minimap.
const GATES = [
  { x: 160, y: 300, t: 'ประตูเหนือ' },
  { x: 160, y: 12, t: 'ประตูใต้' },
  { x: 306, y: 208, t: 'ตะวันออก' },
  { x: 14, y: 160, t: 'ตะวันตก' },
];

const pos = (x: number, y: number) => ({ left: `${(x / W) * 100}%`, top: `${(1 - y / W) * 100}%` });

function Base({ dim, children }: { dim?: boolean; children: React.ReactNode }) {
  return (
    <div className={'qmap__box' + (dim ? ' qmap__box--dim' : '')}>
      <img src="/images/maps/morocc.png" alt="แผนที่ Morocc" width={512} height={512} />
      {children}
    </div>
  );
}

// The base up close: 40x40 cells around it, so the three NPCs come apart.
const Z = 20;
function BaseZoom() {
  const scale = W / (Z * 2);
  return (
    <div className="qmap__zoom">
      <div className="qmap__zoomin">
        <img
          src="/images/maps/morocc.png"
          alt="ฐาน Gatchaman ขยาย"
          style={{
            width: `${scale * 100}%`,
            left: `${-((MID.x - Z) / W) * scale * 100}%`,
            top: `${-((W - MID.y - Z) / W) * scale * 100}%`,
          }}
        />
        {BASE.map((b) => (
          <span key={b.who} className="qmap__zpin" style={{ left: `${((b.x - MID.x + Z) / (Z * 2)) * 100}%`, top: `${((MID.y - b.y + Z) / (Z * 2)) * 100}%` }}>
            <img src={`${IMG}/${b.img}.png`} alt="" loading="lazy" />
            <b>{b.who}</b>
          </span>
        ))}
      </div>
      <p>ขยายฐาน Gatchaman</p>
    </div>
  );
}

function Legend() {
  return (
    <ol className="qmap__legend">
      <li>
        <span className="qmap__num">1</span>
        <span className="qmap__who"><b>[Urgent] Anomalous Rift Receptionist</b><small>เริ่มเควสหลัก</small></span>
        <NaviCopy cmd={`/navi morocc ${START.x}/${START.y}`} />
      </li>
      {BASE.map((b) => (
        <li key={b.who}>
          <span className="qmap__num qmap__num--p3">2</span>
          <span className="qmap__who"><b>{b.who}</b><small>{b.what}</small></span>
          <NaviCopy cmd={`/navi morocc ${b.x}/${b.y}`} />
        </li>
      ))}
    </ol>
  );
}

/** A: start and base, the walk between them, the base enlarged. */
export function QuestMapRoute() {
  const trail = `${START.x},${W - START.y} 120,${W - 245} 60,${W - 215} ${MID.x + 3},${W - MID.y - 3}`;
  return (
    <figure className="qmap">
      <div className="qmap__side">
        <Base>
          <svg className="qmap__svg" viewBox={`0 0 ${W} ${W}`} preserveAspectRatio="none" aria-hidden="true">
            <polyline points={trail} className="qmap__line" />
          </svg>
          <span className="qmap__pin qmap__pin--start" style={pos(START.x, START.y)}>1 เริ่ม</span>
          <span className="qmap__pin qmap__pin--p3" style={pos(MID.x, MID.y)}>2 ฐาน</span>
          <span className="qmap__note" style={pos(110, 222)}>เดินตามเบาะแสชาวเมือง<br />ดูหน้าต่างเควส Alt+U</span>
        </Base>
        <BaseZoom />
      </div>
      <figcaption>1 = คนเริ่มเควสหลัก · 2 = ฐาน Gatchaman ที่จบเควสและทำรายวันทุกวัน · กดปุ่มก๊อปแล้ววางในแชตเกมเพื่อเดินไปเอง</figcaption>
      <Legend />
    </figure>
  );
}

/** B: the characters' own faces where they stand. */
export function QuestMapFaces() {
  return (
    <figure className="qmap">
      <Base>
        <span className="qmap__face" style={pos(START.x, START.y)}>
          <span className="qmap__faceart"><img src={`${IMG}/rift-receptionist.png`} alt="" loading="lazy" /></span>
          <b><i>1</i>Rift Receptionist · เริ่มเควส</b>
        </span>
        <span className="qmap__face qmap__face--base" style={pos(MID.x, MID.y)}>
          <span className="qmap__faceart">
            {BASE.map((b) => <img key={b.who} src={`${IMG}/${b.img}.png`} alt="" loading="lazy" />)}
          </span>
          <b><i>2</i>Ken · Jun · Joe</b>
        </span>
      </Base>
      <figcaption>รูปตัวละครอยู่ตรงที่ยืนจริงในเมือง</figcaption>
      <Legend />
    </figure>
  );
}

/** C: what to do where, in two colours, with the gates named. */
export function QuestMapParts() {
  return (
    <figure className="qmap qmap--parts">
      <div className="qmap__side">
        <Base dim>
          {GATES.map((g) => (
            <span key={g.t} className="qmap__gate" style={pos(g.x, g.y)}>{g.t}</span>
          ))}
          <span className="qmap__pin qmap__pin--p1" style={pos(START.x, START.y)}>1</span>
          <span className="qmap__pin qmap__pin--p3" style={pos(MID.x, MID.y)}>2</span>
        </Base>
        <div className="qmap__parts">
          <div className="qmap__part qmap__part--yellow">
            <p><i>1</i> เริ่มเควสหลัก (ครั้งเดียว)</p>
            <ul>
              <li>Rift Receptionist <small>เหนือสระน้ำกลางเมือง</small></li>
              <li><NaviCopy cmd={`/navi morocc ${START.x}/${START.y}`} /></li>
              <li><small>แล้วเดินตามเบาะแสชาวเมือง ดู Alt+U</small></li>
            </ul>
          </div>
          <div className="qmap__part qmap__part--pink">
            <p><i>2</i> ฐาน Gatchaman (ทุกวัน)</p>
            <ul>
              {BASE.map((b) => (
                <li key={b.who}>{b.who} <small>{b.what}</small><br /><NaviCopy cmd={`/navi morocc ${b.x}/${b.y}`} /></li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <figcaption>เหลือง = เริ่มเควสหลัก · ชมพู = ฐานที่ต้องกลับมาทุกวัน ใกล้ประตูตะวันตก</figcaption>
    </figure>
  );
}
