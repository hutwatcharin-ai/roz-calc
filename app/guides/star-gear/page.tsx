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
import chainFile from '@/data/star-chain.json';
import guideOnly from '@/data/star-guide-only.json';

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
  tier: number;
  family: string;
  category: string | null;
  icon: string | null;
  requiredLevel: number | null;
  slots: number | null;
  lang: string;
  base: string;
  tiers: Tier[];
  footer: Record<string, string>;
  plain: Plain | null;
  plainExistsInGame: boolean | null;
  starAtk: number | null;
};
type Token = { id: number; name: string; icon: string | null; category: string | null; namesNpc: boolean };

const PIECES = star.items as Piece[];
const TOKENS = star.tokens as Token[];
// How many of the client's own token descriptions carry the <NAVI> waypoint
// to the step-2 NPC -- the evidence for that name, counted rather than typed.
const NPC_CONFIRMED_BY = TOKENS.filter((t) => t.namesNpc).length;
const TH = effectsTh.items as Record<string, Record<string, string>>;

// Two tiers, not three. ★★ and ★★★ are the second tier's two variants: the
// mirrored guide lists both under "armes de 2ᵉ palier ★★" and separates them
// by a suffix, and two of the pairs have the ★★★ weaker on its headline stat,
// which no upgrade ever is. app/star-gear-tiers.test.ts holds this.
const FIRST = PIECES.filter((p) => p.tier === 1);
const SECOND = PIECES.filter((p) => p.tier === 2);
const FAMILIES = [...new Set(SECOND.map((p) => p.family))].sort().map((family) => ({
  family,
  variants: SECOND.filter((p) => p.family === family).sort((a, b) => a.stars - b.stars),
}));
const PAIRED = PIECES.filter((p) => p.plain);
const NO_PLAIN = PIECES.filter((p) => !p.plain);
// The pieces the client itself has no data for at all -- no Thai text, no
// icon resource, no footer block. Those got a mirrored icon from
// divine-pride instead of the client (see build-star-gear.py).
const CLIENT_UNKNOWN = PIECES.filter((p) => p.lang === 'en');
const BY_ID = new Map(PIECES.map((p) => [p.id, p]));
// Which ★ piece each ★★/★★★ pair is made from. Hand-matched in
// data/star-chain.json because the English client renames four of them
// between tiers; app/star-chain.test.ts checks every link against the
// client's own type, level and ATK.
const CHAINS = chainFile.chains.map((c) => ({
  first: BY_ID.get(c.first)!,
  second: c.second.map((id) => BY_ID.get(id)!),
  renamed: c.renamed,
}));
const RENAMED = CHAINS.filter((c) => c.renamed);
// ★ pieces the guide gives a second tier for that our client does not have.
const GUIDE_ONLY = guideOnly.pieces.map((g) => ({ ...g, first: BY_ID.get(g.firstTierId)! }));
const baseName = (name: string) => name.replace(/^★+ /, '').replace(/ - (Sun|Moon)$/, '');

/** The headline ATK or MATK a piece's own text opens with, for telling two
 *  variants apart at a glance. */
