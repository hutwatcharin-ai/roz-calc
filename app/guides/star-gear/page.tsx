// app/guides/star-gear/page.tsx
//
// ★ gear: a system that is NOT open on our server yet. The owner looked for
// the NPC in game on 24 Sep 2026 and it is not there, and the mirrored guide
// at docs/rozglobal-export says the same -- it documents the Taiwanese
// server, where the system is live.
//
// So the page's job is not "go and do this". It is "get ready": the owner's
// words on 24 Sep were that it exists to let a reader stock up in advance.
// That matters because the entry price is brutal -- a ★ weapon eats 100
// tokens, and a token is one dropped copy of that weapon -- so anyone who
// sells their drops now will start from zero when it opens.
//
// Everything about the pieces comes from the game's own item data, read by
// scripts/build-star-gear.py into data/star-gear.json: the effect split into
// "wear it" plus one row per refine tier, and the ordinary twin of each piece
// so the page can show what the star actually buys.
//
// The client has Thai for 17 of the 41 pieces. The other 24 were translated
// by hand into data/star-effects-th.json, gated by app/star-effects-th.test.ts
// so a number cannot drift in translation. Every piece on this page is
// therefore in Thai.
//
// The two-NPC method and the activation costs are the mirrored guide's, not
// the client's, and the page says so where they appear.
import Link from 'next/link';
import type { Metadata } from 'next';
import PageHeader from '@/components/PageHeader';
import Caveat from '@/components/Caveat';
import ItemIcon from '@/components/ItemIcon';
import JsonLd from '@/components/JsonLd';
import AdSlot from '@/components/AdSlot';
import { breadcrumbJsonLd } from '@/lib/jsonld';
import { itemHref } from '@/lib/item-href';
import star from '@/data/star-gear.json';
import effectsTh from '@/data/star-effects-th.json';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'ของติดดาว ★ Ragnarok Zero — ยังไม่เปิด แต่เตรียมของรอไว้ได้',
  description:
    'ระบบปลุกของติดดาว ★ ยังไม่เปิดใน Ragnarok Zero Global หน้านี้บอกว่าต้องเก็บอะไรไว้ก่อน ของดรอป 1 ชิ้นแลกโทเคนได้ 1 อัน อาวุธ ★ ต้องใช้ 100 อัน พร้อมรายการของติดดาวทุกชิ้นว่าติดดาวแล้วได้อะไรเพิ่มบ้างในทุกขั้นตีบวก',
};

type Tier = { kind: string; refine: number; text: string };
type Plain = { id: number; category: string | null; atk: number | null; slots: number | null; requiredLevel: number | null };
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
  plain: Plain | null;
  starAtk: number | null;
};
type Token = { id: number; name: string; icon: string | null; category: string | null };

const PIECES = star.items as Piece[];
const TOKENS = star.tokens as Token[];
const TH = effectsTh.items as Record<string, Record<string, string>>;

const LEVELS = [1, 2, 3].map((stars) => ({ stars, pieces: PIECES.filter((p) => p.stars === stars) }));
const PAIRED = PIECES.filter((p) => p.plain);

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

/** Thai for a piece: the client's own where it has it, our translation where
 *  it does not. Both are Thai, so the page never mixes languages in a row. */
function thai(piece: Piece): { base: string; tiers: { key: string; label: string; text: string }[] } {
  const row = TH[String(piece.id)] ?? {};
  const fromClient = piece.lang === 'th';
  return {
    base: fromClient ? piece.base : row.base ?? piece.base,
    tiers: piece.tiers.map((tier) => {
      const key = `${tier.kind}${tier.refine}`;
      return {
        key,
        label: tier.kind === 'every' ? `ทุก +${tier.refine}` : `ถึง +${tier.refine}`,
        text: fromClient ? tier.text : row[key] ?? tier.text,
      };
    }),
  };
}

