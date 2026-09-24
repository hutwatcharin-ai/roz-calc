// app/guides/star-gear/page.tsx
//
// The ★ system: what an activated piece is, where the activation happens,
// what it costs, and how the refine bonuses are laid out.
//
// It does NOT list the weapons and armour. It used to, and that was the
// mistake: /database/equipment?q=★ returns the same rows off the same items
// table, so two pages were maintaining one list and competing for the same
// search. The equipment database is where a list of equipment belongs.
//
// Rewritten 24 Sep 2026 when the owner asked for more depth and plainer
// wording. What is new is all from the game's own data, read by
// scripts/build-star-gear.py into data/star-gear.json:
//
//   * the NPC. Every token's text carries a <NAVI> waypoint naming the NPC
//     and its map and coordinates, so the page can finally say where to go.
//     The old page never named it.
//   * the tier shapes. A plain ★ piece adds a bonus at +3, +7 and +9, while
//     a ★★ or ★★★ piece adds one every +2 refines and keeps going at +11.
//     That difference is the main thing a reader wants and it was missing.
//   * worked examples in the client's own Thai, for the pieces the client
//     has Thai text for.
//
// Every count on this page is a list length from that file, never typed.
import Link from 'next/link';
import type { Metadata } from 'next';
import PageHeader from '@/components/PageHeader';
import Caveat from '@/components/Caveat';
import ItemIcon from '@/components/ItemIcon';
import JsonLd from '@/components/JsonLd';
import AdSlot from '@/components/AdSlot';
import { breadcrumbJsonLd, faqJsonLd } from '@/lib/jsonld';
import { itemHref } from '@/lib/item-href';
import star from '@/data/star-gear.json';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'ของติดดาว ★ Ragnarok Zero — ปลุกที่ไหน เสียอะไร และ ★★ ต่างกันยังไง',
  description:
    'ของติดดาว ★ ใน Ragnarok Zero Global ปลุกกับ NPC Nagging Old Man ที่ Prontera 272,260 เสียขั้นตีบวก 3 หรือ 7 ขั้น ★ ได้โบนัสที่ +3 +7 +9 ส่วน ★★ กับ ★★★ ได้ทุก +2 และไปต่อถึง +11 พร้อมโทเคนของแต่ละชิ้น',
};

type Tier = { kind: string; refine: number; text: string };
type Piece = {
  id: number;
  name: string;
  stars: number;
  category: string | null;
  icon: string | null;
  requiredLevel: number | null;
  slots: number | null;
  lang: string;
  base: string;
  tiers: Tier[];
  footer: Record<string, string>;
};
type Token = { id: number; name: string; icon: string | null; category: string | null; namesNpc: boolean };

const NPC = star.npc;
const PIECES = star.items as Piece[];
const TOKENS = star.tokens as Token[];

const byStars = (n: number) => PIECES.filter((p) => p.stars === n);
const STAR_LEVELS = [1, 2, 3].map((n) => ({
  stars: n,
  pieces: byStars(n),
  weapons: byStars(n).filter((p) => p.category === 'Weapon'),
  armour: byStars(n).filter((p) => p.category === 'Armor'),
}));

/** How a star level's bonuses are laid out, written from the parsed tiers so
 *  the sentence cannot drift from the data. */
function tierShape(pieces: Piece[]): string {
  const every = pieces.filter((p) => p.tiers.some((t) => t.kind === 'every'));
  const steps = [...new Set(pieces.flatMap((p) => p.tiers.filter((t) => t.kind === 'at').map((t) => t.refine)))].sort(
    (a, b) => a - b,
  );
  const list = steps.map((s) => `+${s}`).join(' ');
  return every.length === pieces.length ? `ได้ทุก +2 และมีก้อนพิเศษที่ ${list}` : `ได้เป็นก้อนที่ ${list}`;
}