function headline(piece: Piece): string | null {
  const hit = piece.base.match(/\b(M?ATK)\s*\+\s*(\d+)/);
  return hit ? `${hit[1]} +${hit[2]}` : null;
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

// Two different levels of evidence, on purpose. Step 2's name comes from our
// own client: 11 item descriptions carry a <NAVI> waypoint to "Nagging Old
// Man" at prontera,272,260, all agreeing on the coordinates (checked 24 Sep
// 2026) -- independent of the mirrored guide entirely. Step 1's NPC has no
// trace in any client data we hold; its name and location are the mirrored
// guide's alone (roz-global.info, docs/rozglobal-export, read 8 Sep 2026,
// documenting the Taiwanese server), so the page says that plainly instead of
// presenting it with the same confidence as step 2.
const NPCS = [
  {
    step: 'ขั้นที่ 1',
    name: 'Apprenti d’atelier Mingjia',
    where: 'prontera 272,264',
    confirmed: false,
    what: 'เอาของไปแลกเป็นโทเคน ของที่มอนดรอป 1 ชิ้นแลกโทเคน ★ ได้ 1 อัน ส่วนอาวุธที่ปลุกแล้ว 1 ชิ้นแลกโทเคน ★★ ได้ 1 อัน',
  },
  {
    step: 'ขั้นที่ 2',
    name: 'Nagging Old Man',
    where: 'prontera 272,260',
    confirmed: true,
    what: 'พอมีโทเคนครบกับ Goblin Coin Shard แล้ว ตัวนี้เป็นคนเปิดหน้าต่างปลุกให้',
  },
];

// The guide's own table. Its rows name the tier being produced, and the ★★
// token in the second row is the one made by trading in an already-activated
// weapon -- which is why the second tier needs so few of them and the first
// needs a hundred.
// The numbers live here once; the table, the plain-words walkthrough and the
// worked example below all read them, so they cannot drift apart. Confirmed
// by two independent sources: the mirrored French guide and the TWROZ patch
// notes of 28 Aug 2025 as relayed on Bahamut (forum.gamer.com.tw, bsn 83142),
// which print the same 100 / 8 / −7 and 3 / 30 / −3.
const WEAPON_TIER1 = { tokens: 100, shards: 8, refine: 7 };
const WEAPON_TIER2 = { tokens: 3, shards: 30, refine: 3 };
const ARMOR_STABLE = { tokens: 100, shards: 30, refine: 3 };
const ARMOR_STRONG = { tokens: 10, shards: 3, refine: 7 };
const ACTIVATION = [
  { what: 'อาวุธ ขั้นที่ 1 (★)', refine: `−${WEAPON_TIER1.refine}`, materials: `โทเคน ★ ของชิ้นนั้น ${WEAPON_TIER1.tokens} อัน + Goblin Coin Shard ${WEAPON_TIER1.shards}` },
  { what: 'อาวุธ ขั้นที่ 2 (★★ หรือ ★★★)', refine: `−${WEAPON_TIER2.refine}`, materials: `โทเคน ★★ ของชิ้นนั้น ${WEAPON_TIER2.tokens} อัน + Goblin Coin Shard ${WEAPON_TIER2.shards}` },
  { what: 'ชุด แบบ "นิ่ง"', refine: `−${ARMOR_STABLE.refine}`, materials: `โทเคน ★ ของชิ้นนั้น ${ARMOR_STABLE.tokens} อัน + Goblin Coin Shard ${ARMOR_STABLE.shards}` },
  { what: 'ชุด แบบ "แรง"', refine: `−${ARMOR_STRONG.refine}`, materials: `โทเคน ★ ของชิ้นนั้น ${ARMOR_STRONG.tokens} อัน + Goblin Coin Shard ${ARMOR_STRONG.shards}` },
];

// A worked example for the plain-words section: one tier-2 weapon, counted
// all the way back to monster drops. The three ★ weapons traded in for ★★
// tokens are on top of the one being activated.
const EXAMPLE = {
  dropsPerStar: WEAPON_TIER1.tokens,
  starWeaponsForTokens: WEAPON_TIER2.tokens,
  dropsTotal: WEAPON_TIER1.tokens * (WEAPON_TIER2.tokens + 1),
  shardsTotal: WEAPON_TIER1.shards * (WEAPON_TIER2.tokens + 1) + WEAPON_TIER2.shards,
};

// Where Goblin Coin Shards come from, per the TWROZ notes relayed on Bahamut
// (28 Aug 2025): an exchange NPC in Prontera. Single source, Taiwanese
// server; our client has the three items (ids below) but no NPC text for it.
const SHARD_ITEM = { id: 1002346, name: 'Goblin Coin Shard' };
const SHARD_SOURCES = [
  { give: { id: 105212, name: 'Goblin Coin' }, amount: 1, shards: '1' },
  { give: { id: 105213, name: 'Goblin Silver Coin' }, amount: 1, shards: '10' },
  { give: null, amount: 0, shards: '1–3 (สุ่ม)', zeny: '180,000–400,000 (สุ่ม)' },
];
const SHARD_NPC = { name: '想飛的魔像 (โกเลมที่อยากบิน)', where: 'prontera 284,253' };

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
    question: 'ซื้ออาวุธจากร้าน NPC มาแลกโทเคนได้ไหม',
    answer: 'ไม่ได้ ประกาศฝั่งไต้หวันเขียนตรง ๆ ว่าของซื้อร้านใช้ทำไม่ได้ ต้องเป็นชิ้นที่มอนสเตอร์ดรอปเท่านั้น',
  },
  {
    question: 'Goblin Coin Shard หาจากไหน',
    answer: `มี NPC แลกที่ Prontera เอา Goblin Coin หรือ Goblin Silver Coin ไปแลก หรือจ่าย Zeny แลกแบบสุ่ม รายละเอียดอยู่ในหัวข้อวิธีทำแบบง่าย ข้อมูลนี้มาจากฝั่งไต้หวันเท่านั้น ไคลเอนต์เรามีไอเทมทั้งสามชิ้นแล้วแต่ยังไม่มี NPC`,
  },
  {
    question: '★ กับ ★★ และ ★★★ ต่างกันยังไง',
    answer: '★ คือขั้นที่ 1 ได้โบนัสเป็นก้อนที่ +3 +7 และ +9 ส่วน ★★ กับ ★★★ เป็นขั้นที่ 2 ด้วยกันทั้งคู่ ไม่ใช่คนละขั้น เป็นสองแบบให้เลือกของชิ้นเดียวกัน ขั้นที่ 2 ได้โบนัสทุก ๆ 2 ขั้นที่ตีบวก และมีก้อนพิเศษที่ +7 +9 และ +11',
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
      {!plain && piece.plainExistsInGame === false && (
        <p className="star__noplain">ชิ้นนี้ไม่มีรุ่นธรรมดาให้เทียบ — ตรวจในไคลเอนต์แล้วว่าไม่มีเวอร์ชันที่ไม่ติดดาวของชิ้นนี้เลย มีแต่รุ่นติดดาวรุ่นเดียว</p>
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
        <a href="#sec-simple">วิธีทำแบบง่าย</a>
        <a href="#sec-prep">เตรียมอะไรไว้</a>
        <a href="#sec-how">ขั้นตอนตอนเปิด</a>
        <a href="#sec-chain">สายอัปเกรด</a>
        <a href="#sec-choice">ขั้น 2 เลือก 2 แบบ</a>
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

      <section className="card" id="sec-simple">
        <h2 className="section-title" style={{ marginTop: 0 }}>วิธีทำแบบง่ายที่สุด</h2>
        <p className="muted" style={{ marginTop: 2, maxWidth: '74ch' }}>
          คิดง่าย ๆ ว่ามันคือ<strong>การเอาของดรอปชิ้นเดียวกันซ้ำ ๆ ไปแลกเป็นใบรับรอง</strong> แล้วเอาใบรับรองกับเศษเหรียญ Goblin ไปให้ตาแก่ปลุกอาวุธของเรา
          ปลุกแล้วอาวุธเล่มเดิมกลายเป็นรุ่นติดดาว ค่าโจมตีขยับขึ้นและมีโบนัสเพิ่มตามขั้นตีบวก
        </p>
        <ol className="star__prep">
          <li>
            <strong>เลือกอาวุธที่จะปลุก</strong> ต้องเป็นชิ้นที่มีรุ่นติดดาว (ดูตาราง<a href="#sec-chain">สายอัปเกรด</a>) แล้วตีบวกให้สูงไว้ก่อน
            เพราะปลุกแล้วขั้นตีบวกหายไป {WEAPON_TIER1.refine} ขั้น ตัวอย่างในประกาศไต้หวันคือเอาเล่ม +{WEAPON_TIER1.refine} ไปปลุก ออกมาเป็น ★ +0
          </li>
          <li>
            <strong>เก็บอาวุธชนิดเดียวกันที่มอนดรอปให้ได้ {WEAPON_TIER1.tokens} ชิ้น</strong> (ของซื้อจากร้านใช้ไม่ได้) เอาไปแลกกับ NPC ตัวแรกที่ Prontera
            ได้โทเคน ★ ของชิ้นนั้น {WEAPON_TIER1.tokens} อัน ชิ้นละอัน
          </li>
          <li>
            <strong>หา <Link href={itemHref(SHARD_ITEM.id, null)}>{SHARD_ITEM.name}</Link> {WEAPON_TIER1.shards} อัน</strong> จาก NPC แลกที่ {SHARD_NPC.where} ({SHARD_NPC.name})
            <ul className="star__shards">
              {SHARD_SOURCES.map((row) => (
                <li key={row.shards}>
                  {row.give ? (
                    <>
                      <Link href={itemHref(row.give.id, null)}>{row.give.name}</Link> {row.amount} เหรียญ
                    </>
                  ) : (
                    <>Zeny {row.zeny}</>
                  )}{' '}
                  → เศษ {row.shards} อัน
                </li>
              ))}
            </ul>
          </li>
          <li>
            <strong>เอาอาวุธ + โทเคน + เศษเหรียญไปหา NPC ตัวที่สอง</strong> (Nagging Old Man ข้าง ๆ กัน) กดปลุก ได้อาวุธ ★
            การ์ดกับเอนแชนต์ที่ใส่ไว้ยังอยู่ครบ
          </li>
          <li>
            <strong>อยากได้ขั้นที่ 2 (★★ หรือ ★★★)</strong> เอาอาวุธ ★ ที่ปลุกแล้ว {WEAPON_TIER2.tokens} เล่มไปแลกเป็นโทเคน ★★ {WEAPON_TIER2.tokens} อัน (เล่มละอัน)
            บวกเศษเหรียญอีก {WEAPON_TIER2.shards} อัน แล้วปลุกอีกเล่ม ตอนนี้จะได้เลือกว่าเอาแบบ ★★ หรือ ★★★ ตีบวกหายไป {WEAPON_TIER2.refine} ขั้น
          </li>
        </ol>
        <div className="star__example">
          <p className="star__example-title">ตัวอย่างนับของทั้งหมด ถ้าอยากได้ ★★ Crossbow หนึ่งเล่ม</p>
          <ul>
            <li>อาวุธ ★ {EXAMPLE.starWeaponsForTokens} เล่มสำหรับแลกโทเคน ★★ + อีก 1 เล่มที่จะปลุก = ต้องปลุกขั้นที่ 1 ทั้งหมด {EXAMPLE.starWeaponsForTokens + 1} เล่ม</li>
            <li>Crossbow ที่มอนดรอป: {EXAMPLE.dropsPerStar} × {EXAMPLE.starWeaponsForTokens + 1} = <strong>{EXAMPLE.dropsTotal.toLocaleString('en-US')} ชิ้น</strong></li>
            <li>Goblin Coin Shard: {WEAPON_TIER1.shards} × {EXAMPLE.starWeaponsForTokens + 1} + {WEAPON_TIER2.shards} = <strong>{EXAMPLE.shardsTotal} อัน</strong></li>
          </ul>
          <p className="muted" style={{ margin: '6px 0 0', fontSize: 13 }}>
            นับแบบนี้ถ้าเล่มที่ปลุกขั้นที่ 2 ต้องเป็นอาวุธ ★ อยู่ก่อน ซึ่งไกด์ทั้งสองแหล่งไม่ได้เขียนไว้ตรง ๆ ถ้าปลุกจากเล่มธรรมดาได้ ก็ลดไป {EXAMPLE.dropsPerStar} ชิ้นกับ {WEAPON_TIER1.shards} อัน
          </p>
        </div>
        <p className="guildp__src">
          ที่มา: ตัวเลขทั้งหมดตรงกันสองแหล่ง คือไกด์ roz-global.info กับประกาศแพตช์เซิร์ฟไต้หวัน 28 ส.ค. 2025 ที่ผู้เล่นคัดลอกไว้บนบอร์ด Bahamut ·
          NPC แลกเศษเหรียญและอัตราแลก มาจากบอร์ด Bahamut แหล่งเดียว · ทั้งหมดเป็นของเซิร์ฟไต้หวัน ยังตรวจกับเซิร์ฟเราไม่ได้
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
                <p className="star__npcname">
                  {npc.name} <span className="star__where">{npc.where}</span>
                  {!npc.confirmed && <span className="star__unconfirmed">ชื่อนี้มาจากไกด์อย่างเดียว ไม่มีในข้อมูลไคลเอนต์ที่เรามี</span>}
                </p>
                <p className="star__detail">{npc.what}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="muted" style={{ marginTop: 10, fontSize: 13, maxWidth: '74ch' }}>
          ชื่อของ NPC ขั้นที่ 2 ยืนยันได้จากคำบรรยายไอเทมในเกมเอง {NPC_CONFIRMED_BY} ชิ้น ทุกชิ้นให้พิกัดตรงกัน ส่วน NPC ขั้นที่ 1 ยังไม่เจอในไคลเอนต์ของเราเลย
          ชื่อและพิกัดจึงมาจากไกด์ฝรั่งเศสแหล่งเดียว
        </p>

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
        <p className="muted" style={{ marginTop: 12, fontSize: 13, maxWidth: '74ch' }}>
          <strong>การ์ด เอนแชนต์ และความสามารถเสริมไม่หาย</strong> ที่หายคือขั้นตีบวกเท่านั้น
        </p>
        <p className="muted" style={{ marginTop: 10, fontSize: 13, maxWidth: '74ch' }}>
          <strong>สังเกตว่ามันเป็นลูกโซ่</strong> โทเคน ★ ได้จากของที่มอนดรอป จึงต้องใช้ถึง 100 อัน ส่วนโทเคน ★★
          ได้จากการเอา<strong>อาวุธที่ปลุกขั้นที่ 1 แล้ว</strong>ไปแลก จึงใช้แค่ 3 อัน แต่ 3 อันนั้นแปลว่าต้องมีอาวุธขั้นที่ 1 สามเล่มก่อน
        </p>
        <p className="guildp__src">
          ที่มา: ชื่อและพิกัด NPC ขั้นที่ 2 ตรวจกับข้อมูลไคลเอนต์ของเราเองแล้ว ส่วนของขั้นที่ 1 (ชื่อจีน 工坊學徒 鳴家) กติกาแลกโทเคน
          และตารางปลุก ตรงกันสองแหล่ง คือไกด์ roz-global.info (อ่าน 8 ก.ย. 2026) กับประกาศแพตช์เซิร์ฟไต้หวัน 28 ส.ค. 2025 บนบอร์ด Bahamut (อ่าน 25 ก.ย. 2026)
          ทั้งคู่อธิบายเซิร์ฟไต้หวัน ยังตรวจกับเซิร์ฟเราไม่ได้เพราะระบบยังไม่เปิด
        </p>
      </section>

      <AdSlot slot="inline" />

      <section className="card" id="sec-chain">
        <h2 className="section-title" style={{ marginTop: 0 }}>สายอัปเกรด ของธรรมดา → ★ → ★★ หรือ ★★★</h2>
        <p className="muted" style={{ marginTop: 2, maxWidth: '74ch' }}>
          ขั้นที่ 2 ทำจากอาวุธ ★ ของสายเดียวกัน แต่<strong>ชื่ออังกฤษในเกมเปลี่ยนไประหว่างขั้น {RENAMED.length} สาย</strong> เช่น ★ Slayer
          ปลุกต่อแล้วกลายเป็น ★★ Two Handed Sword ถ้าดูแค่ชื่อจะนึกว่าเป็นคนละอาวุธ (และจะนึกว่ามาจาก Bastard Sword ซึ่งผิด)
          ตารางนี้จับคู่ด้วยรหัสทรัพยากรของไอเทม ซึ่งขั้นที่ 2 ใช้รหัสเดียวกับขั้นที่ 1 ต่อท้ายด้วย RFP1/RFP2
        </p>
        <div className="recipe__scroll">
          <table className="data-table recipe">
            <thead>
              <tr>
                <th>ขั้นที่ 1 ★</th>
                <th>ใครใส่</th>
                <th>ขั้นที่ 2 แบบ ★★</th>
                <th>ขั้นที่ 2 แบบ ★★★</th>
              </tr>
            </thead>
            <tbody>
              {CHAINS.map(({ first, second, renamed }) => (
                <tr key={first.id}>
                  <td data-label="ขั้นที่ 1">
                    <Link className="recipe__item" href={itemHref(first.id, first.category)}>
                      <ItemIcon iconUrl={first.icon} category={first.category} size={20} />
                      <span>{first.name}</span>
                    </Link>
                    {renamed && <span className="star__renamed">ชื่อเปลี่ยนตอนขึ้นขั้น 2</span>}
                  </td>
                  <td data-label="ใครใส่" className="muted" style={{ fontSize: 13 }}>{first.footer.jobs?.replace(/ Class/g, '')}</td>
                  {second.map((piece) => (
                    <td key={piece.id} data-label={'★'.repeat(piece.stars)}>
                      <Link className="recipe__item" href={itemHref(piece.id, piece.category)}>
                        <ItemIcon iconUrl={piece.icon} category={piece.category} size={20} />
                        <span>{baseName(piece.name)}</span>
                      </Link>
                      <span className="muted" style={{ display: 'block', fontSize: 12.5 }}>
                        {[headline(piece), piece.footer.jobs?.replace(/ Class/g, '')].filter(Boolean).join(' · ')}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="muted" style={{ marginTop: 12, fontSize: 13, maxWidth: '74ch' }}>
          สังเกตว่าขั้นที่ 2 เป็นของ<strong>อาชีพขั้นที่ 2</strong> เช่น ★ Crossbow ใส่ได้ตั้งแต่ Thief/Archer แต่ ★★ Crossbow เป็นของ Hunter
          และ ★★★ Crossbow เป็นของ Rogue เลือกแบบตามอาชีพที่เล่นอยู่ก่อน แล้วค่อยดูผล ·
          อีก {PIECES.filter((p) => p.tier === 1 && p.footer.type && !CHAINS.some((c) => c.first.id === p.id)).length} อาวุธ ★
          ที่เหลือยังไม่มีขั้นที่ 2 ในไคลเอนต์ ({GUIDE_ONLY.length} ในนั้นไกด์ไต้หวันมีข้อมูลแล้ว ดูท้ายหัวข้อของทุกชิ้น)
        </p>
      </section>

      <section className="card" id="sec-choice">
        <h2 className="section-title" style={{ marginTop: 0 }}>ขั้นที่ 2 เลือกได้สองแบบ</h2>
        <p className="muted" style={{ marginTop: 2, maxWidth: '74ch' }}>
          ปลุกมีสองขั้น ไม่ใช่สามขั้นตามจำนวนดาว ★ คือขั้นที่ 1 ส่วน ★★ กับ ★★★ เป็น<strong>ขั้นเดียวกัน</strong>ที่ให้เลือกสองแบบ
          ไคลเอนต์อังกฤษแยกด้วยจำนวนดาว ไกด์ต้นทางเรียกทั้งคู่ว่า ★★ แล้วแยกด้วยคำต่อท้ายชื่อแทน พอปลุกเป็นขั้นที่ 2 ต้องเลือกว่าจะเอาแบบไหน
          เลือกแล้วคือคนละชิ้นกันเลย บางคู่ต่างกันถึงขั้นเปลี่ยนสายจากกายภาพเป็นเวท
        </p>
        <div className="recipe__scroll">
          <table className="data-table recipe">
            <thead>
              <tr>
                <th>ของชิ้นเดียวกัน</th>
                <th>แบบ ★★</th>
                <th>แบบ ★★★</th>
              </tr>
            </thead>
            <tbody>
              {FAMILIES.map(({ family, variants }) => (
                <tr key={family}>
                  <td data-label="ของชิ้นเดียวกัน">{family}</td>
                  {variants.map((piece) => (
                    <td key={piece.id} data-label={`${'★'.repeat(piece.stars)}`}>
                      <Link className="recipe__item" href={itemHref(piece.id, piece.category)}>
                        <ItemIcon iconUrl={piece.icon} category={piece.category} size={20} />
                        <span>{headline(piece) ?? piece.name}</span>
                      </Link>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="muted" style={{ marginTop: 12, fontSize: 13, maxWidth: '74ch' }}>
          ช่องในตารางคือค่าโจมตีตั้งต้นของแต่ละแบบ กดเข้าไปดูผลเต็มได้ · ดูรายละเอียดทุกขั้นตีบวกของทั้งคู่ได้ที่{' '}
          <a href="#sec-list">หัวข้อของทุกชิ้น</a>
        </p>
      </section>

      <section id="sec-list" style={{ marginTop: 26 }}>
        <h2 className="section-title">ของทุกชิ้นว่าติดดาวแล้วได้อะไร</h2>
        <p className="muted" style={{ marginTop: 2, maxWidth: '74ch' }}>
          ครบทุกชิ้นที่มีในไคลเอนต์ แต่ละใบบอกผลตอนใส่เฉย ๆ แล้วไล่ทีละขั้นตีบวก ชิ้นที่หาตัวธรรมดามาเทียบได้
          ({PAIRED.length} จาก {PIECES.length}) จะมีบรรทัดบอกว่าติดดาวแล้ว ATK กับ Slot ขยับเท่าไร ส่วนอีก {NO_PLAIN.length} ชิ้นที่เหลือ
          ตรวจกับไคลเอนต์แล้วว่าไม่มีรุ่นธรรมดาอยู่จริง ไม่ใช่ข้อมูลเราขาด
        </p>

        <section id="sec-tier-1" style={{ marginTop: 18 }}>
          <h3 className="star__group">
            <span className="star__stars">★</span> ขั้นที่ 1{' '}
            <span className="muted" style={{ fontWeight: 400, fontSize: 14 }}>{FIRST.length} ชิ้น</span>
          </h3>
          {FIRST.map((piece) => (
            <PieceCard key={piece.id} piece={piece} />
          ))}
        </section>

        <section id="sec-tier-2" style={{ marginTop: 22 }}>
          <h3 className="star__group">
            <span className="star__stars">★★ / ★★★</span> ขั้นที่ 2{' '}
            <span className="muted" style={{ fontWeight: 400, fontSize: 14 }}>{FAMILIES.length} ชื่อ ชื่อละสองแบบ</span>
          </h3>
          <p className="muted" style={{ marginTop: 2, maxWidth: '74ch' }}>
            วางคู่กันไว้ให้เทียบ เพราะตอนปลุกต้องเลือกแบบใดแบบหนึ่ง
          </p>
          {FAMILIES.map(({ family, variants }) => (
            <div key={family} className="star__pair">
              <h4 className="star__pairname">{family}</h4>
              {variants.map((piece) => (
                <PieceCard key={piece.id} piece={piece} />
              ))}
            </div>
          ))}
        </section>

        <section id="sec-guide-only" style={{ marginTop: 22 }}>
          <h3 className="star__group">
            <span className="star__stars">★★</span> ประกาศแล้วที่ไต้หวัน แต่ยังไม่มีในไคลเอนต์เรา{' '}
            <span className="muted" style={{ fontWeight: 400, fontSize: 14 }}>{GUIDE_ONLY.length} สาย</span>
          </h3>
          <p className="muted" style={{ marginTop: 2, maxWidth: '74ch' }}>
            ไกด์ที่เราอ้างอิงมีขั้นที่ 2 ของสองสายนี้ด้วย แต่ไฟล์เกมของเรายังไม่มีไอเทมพวกนี้เลย จึงยังกดดูในฐานข้อมูลไม่ได้
            ตัวเลขข้างล่างแปลจากไกด์ตรง ๆ เป็นแหล่งเดียว และอาจต่างจากตอนเข้าเซิร์ฟเรา
          </p>
          {GUIDE_ONLY.map((g) => (
            <div key={g.family} className="star__pair">
              <h4 className="star__pairname">
                {g.family}{' '}
                <span className="muted" style={{ fontWeight: 400, fontSize: 13 }}>
                  ทำจาก <Link href={itemHref(g.first.id, g.first.category)}>{g.first.name}</Link>
                </span>
              </h4>
              {g.variants.map((v) => (
                <section key={v.name} className="card star__card">
                  <h3 className="star__name">{v.name}</h3>
                  <dl className="star__tiers">
                    <div>
                      <dt>ใส่เฉย ๆ</dt>
                      <dd><span className="star__effect">{v.base}</span></dd>
                    </div>
                    {v.tiers.map((tier) => (
                      <div key={tier.label}>
                        <dt>{tier.label}</dt>
                        <dd><span className="star__effect">{tier.text}</span></dd>
                      </div>
                    ))}
                  </dl>
                  <p className="star__lang">แปลจากไกด์ roz-global.info (เซิร์ฟไต้หวัน) ยังไม่มีในไฟล์เกมของเรา</p>
                </section>
              ))}
            </div>
          ))}
        </section>
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
ชื่อ NPC ขั้นที่ 2 คือ Nagging Old Man ตรวจกับคำบรรยายไอเทมในเกมของเราเองแล้ว ({NPC_CONFIRMED_BY} ชิ้น พิกัดตรงกันหมด) ·{' '}
        <strong>ส่วน NPC ขั้นที่ 1 พิกัด กติกาแลกโทเคน และค่าใช้จ่ายในการปลุก ตรงกันสองแหล่ง</strong> คือไกด์ roz-global.info (อ่าน 8 ก.ย. 2026)
        กับประกาศแพตช์เซิร์ฟไต้หวัน 28 ส.ค. 2025 ที่คัดลอกไว้บนบอร์ด Bahamut (อ่าน 25 ก.ย. 2026) ทั้งคู่เป็นเซิร์ฟไต้หวัน ยังตรวจกับเซิร์ฟเราไม่ได้ ·
        NPC แลก Goblin Coin Shard และอัตราแลก มาจากบอร์ด Bahamut แหล่งเดียว ·
        สายอัปเกรด ★ → ★★ จับคู่ด้วยรหัสทรัพยากรไอเทมจาก divine-pride.net (ขั้นที่ 2 คือรหัสขั้นที่ 1 ต่อท้าย RFP1/RFP2) ไม่ใช่ด้วยชื่อ เพราะชื่ออังกฤษเปลี่ยน {RENAMED.length} สาย ·
        ข้อความอังกฤษต้นทางของบางชิ้นเป็นการแปลจากภาษาจีนมาอีกทอด ชื่อสกิลบางตัวจึงอ่านแปลก ๆ ตั้งแต่ต้นฉบับ ·
        <strong>ไอคอน {CLIENT_UNKNOWN.length} ชิ้นที่ไคลเอนต์ไม่มีข้อมูลให้เลย ดึงมาจาก static.divine-pride.net</strong> ตรวจแล้วว่าไม่ใช่ภาพ &quot;ไม่พบ&quot; ของเว็บนั้นก่อนบันทึกทุกไฟล์ ·
        {NO_PLAIN.length} ชิ้นที่ไม่มีบรรทัดเทียบกับตัวธรรมดา ตรวจกับตารางไอเทมทั้งหมดในไคลเอนต์แล้วว่าไม่มีรุ่นธรรมดาอยู่จริง ไม่ใช่ฐานข้อมูลเราตกหล่น
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