// From the mirrored guide (roz-global.info, docs/rozglobal-export, read
// 8 Sep 2026). It documents the Taiwanese server, where this is already live.
const NPCS = [
  {
    step: 'ขั้นที่ 1',
    name: 'Apprenti d’atelier Mingjia',
    where: 'prontera 272,264',
    what: 'เอาของไปแลกเป็นโทเคน ของที่มอนดรอป 1 ชิ้นแลกโทเคน ★ ได้ 1 อัน ส่วนอาวุธที่ปลุกแล้ว 1 ชิ้นแลกโทเคน ★★ ได้ 1 อัน',
  },
  {
    step: 'ขั้นที่ 2',
    name: 'Papi Daodao',
    where: 'prontera 272,260',
    what: 'พอมีโทเคนครบกับ Goblin Coin Shard แล้ว ตัวนี้เป็นคนเปิดหน้าต่างปลุกให้ ในไคลเอนต์อังกฤษชื่อ Nagging Old Man',
  },
];

const ACTIVATION = [
  { what: 'อาวุธ ★★', refine: '−3', materials: 'โทเคน ★★ ของชิ้นนั้น 3 อัน + Goblin Coin Shard 30' },
  { what: 'อาวุธ ★', refine: '−7', materials: 'โทเคน ★ ของชิ้นนั้น 100 อัน + Goblin Coin Shard 8' },
  { what: 'ชุดธรรมดา แบบ "นิ่ง"', refine: '−3', materials: 'โทเคน ★ ของชิ้นนั้น 100 อัน + Goblin Coin Shard 30' },
  { what: 'ชุดธรรมดา แบบ "แรง"', refine: '−7', materials: 'โทเคน ★ ของชิ้นนั้น 10 อัน + Goblin Coin Shard 3' },
];

const FAQ = [
  {
    question: 'ปลุกของติดดาวได้แล้วหรือยัง',
    answer: 'ยัง ระบบนี้ยังไม่เปิดใน Ragnarok Zero Global เจ้าของเว็บเข้าไปหา NPC ในเกมเมื่อ 24 ก.ย. 2026 แล้วไม่เจอ ไอเทม ★ มีอยู่ในไคลเอนต์แล้วก็จริง แต่ยังกดปลุกไม่ได้',
  },
  {
    question: 'ตอนนี้ควรเก็บอะไรไว้',
    answer: 'เก็บของที่มอนดรอปซึ่งมีเวอร์ชันติดดาว เพราะของ 1 ชิ้นแลกโทเคนได้ 1 อัน และอาวุธ ★ ต้องใช้ถึง 100 อัน กับเก็บ Goblin Coin Shard ไว้ด้วย',
  },
  {
    question: 'ปลุกแล้วเสียอะไร',
    answer: 'เสียขั้นตีบวก 3 หรือ 7 ขั้นแล้วแต่แบบที่เลือก การ์ด เอนแชนต์ และความสามารถเสริมไม่หาย ของ +10 ที่เสีย 7 ขั้นจะเหลือ +3 จึงควรตีบวกให้สูงไว้ก่อนแล้วค่อยปลุก',
  },
  {
    question: '★ กับ ★★ ต่างกันยังไง',
    answer: '★ ได้โบนัสเป็นก้อนที่ +3 +7 และ +9 ส่วน ★★ กับ ★★★ ได้โบนัสทุก ๆ 2 ขั้นที่ตีบวก และยังมีก้อนพิเศษที่ +7 +9 และ +11 จึงคุ้มกับการตีบวกสูง',
  },
];