// From the mirrored guide (roz-global.info, 8 Sep 2026). The client says what
// a finished piece does, never what turning one into it costs.
const ACTIVATION = [
  { what: 'อาวุธ ★★', refine: '−3', materials: 'โทเคน ★★ ของชิ้นนั้น 3 อัน + Goblin Coin Shard 30' },
  { what: 'อาวุธ ★', refine: '−7', materials: 'โทเคน ★ ของชิ้นนั้น 100 อัน + Goblin Coin Shard 8' },
  { what: 'ชุดธรรมดา แบบ "นิ่ง"', refine: '−3', materials: 'โทเคน ★ ของชิ้นนั้น 100 อัน + Goblin Coin Shard 30' },
  { what: 'ชุดธรรมดา แบบ "แรง"', refine: '−7', materials: 'โทเคน ★ ของชิ้นนั้น 10 อัน + Goblin Coin Shard 3' },
];

// Three worked examples, chosen to cover the three shapes a reader meets: a
// plain melee ★ with flat bonuses, a ★ caster piece whose bonuses are
// percentages, and a ★★ that shows the every-+2 pattern. Ids rather than
// names so a rename cannot silently empty the section.
const EXAMPLES = [600070, 540118, 610096];

const FAQ = [
  {
    question: 'ปลุกของติดดาวที่ไหน',
    answer: `คุยกับ NPC ${NPC.name} ที่ ${NPC.map} พิกัด ${NPC.x},${NPC.y} ข้อความของโทเคนในเกมบอกพิกัดนี้ไว้เอง`,
  },
  {
    question: 'ปลุกแล้วเสียอะไร',
    answer: 'เสียขั้นตีบวก 3 หรือ 7 ขั้นแล้วแต่แบบที่เลือก การ์ด เอนแชนต์ และความสามารถเสริมไม่หาย ของ +10 ที่เสีย 7 ขั้นจะเหลือ +3',
  },
  {
    question: '★ กับ ★★ ต่างกันยังไง',
    answer: '★ ได้โบนัสเป็นก้อนที่ +3 +7 และ +9 ส่วน ★★ กับ ★★★ ได้โบนัสทุก ๆ 2 ขั้นที่ตีบวก และยังมีก้อนพิเศษที่ +7 +9 และ +11 จึงคุ้มกับการตีบวกสูง',
  },
  {
    question: 'โทเคนใช้ข้ามชิ้นได้ไหม',
    answer: 'ไม่ได้ โทเคนของชิ้นไหนใช้ปลุกได้เฉพาะชิ้นนั้น',
  },
];

function EffectText({ children }: { children: string }) {
  return <span className="star__effect">{children}</span>;
}

export default async function StarGearPage() {
  const example = EXAMPLES.map((id) => PIECES.find((p) => p.id === id)).filter((p): p is Piece => Boolean(p));

  return (
    <main className="shell star" style={{ paddingBlock: 32 }}>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'หน้าแรก', path: '/' },
          { name: 'ไกด์', path: '/guides' },
          { name: 'ของติดดาว', path: '/guides/star-gear' },
        ])}
      />
      <JsonLd data={faqJsonLd(FAQ)} />

      <PageHeader
        title="ของติดดาว ★ — ปลุกที่ไหน เสียอะไร และคุ้มตอนไหน"
        lead="ของติดดาวคือของธรรมดาที่เอาไปปลุกแล้ว ค่าพื้นฐานแรงขึ้น และได้โบนัสเพิ่มอีกชุดตามขั้นที่ตีบวกได้ ทำโดยเปลี่ยนของชิ้นนั้นเป็นโทเคน แล้วเอาโทเคนไปให้ NPC"
      />

      <nav className="jumpbar" aria-label="หัวข้อในหน้านี้">
        <a href="#sec-levels">★ มีกี่ระดับ</a>
        <a href="#sec-where">ปลุกที่ไหน</a>
        <a href="#sec-cost">เสียอะไร</a>
        <a href="#sec-refine">โบนัสตามขั้นตีบวก</a>
        <a href="#sec-token">โทเคน</a>
        <a href="#sec-faq">คำถามที่เจอบ่อย</a>
      </nav>

      <section className="card" id="sec-levels">
        <h2 className="section-title" style={{ marginTop: 0 }}>★ มีกี่ระดับ</h2>
        <p className="muted" style={{ marginTop: 2, maxWidth: '72ch' }}>
          จำนวนดาวหน้าชื่อบอกว่าเป็นของระดับไหน ยิ่งดาวเยอะ โบนัสยิ่งไล่ตามขั้นตีบวกถี่ขึ้น
        </p>
        <div className="recipe__scroll">
          <table className="data-table recipe">
            <thead>
              <tr>
                <th>ระดับ</th>
                <th className="num">อาวุธ</th>
                <th className="num">ชุด</th>
                <th>โบนัสมายังไง</th>
              </tr>
            </thead>
            <tbody>
              {STAR_LEVELS.map((level) => (
                <tr key={level.stars}>
                  <td data-label="ระดับ"><strong className="star__stars">{'★'.repeat(level.stars)}</strong></td>
                  <td data-label="อาวุธ" className="num">{level.weapons.length}</td>
                  <td data-label="ชุด" className="num">{level.armour.length}</td>
                  <td data-label="โบนัส">{tierShape(level.pieces)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="muted" style={{ marginTop: 12, fontSize: 13, maxWidth: '72ch' }}>
          ตัวเลขในตารางนับจากรายการไอเทมในฐานข้อมูลเว็บนี้ ณ ตอนสร้างหน้า ส่วนคอลัมน์ขวาอ่านจากข้อความของไอเทมแต่ละชิ้นโดยตรง{' '}
          <Link href="/database/equipment?q=%E2%98%85"><strong>เปิดดูของติดดาวทั้งหมด</strong></Link> ได้ที่ฐานข้อมูลอุปกรณ์ กรองตามอาชีพและเลเวลได้
        </p>
      </section>

      <section className="card card--cyan" id="sec-where">
        <h2 className="section-title" style={{ marginTop: 0 }}>ปลุกที่ไหน</h2>
        <p className="star__npc">
          <strong>{NPC.name}</strong>
          <span className="star__where">
            <Link href={`/database/maps/${NPC.map}`}>{NPC.map}</Link> พิกัด {NPC.x},{NPC.y}
          </span>
        </p>
        <p className="muted" style={{ marginTop: 10, maxWidth: '72ch' }}>
          เก็บโทเคนให้ครบตามจำนวนแล้วเอาไปคุยกับ NPC ตัวนี้ พิกัดนี้ไม่ได้เดา แต่มาจากลิงก์นำทางที่ฝังอยู่ในคำบรรยายโทเคนในเกม
          กดที่ชื่อแมพเพื่อดูหน้าแมพได้
        </p>
      </section>

      <section className="card card--yellow" id="sec-cost">
        <h2 className="section-title" style={{ marginTop: 0 }}>ปลุกแล้วเสียอะไร</h2>
        <div className="recipe__scroll">
          <table className="data-table recipe">
            <thead>
              <tr>
                <th>ปลุกอะไร</th>
                <th className="num">ตีบวกหายไป</th>
                <th>ใช้อะไร</th>
              </tr>
            </thead>
            <tbody>
              {ACTIVATION.map((row) => (
                <tr key={row.what}>
                  <td data-label="ปลุกอะไร">{row.what}</td>
                  <td data-label="ตีบวกหาย" className="num">{row.refine}</td>
                  <td data-label="ใช้อะไร">{row.materials}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="muted" style={{ marginTop: 12, fontSize: 13, maxWidth: '72ch' }}>
          <strong>การ์ด เอนแชนต์ และความสามารถเสริมไม่หาย</strong> ที่หายคือขั้นตีบวกเท่านั้น ของ +10 ที่เสีย 7 ขั้นจะเหลือ +3
          ถ้าจะปลุก ปลุกตอนยังตีบวกไม่สูงจะเจ็บน้อยกว่า
        </p>
      </section>

      <AdSlot slot="inline" />

      <section id="sec-refine" style={{ marginTop: 26 }}>
        <h2 className="section-title">โบนัสตามขั้นตีบวก</h2>
        <p className="muted" style={{ marginTop: 2, maxWidth: '72ch' }}>
          ของติดดาวไม่ได้แรงขึ้นเรื่อย ๆ ทีละขั้น แต่แรงขึ้นเป็นก้อนเมื่อตีบวกถึงขั้นที่กำหนด สามชิ้นข้างล่างเป็นตัวอย่างว่าหน้าตาเป็นยังไง
          แต่ละชิ้นได้ไม่เหมือนกัน ต้องดูของชิ้นนั้นเอง
        </p>
        {example.map((piece) => (
          <section className="card star__card" key={piece.id}>
            <h3 className="star__name">
              <Link className="recipe__item" href={itemHref(piece.id, piece.category)}>
                <ItemIcon iconUrl={piece.icon} category={piece.category} size={24} />
                <span>{piece.name}</span>
              </Link>
            </h3>
            <p className="star__facts">
              {[
                piece.footer.type,
                piece.footer.atk ? `ATK ${piece.footer.atk}` : null,
                piece.requiredLevel ? `เลเวล ${piece.requiredLevel}` : null,
                piece.slots ? `${piece.slots} Slot` : null,
                piece.footer.jobs,
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
            <dl className="star__tiers">
              <div>
                <dt>ใส่เฉย ๆ</dt>
                <dd><EffectText>{piece.base}</EffectText></dd>
              </div>
              {piece.tiers.map((tier) => (
                <div key={`${tier.kind}-${tier.refine}`}>
                  <dt>{tier.kind === 'every' ? `ทุก +${tier.refine}` : `ถึง +${tier.refine}`}</dt>
                  <dd><EffectText>{tier.text}</EffectText></dd>
                </div>
              ))}
            </dl>
            <p className="star__lang">
              {piece.lang === 'th' ? 'ข้อความไทยจากในเกม' : 'ข้อความอังกฤษจากข้อมูลไอเทม ไคลเอนต์ยังไม่มีไทยของชิ้นนี้'}
            </p>
          </section>
        ))}
      </section>

      <section id="sec-token" style={{ marginTop: 26 }}>
        <h2 className="section-title">
          โทเคนสำหรับปลุก <span className="muted" style={{ fontWeight: 400 }}>· {TOKENS.length} แบบ</span>
        </h2>
        <p className="muted" style={{ marginTop: 2, marginBottom: 10, maxWidth: '72ch' }}>
          โทเคนได้จากการเอาของชิ้นนั้นไปเปลี่ยน และใช้ปลุกได้เฉพาะชิ้นของตัวเอง โทเคนดาบใช้กับดาบเล่มนั้นเท่านั้น เอาไปปลุกชิ้นอื่นไม่ได้
        </p>
        <ul className="star__tokens">
          {TOKENS.map((token) => (
            <li key={token.id}>
              <Link className="recipe__item" href={itemHref(token.id, token.category)}>
                <ItemIcon iconUrl={token.icon} category={token.category} size={20} />
                <span>{token.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="card" id="sec-faq" style={{ marginTop: 26 }}>
        <h2 className="section-title" style={{ marginTop: 0 }}>คำถามที่เจอบ่อย</h2>
        <dl className="star__faq">
          {FAQ.map((entry) => (
            <div key={entry.question}>
              <dt>{entry.question}</dt>
              <dd>{entry.answer}</dd>
            </div>
          ))}
        </dl>
      </section>

      <Caveat label="เชื่อได้แค่ไหน">
        ชื่อโทเคน ชื่อ NPC พิกัด และผลของแต่ละชิ้นทุกบรรทัด<strong>มาจากข้อมูลไอเทมในเกม</strong> อ่านเมื่อ {star._meta.read}
        ไม่ได้แปลหรือสรุปใหม่ ชิ้นที่ไคลเอนต์มีข้อความไทยจะแสดงเป็นไทย ที่เหลือปล่อยเป็นอังกฤษตามที่เห็นตอนกดดูของ ·
        ส่วน<strong>ตารางค่าใช้จ่ายในการปลุกมาจากไกด์ภาษาฝรั่งเศส</strong> roz-global.info (อ่าน 8 ก.ย. 2026)
        เพราะข้อมูลในเกมบอกแต่ผลของชิ้นที่ปลุกแล้ว ไม่บอกว่าปลุกยังไง เป็นแหล่งเดียว ยังไม่มีที่สองให้ตรวจ
      </Caveat>

      <p className="muted" style={{ marginTop: 16 }}>
        ดูต่อ: <Link href="/tools/refine">คำนวณตีบวก</Link> ·{' '}
        <Link href="/database/equipment?q=%E2%98%85">ของติดดาวทั้งหมด</Link> ·{' '}
        <Link href="/guides/memorial-gear">ชุดดันเจี้ยนความทรงจำ</Link> ·{' '}
        <Link href="/guides/ore-refining">หลอมแร่</Link>
      </p>
    </main>
  );
}