function PieceCard({ piece }: { piece: Piece }) {
  const text = thai(piece);
  const plain = piece.plain;
  const gained = [
    plain && piece.starAtk != null && plain.atk != null && piece.starAtk !== plain.atk
      ? `ATK ${plain.atk} เป็น ${piece.starAtk}`
      : null,
    plain && piece.slots != null && plain.slots != null && piece.slots !== plain.slots
      ? `Slot ${plain.slots} เป็น ${piece.slots}`
      : null,
  ].filter(Boolean);

  return (
    <section className="card star__card" id={`item-${piece.id}`}>
      <h3 className="star__name">
        <Link className="recipe__item" href={itemHref(piece.id, piece.category)}>
          <ItemIcon iconUrl={piece.icon} category={piece.category} size={24} />
          <span>{piece.name}</span>
        </Link>
      </h3>
      <p className="star__facts">
        {[
          piece.footer.type,
          piece.requiredLevel ? `เลเวล ${piece.requiredLevel}` : null,
          piece.slots ? `${piece.slots} Slot` : null,
          piece.footer.jobs,
        ]
          .filter(Boolean)
          .join(' · ')}
      </p>
      {gained.length > 0 && (
        <p className="star__gain">
          เทียบกับตัวธรรมดา: {gained.join(' · ')}
          {plain && <> · <Link href={itemHref(plain.id, plain.category)}>ดูตัวธรรมดา</Link></>}
        </p>
      )}
      <dl className="star__tiers">
        <div>
          <dt>ใส่เฉย ๆ</dt>
          <dd><span className="star__effect">{text.base}</span></dd>
        </div>
        {text.tiers.map((tier) => (
          <div key={tier.key}>
            <dt>{tier.label}</dt>
            <dd><span className="star__effect">{tier.text}</span></dd>
          </div>
        ))}
      </dl>
      <p className="star__lang">
        {piece.lang === 'th' ? 'ข้อความไทยจากในเกม' : 'แปลจากข้อความอังกฤษของไอเทม ตัวเลขทุกตัวถูกเทสต์ว่าตรงกับต้นฉบับ'}
      </p>
    </section>
  );
}

export default async function StarGearPage() {
  return (
    <main className="shell star" style={{ paddingBlock: 32 }}>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'หน้าแรก', path: '/' },
          { name: 'ไกด์', path: '/guides' },
          { name: 'ของติดดาว', path: '/guides/star-gear' },
        ])}
      />

      <PageHeader
        title="ของติดดาว ★ — ยังไม่เปิด แต่เตรียมของรอไว้ได้"
        lead="ของติดดาวคือของธรรมดาที่เอาไปปลุกแล้ว ค่าพื้นฐานแรงขึ้น และได้โบนัสเพิ่มอีกชุดตามขั้นที่ตีบวกได้ ระบบนี้ยังไม่เปิดในเซิร์ฟเรา แต่ของที่ต้องใช้เก็บได้ตั้งแต่ตอนนี้ และต้องเก็บเยอะมาก"
      />

      <nav className="jumpbar" aria-label="หัวข้อในหน้านี้">
        <a href="#sec-prep">เตรียมอะไรไว้</a>
        <a href="#sec-how">ขั้นตอนตอนเปิด</a>
        <a href="#sec-levels">★ มีกี่ระดับ</a>
        <a href="#sec-list">ของทุกชิ้น</a>
        <a href="#sec-token">โทเคน</a>
        <a href="#sec-faq">คำถามที่เจอบ่อย</a>
      </nav>

      <section className="card card--yellow" id="sec-status">
        <h2 className="section-title" style={{ marginTop: 0 }}>ยังกดปลุกไม่ได้</h2>
        <p className="star__status">
          ไอเทม ★ อยู่ในไคลเอนต์แล้วทุกชิ้น และเห็นได้ในฐานข้อมูล แต่ <strong>ระบบปลุกยังไม่เปิดในเซิร์ฟ Global</strong>{' '}
          เจ้าของเว็บเข้าไปหา NPC ตามพิกัดในเกมเมื่อ 24 ก.ย. 2026 แล้วไม่เจอ ไกด์ที่เราอ้างอิงก็เขียนไว้เองว่าระบบนี้ยังไม่มาถึง Global
          และที่เขาอธิบายคือเซิร์ฟไต้หวันที่เปิดไปแล้ว
        </p>
        <p className="star__status">
          หน้านี้จึงมีไว้ให้<strong>เตรียมของรอ</strong> ไม่ใช่ให้ไปทำตอนนี้ เพราะของที่ต้องใช้ต้องสะสมนานมาก
          ถ้าขายทิ้งไปก่อนก็ต้องเริ่มนับหนึ่งใหม่ตอนระบบมา
        </p>
      </section>

      <section className="card card--cyan" id="sec-prep">
        <h2 className="section-title" style={{ marginTop: 0 }}>ตอนนี้เตรียมอะไรไว้</h2>
        <ol className="star__prep">
          <li>
            <strong>อย่าขายของที่มอนดรอปซึ่งมีเวอร์ชันติดดาว</strong> ของ 1 ชิ้นแลกโทเคนได้ 1 อัน และอาวุธ ★ ต้องใช้ถึง 100 อัน
            รายชื่อของที่ใช้ได้อยู่ใน <a href="#sec-list">หัวข้อของทุกชิ้น</a> ด้านล่าง
          </li>
          <li>
            <strong>เก็บ Goblin Coin Shard</strong> ทุกแบบของการปลุกใช้ของชิ้นนี้ ตั้งแต่ 3 ถึง 30 อัน
          </li>
          <li>
            <strong>ตีบวกชิ้นที่ตั้งใจจะปลุกให้สูงไว้ก่อน</strong> เพราะปลุกแล้วขั้นตีบวกหายไป 3 หรือ 7 ขั้น
            ปลุกของ +0 คือได้ของติดดาวที่ +0 ส่วนปลุกของ +10 แบบเสีย 7 ขั้นยังเหลือ +3
          </li>
          <li>
            <strong>ดูก่อนว่าของที่ใช้อยู่มีเวอร์ชันติดดาวไหม</strong> ไม่ใช่ทุกชิ้นที่คุ้ม บางชิ้น ATK เท่าเดิมแล้วได้แต่เอฟเฟกต์
            บางชิ้น ATK กระโดดเกือบเท่าตัว
          </li>
        </ol>
      </section>

      <section className="card" id="sec-how">
        <h2 className="section-title" style={{ marginTop: 0 }}>ขั้นตอนตอนระบบเปิดแล้ว</h2>
        <p className="muted" style={{ marginTop: 2, maxWidth: '72ch' }}>
          มี NPC สองตัว ไม่ใช่ตัวเดียว ตัวแรกแลกของเป็นโทเคน ตัวที่สองเป็นคนปลุก ทั้งคู่อยู่ที่{' '}
          <Link href="/database/maps/prontera">Prontera</Link> จุดเดียวกันแทบจะติดกัน
        </p>
        <ol className="star__npcs">
          {NPCS.map((npc) => (
            <li key={npc.name}>
              <span className="star__step">{npc.step}</span>
              <div>
                <p className="star__npcname">{npc.name} <span className="star__where">{npc.where}</span></p>
                <p className="star__detail">{npc.what}</p>
              </div>
            </li>
          ))}
        </ol>

        <h3 className="star__h3" style={{ marginTop: 18 }}>ปลุกแล้วเสียอะไร</h3>
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
          <strong>การ์ด เอนแชนต์ และความสามารถเสริมไม่หาย</strong> ที่หายคือขั้นตีบวกเท่านั้น
        </p>
        <p className="guildp__src">
          ที่มา: ชื่อ NPC พิกัด กติกาแลกโทเคน และตารางนี้มาจากไกด์ roz-global.info (อ่าน 8 ก.ย. 2026) ซึ่งอธิบายเซิร์ฟไต้หวัน
          เป็นแหล่งเดียว ยังไม่มีที่สองให้ตรวจ และยังตรวจกับเซิร์ฟเราไม่ได้เพราะระบบยังไม่เปิด
        </p>
      </section>

      <AdSlot slot="inline" />

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
              {LEVELS.map((level) => (
                <tr key={level.stars}>
                  <td data-label="ระดับ"><strong className="star__stars">{'★'.repeat(level.stars)}</strong></td>
                  <td data-label="อาวุธ" className="num">{level.pieces.filter((p) => p.category === 'Weapon').length}</td>
                  <td data-label="ชุด" className="num">{level.pieces.filter((p) => p.category === 'Armor').length}</td>
                  <td data-label="โบนัส">{tierShape(level.pieces)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section id="sec-list" style={{ marginTop: 26 }}>
        <h2 className="section-title">ของทุกชิ้นว่าติดดาวแล้วได้อะไร</h2>
        <p className="muted" style={{ marginTop: 2, maxWidth: '72ch' }}>
          ครบทุกชิ้นที่มีในไคลเอนต์ แยกตามระดับดาว แต่ละใบบอกผลตอนใส่เฉย ๆ แล้วไล่ทีละขั้นตีบวก ชิ้นที่หาตัวธรรมดามาเทียบได้
          ({PAIRED.length} จาก {PIECES.length}) จะมีบรรทัดบอกว่าติดดาวแล้ว ATK กับ Slot ขยับเท่าไร
        </p>
        {LEVELS.map((level) => (
          <section key={level.stars} id={`sec-star-${level.stars}`} style={{ marginTop: 18 }}>
            <h3 className="star__group">
              <span className="star__stars">{'★'.repeat(level.stars)}</span>{' '}
              <span className="muted" style={{ fontWeight: 400, fontSize: 14 }}>{level.pieces.length} ชิ้น</span>
            </h3>
            {level.pieces.map((piece) => (
              <PieceCard key={piece.id} piece={piece} />
            ))}
          </section>
        ))}
      </section>

      <section id="sec-token" style={{ marginTop: 26 }}>
        <h2 className="section-title">
          โทเคนสำหรับปลุก <span className="muted" style={{ fontWeight: 400 }}>· {TOKENS.length} แบบ</span>
        </h2>
        <p className="muted" style={{ marginTop: 2, marginBottom: 10, maxWidth: '72ch' }}>
          โทเคนของชิ้นไหนใช้ปลุกได้เฉพาะชิ้นนั้น โทเคนดาบใช้กับดาบเล่มนั้นเท่านั้น เอาไปปลุกชิ้นอื่นไม่ได้
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
        ผลของแต่ละชิ้น ชื่อโทเคน และค่าสถานะทุกบรรทัด<strong>มาจากข้อมูลไอเทมในเกม</strong> อ่านเมื่อ {star._meta.read} ·
        ชิ้นที่ไคลเอนต์มีข้อความไทยอยู่แล้วใช้ของไคลเอนต์ตรง ๆ ส่วนที่เหลือเราแปลเอง
        โดยมีเทสต์บังคับว่าตัวเลขทุกตัวและชื่อค่าสถานะทุกตัวต้องตรงกับต้นฉบับ ไม่ได้สรุปใหม่ ·
        <strong>ชื่อ NPC พิกัด กติกาแลกโทเคน และค่าใช้จ่ายในการปลุก มาจากไกด์ roz-global.info</strong> (อ่าน 8 ก.ย. 2026)
        ซึ่งอธิบายเซิร์ฟไต้หวัน เป็นแหล่งเดียวและยังตรวจกับเซิร์ฟเราไม่ได้ ·
        ข้อความอังกฤษต้นทางของบางชิ้นเป็นการแปลจากภาษาจีนมาอีกทอด ชื่อสกิลบางตัวจึงอ่านแปลก ๆ ตั้งแต่ต้นฉบับ
      </Caveat>

      <p className="muted" style={{ marginTop: 16 }}>
        ดูต่อ: <Link href="/tools/refine">คำนวณตีบวก</Link> ·{' '}
        <Link href="/database/equipment?q=%E2%98%85">ของติดดาวในฐานข้อมูล</Link> ·{' '}
        <Link href="/guides/memorial-gear">ชุดดันเจี้ยนความทรงจำ</Link> ·{' '}
        <Link href="/guides/ore-refining">หลอมแร่</Link>
      </p>
    </main>
  );
}
