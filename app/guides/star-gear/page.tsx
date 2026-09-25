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
  stats: { atk: number | null; def: number | null; slots: number | null; weight: number | null; requiredLevel: number | null; weaponLevel: number | null; sellPrice: number | null };
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
  { what: 'ชุด ทางที่ 1 ประหยัดตีบวก', refine: `−${ARMOR_STABLE.refine}`, materials: `โทเคน ★ ของชิ้นนั้น ${ARMOR_STABLE.tokens} อัน (= ของดรอป ${ARMOR_STABLE.tokens} ชิ้น) + Goblin Coin Shard ${ARMOR_STABLE.shards}` },
  { what: 'ชุด ทางที่ 2 ประหยัดของดรอป', refine: `−${ARMOR_STRONG.refine}`, materials: `โทเคน ★ ของชิ้นนั้น ${ARMOR_STRONG.tokens} อัน (= ของดรอป ${ARMOR_STRONG.tokens} ชิ้น) + Goblin Coin Shard ${ARMOR_STRONG.shards}` },
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
    answer: `มี NPC แลกที่ Prontera เอา Goblin Coin หรือ Goblin Silver Coin ไปแลก หรือจ่าย Zeny แลกแบบสุ่ม รายละเอียดอยู่ในหัวข้อวิธีทำ ข้อมูลนี้มาจากฝั่งไต้หวันเท่านั้น ไคลเอนต์เรามีไอเทมทั้งสามชิ้นแล้วแต่ยังไม่มี NPC`,
  },
  {
    question: 'ขั้นที่ 2 ปลุกจากเล่มไหน ต้องเป็นอาวุธ ★ ก่อนไหม',
    answer: 'น่าจะใช่ ยังไม่มีประกาศเขียนตรง ๆ แต่รหัสไอเทมของ ★★ เป็นรหัสของรุ่น ★ ต่อท้าย ขั้นที่ 2 เสียตีบวกน้อยกว่า และโทเคน ★★ ทำได้จากอาวุธ ★ เท่านั้น เหตุผลเต็มอยู่ในหัวข้ออาวุธ',
  },
  {
    question: 'ชุด ผ้าคลุม รองเท้า มีขั้นที่ 2 ไหม',
    answer: `ไม่มี ของสวมใส่ปลุกได้ขั้นเดียวเป็น ★ แต่เลือกจ่ายได้สองทาง (ของดรอป ${ARMOR_STABLE.tokens} ชิ้นเสียตีบวก ${ARMOR_STABLE.refine} ขั้น หรือของดรอป ${ARMOR_STRONG.tokens} ชิ้นเสียตีบวก ${ARMOR_STRONG.refine} ขั้น) ข้อยกเว้นเดียวคือโล่ Improved Wrist Guard ของ Ninja ที่เกมจัดกติกาแบบอาวุธ จึงมี ★★ Sun กับ ★★★ Moon`,
  },
  {
    question: 'อาวุธที่ติดดาวได้มีแค่นี้เองหรือ',
    answer: 'ใช่ ณ ตอนนี้ รายการในหน้านี้คือทุกชิ้นที่มีในไฟล์เกมของเรา และตรงกับไกด์ฝรั่งเศสกับประกาศไต้หวัน (ไต้หวันมีเพิ่มแค่ขั้นที่ 2 ของ Wire Whip กับ Lute ซึ่งลงไว้ให้แล้ว) ประกาศทางการเขียนเองว่าอาจเพิ่มชิ้นใหม่ในอัปเดตหน้า ไม่ใช่ทุกอาวุธในเกมจะติดดาวได้',
  },
  {
    question: '★ กับ ★★ และ ★★★ ต่างกันยังไง',
    answer: '★ คือขั้นที่ 1 ได้โบนัสเป็นก้อนที่ +3 +7 และ +9 ส่วน ★★ กับ ★★★ เป็นขั้นที่ 2 ด้วยกันทั้งคู่ ไม่ใช่คนละขั้น เป็นสองแบบให้เลือกของชิ้นเดียวกัน ขั้นที่ 2 ได้โบนัสทุก ๆ 2 ขั้นที่ตีบวก และมีก้อนพิเศษที่ +7 +9 และ +11',
  },
];

function PieceCard({ piece }: { piece: Piece }) {
  const text = thai(piece);
  // A second-tier piece is made from its ★ piece, so that is what it is
  // compared against (the ordinary item is two steps back, and for the
  // renamed chains a same-named ordinary item is a different weapon).
  const madeFrom = piece.tier === 2 ? chainFile.chains.find((c) => c.second.includes(piece.id)) : undefined;
  const first = madeFrom ? BY_ID.get(madeFrom.first) : undefined;
  const plain = first
    ? { id: first.id, category: first.category, atk: first.starAtk, slots: first.slots, requiredLevel: first.requiredLevel, label: first.name, href: `#item-${first.id}` }
    : piece.plain
      ? { ...piece.plain, label: 'ตัวธรรมดา', href: itemHref(piece.plain.id, piece.plain.category) }
      : null;
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
      <div className="statgrid star__stats">
        {piece.stats.atk != null && <div className="statgrid__cell"><span className="reward-label">ATK</span><span className="reward-value mono">{piece.stats.atk}</span></div>}
        {piece.stats.def != null && <div className="statgrid__cell"><span className="reward-label">DEF</span><span className="reward-value mono">{piece.stats.def}</span></div>}
        {piece.stats.slots != null && <div className="statgrid__cell"><span className="reward-label">Slot</span><span className="reward-value mono">{piece.stats.slots > 0 ? `[${piece.stats.slots}]` : 'ไม่มี'}</span></div>}
        {piece.stats.weight != null && <div className="statgrid__cell"><span className="reward-label">น้ำหนัก</span><span className="reward-value mono">{piece.stats.weight}</span></div>}
        {piece.stats.requiredLevel != null && <div className="statgrid__cell"><span className="reward-label">ใช้ได้ที่เลเวล</span><span className="reward-value mono">{piece.stats.requiredLevel}</span></div>}
        {piece.stats.weaponLevel != null && <div className="statgrid__cell"><span className="reward-label">Weapon Lv</span><span className="reward-value mono">{piece.stats.weaponLevel}</span></div>}
        {piece.stats.sellPrice != null && <div className="statgrid__cell"><span className="reward-label">ราคาขาย</span><span className="reward-value mono">{piece.stats.sellPrice.toLocaleString('en-US')} z</span></div>}
      </div>
      <p className="star__facts">
        {[piece.footer.type ? `ช่อง: ${piece.footer.type}` : null, piece.footer.jobs ? `ใส่ได้: ${jobs(piece)}` : null].filter(Boolean).join(' · ')}
      </p>
      {gained.length > 0 && plain && (
        <p className="star__gain">
          เทียบกับ{first ? first.name : 'ตัวธรรมดา'}: {gained.join(' · ')} · {first ? <a href={plain.href}>ดู {first.name}</a> : <Link href={plain.href}>ดูตัวธรรมดา</Link>}
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

// The page is split by what the reader owns: weapons and wearables have
// different activation rules (two tiers vs one tier with two modes), so each
// gets its own block with its own cost table and its own list. The one shield
// with a second tier (Improved Wrist Guard) sits in the wearables block with
// a note, because that is where a reader looks for a shield.
const WEAPON_FIRST = FIRST.filter((p) => p.category === 'Weapon');
const WEAPON_CHAINS = CHAINS.filter((c) => c.first.category === 'Weapon');
const WEAR_CHAINS = CHAINS.filter((c) => c.first.category !== 'Weapon');
const WEAR_FIRST = FIRST.filter((p) => p.category !== 'Weapon' && !WEAR_CHAINS.some((c) => c.first.id === p.id));
const WEAPON_NO_TIER2 = WEAPON_FIRST.filter((p) => !WEAPON_CHAINS.some((c) => c.first.id === p.id) && !GUIDE_ONLY.some((g) => g.firstTierId === p.id));
// "All Classes Class" minus every " Class" is "Alles" -- strip one suffix
// per job, and say ทุกอาชีพ for the catch-all.
function jobs(piece: Piece): string {
  return (piece.footer.jobs ?? '')
    .split(', ')
    .filter(Boolean)
    .map((j) => j.replace(/ Class$/, ''))
    .map((j) => (j === 'All Classes' ? 'ทุกอาชีพ' : j))
    .join(', ');
}
// The ★ piece a token belongs to: the token carries the tier-1 name, except
// Hora's, which is named after its tier-2 piece (see data/star-chain.json).
function tokenSource(token: Token): Piece | undefined {
  const name = token.name.replace(/^★ (.*) (Forging|Crafting) Token$/, '$1');
  return (
    FIRST.find((p) => baseName(p.name) === name) ??
    CHAINS.find((c) => baseName(c.second[0].name) === name)?.first
  );
}

function ChainTable({ chains }: { chains: typeof CHAINS }) {
  return (
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
          {chains.map(({ first, second, renamed }) => (
            <tr key={first.id}>
              <td data-label="ขั้นที่ 1">
                <a className="recipe__item" href={`#item-${first.id}`}>
                  <ItemIcon iconUrl={first.icon} category={first.category} size={20} />
                  <span>{first.name}</span>
                </a>
                {renamed && <span className="star__renamed">ชื่อเปลี่ยนตอนขึ้นขั้น 2</span>}
              </td>
              <td data-label="ใครใส่" className="muted" style={{ fontSize: 13 }}>{jobs(first)}</td>
              {second.map((piece) => (
                <td key={piece.id} data-label={'★'.repeat(piece.stars)}>
                  <a className="recipe__item" href={`#item-${piece.id}`}>
                    <ItemIcon iconUrl={piece.icon} category={piece.category} size={20} />
                    <span>{baseName(piece.name)}</span>
                  </a>
                  <span className="muted" style={{ display: 'block', fontSize: 12.5 }}>
                    {[headline(piece), jobs(piece)].filter(Boolean).join(' · ')}
                  </span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CostTable({ rows }: { rows: { what: string; refine: string; materials: string }[] }) {
  return (
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
          {rows.map((row) => (
            <tr key={row.what}>
              <td data-label="ปลุกอะไร">{row.what}</td>
              <td data-label="ตีบวกหาย" className="num">{row.refine}</td>
              <td data-label="ใช้อะไร">{row.materials}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
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
        <a href="#sec-how">วิธีทำ</a>
        <a href="#sec-weapons">อาวุธ</a>
        <a href="#sec-wear">ของสวมใส่</a>
        <a href="#sec-token">โทเคน</a>
        <a href="#sec-faq">คำถามที่เจอบ่อย</a>
      </nav>

      <section className="card card--yellow" id="sec-status">
        <h2 className="section-title" style={{ marginTop: 0 }}>ยังกดปลุกไม่ได้</h2>
        <p className="star__status">
          ไอเทม ★ อยู่ในไคลเอนต์แล้ว และเห็นได้ในฐานข้อมูล แต่ <strong>ระบบปลุกยังไม่เปิดในเซิร์ฟ Global</strong>{' '}
          เจ้าของเว็บเข้าไปหา NPC ตามพิกัดในเกมเมื่อ 24 ก.ย. 2026 แล้วไม่เจอ ทุกอย่างในหน้านี้จึงเป็นกติกาของเซิร์ฟไต้หวันที่เปิดไปก่อน
          หน้านี้มีไว้ให้<strong>เตรียมของรอ</strong> เพราะของที่ต้องใช้สะสมนานมาก ถ้าขายทิ้งไปก่อนก็ต้องเริ่มนับหนึ่งใหม่
        </p>
      </section>

      <section className="card card--cyan" id="sec-overview">
        <h2 className="section-title" style={{ marginTop: 0 }}>ภาพรวมใน 4 บรรทัด</h2>
        <ul className="star__prep" style={{ listStyle: 'disc' }}>
          <li><strong>มีของ 2 กลุ่ม</strong> <a href="#sec-weapons">อาวุธ</a> {WEAPON_FIRST.length} ชิ้น กับ <a href="#sec-wear">ของสวมใส่</a> {WEAR_FIRST.length + WEAR_CHAINS.length} ชิ้น กติกาคนละแบบ</li>
          <li><strong>อาวุธมี 2 ขั้น</strong> ★ แล้วปลุกต่อเป็น ★★ หรือ ★★★ (เลือกอย่างใดอย่างหนึ่ง) ส่วน<strong>ของสวมใส่มีขั้นเดียว</strong> แต่เลือกจ่ายได้ 2 ทาง (ของดรอปเยอะ หรือเสียตีบวกเยอะ)</li>
          <li><strong>ทุกอย่างใช้ของ 2 อย่าง</strong> โทเคนของชิ้นนั้น (ได้จากเอาของดรอปชิ้นเดียวกันไปแลก) กับ Goblin Coin Shard</li>
          <li><strong>ปลุกแล้วเสียขั้นตีบวก</strong> 3 หรือ 7 ขั้น การ์ดกับเอนแชนต์ไม่หาย</li>
        </ul>
      </section>

      <section className="card" id="sec-how">
        <h2 className="section-title" style={{ marginTop: 0 }}>วิธีทำ ตั้งแต่ของดรอปจนถึงของติดดาว</h2>
        <ol className="star__prep">
          <li>
            <strong>เลือกชิ้นที่จะปลุก แล้วตีบวกให้สูงไว้ก่อน</strong> ต้องเป็นชิ้นที่มีรุ่นติดดาว (ดูรายการในหัวข้ออาวุธ/ของสวมใส่)
            เพราะปลุกแล้วขั้นตีบวกหายไป 3 หรือ 7 ขั้น ตัวอย่างในประกาศไต้หวันคือเอาอาวุธ +{WEAPON_TIER1.refine} ไปปลุก ออกมาเป็น ★ +0
          </li>
          <li>
            <strong>เก็บของชนิดเดียวกันที่มอนดรอปให้ครบจำนวน</strong> แล้วเอาไปแลกโทเคนกับ NPC ตัวแรก ของ 1 ชิ้นได้โทเคน ★ 1 อัน
            ของซื้อจากร้าน NPC ใช้แลกไม่ได้ โทเคนของชิ้นไหนใช้ปลุกได้เฉพาะชิ้นนั้น
          </li>
          <li>
            <strong>หา <Link href={itemHref(SHARD_ITEM.id, null)}>{SHARD_ITEM.name}</Link></strong> จาก NPC แลกที่ {SHARD_NPC.where} ({SHARD_NPC.name})
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
            <strong>เอาของ + โทเคน + เศษเหรียญไปหา NPC ตัวที่สอง</strong> กดปลุก ได้ของติดดาว ★ การ์ดกับเอนแชนต์ที่ใส่ไว้ยังอยู่ครบ
          </li>
          <li>
            <strong>อาวุธปลุกต่อได้อีกขั้น</strong> เอาอาวุธ ★ ไปแลกโทเคน ★★ (เล่มละอัน) แล้วปลุกอาวุธ ★ อีกเล่มเป็น ★★ หรือ ★★★ รายละเอียดอยู่ในหัวข้ออาวุธ
            ของสวมใส่ไม่มีขั้นนี้
          </li>
        </ol>

        <h3 className="star__h3" style={{ marginTop: 18 }}>NPC ทั้งสองตัว อยู่ที่ <Link href="/database/maps/prontera">Prontera</Link> แทบจะติดกัน</h3>
        <ol className="star__npcs">
          {NPCS.map((npc) => (
            <li key={npc.name}>
              <span className="star__step">{npc.step}</span>
              <div>
                <p className="star__npcname">
                  {npc.name} <span className="star__where">{npc.where}</span>
                  {!npc.confirmed && <span className="star__unconfirmed">ชื่อนี้มาจากไกด์และประกาศไต้หวัน ยังไม่มีในข้อมูลไคลเอนต์ที่เรามี</span>}
                </p>
                <p className="star__detail">{npc.what}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="muted" style={{ marginTop: 10, fontSize: 13, maxWidth: '74ch' }}>
          ชื่อของ NPC ขั้นที่ 2 ยืนยันได้จากคำบรรยายไอเทมในเกมเอง {NPC_CONFIRMED_BY} ชิ้น ทุกชิ้นให้พิกัดตรงกัน
        </p>

        <h3 className="star__h3" style={{ marginTop: 18 }}>ตอนนี้ควรทำอะไร</h3>
        <ul className="star__prep" style={{ listStyle: 'disc' }}>
          <li><strong>อย่าขายของดรอปที่มีรุ่นติดดาว</strong> อาวุธ ★ หนึ่งเล่มกินของดรอป {WEAPON_TIER1.tokens} ชิ้น</li>
          <li><strong>เก็บ Goblin Coin, Goblin Silver Coin และ Goblin Coin Shard</strong> ทุกแบบของการปลุกใช้เศษเหรียญ {ARMOR_STRONG.shards} ถึง {ARMOR_STABLE.shards} อัน</li>
          <li><strong>ดูก่อนว่าของที่ใช้อยู่มีรุ่นติดดาวไหม</strong> ไม่ใช่ทุกชิ้นที่คุ้ม บางชิ้น ATK เท่าเดิมได้แต่เอฟเฟกต์ บางชิ้น ATK กระโดดเกือบเท่าตัว</li>
        </ul>
        <p className="guildp__src">
          ที่มา: ขั้นตอน จำนวนโทเคน เศษเหรียญ และขั้นตีบวกที่หาย ตรงกันสองแหล่ง คือไกด์ roz-global.info (อ่าน 8 ก.ย. 2026)
          กับประกาศแพตช์เซิร์ฟไต้หวัน 28 ส.ค. 2025 ที่ผู้เล่นคัดลอกไว้บนบอร์ด Bahamut (อ่าน 25 ก.ย. 2026) · NPC แลกเศษเหรียญและอัตราแลก มาจากบอร์ด Bahamut แหล่งเดียว ·
          ชื่อและพิกัด NPC ขั้นที่ 2 ตรวจกับข้อมูลไคลเอนต์ของเราเองแล้ว
        </p>
      </section>

      <AdSlot slot="inline" />

      <section id="sec-weapons" style={{ marginTop: 26 }}>
        <h2 className="section-title">อาวุธ <span className="muted" style={{ fontWeight: 400 }}>· ★ {WEAPON_FIRST.length} ชิ้น · ปลุกต่อเป็นขั้นที่ 2 ได้ {WEAPON_CHAINS.length} สาย</span></h2>

        <section className="card">
          <h3 className="star__h3" style={{ marginTop: 0 }}>อาวุธใช้อะไร เสียอะไร</h3>
          <CostTable rows={ACTIVATION.slice(0, 2)} />
          <p className="muted" style={{ marginTop: 10, fontSize: 13, maxWidth: '74ch' }}>
            <strong>สังเกตว่ามันเป็นลูกโซ่</strong> โทเคน ★ ได้จากของที่มอนดรอป จึงต้องใช้ถึง {WEAPON_TIER1.tokens} อัน ส่วนโทเคน ★★
            ได้จากการเอา<strong>อาวุธที่ปลุกขั้นที่ 1 แล้ว</strong>ไปแลก จึงใช้แค่ {WEAPON_TIER2.tokens} อัน แต่ {WEAPON_TIER2.tokens} อันนั้นแปลว่าต้องมีอาวุธ ★ {WEAPON_TIER2.tokens} เล่มไปแลกก่อน
          </p>

          <div className="star__example">
            <p className="star__example-title">ขั้นที่ 2 ปลุกจากเล่มไหน</p>
            <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.8 }}>
              <strong>น่าจะปลุกจากอาวุธ ★ ที่ปลุกขั้นที่ 1 มาแล้ว ไม่ใช่เล่มธรรมดา</strong> ยังไม่มีประกาศไหนเขียนตรง ๆ แต่หลักฐานชี้ทางเดียวกัน 3 อย่าง:
            </p>
            <ul>
              <li>รหัสไอเทมในเกม: ★ Slayer คือ <code className="mono">Z_Slaye_RF</code> ส่วน ★★ คือ <code className="mono">Z_Slaye_RFP1</code> เป็นรหัสของรุ่น ★ ต่อท้าย ไม่ใช่รหัสของเล่มธรรมดา</li>
              <li>ขั้นที่ 2 เสียตีบวกแค่ {WEAPON_TIER2.refine} ขั้น ขณะที่ขั้นที่ 1 เสีย {WEAPON_TIER1.refine} ถ้าเริ่มจากเล่มธรรมดาเหมือนกันก็ไม่มีเหตุให้ต่างกัน</li>
              <li>โทเคน ★★ ทำได้จากอาวุธ ★ อย่างเดียว ทั้งชั้นนี้หมุนรอบอาวุธ ★</li>
            </ul>
            <p className="star__example-title" style={{ marginTop: 10 }}>ตัวอย่างนับของ ถ้าอยากได้ ★★ Crossbow หนึ่งเล่ม (นับตามข้อสรุปข้างบน)</p>
            <ul>
              <li>อาวุธ ★ {EXAMPLE.starWeaponsForTokens} เล่มเอาไปแลกโทเคน ★★ + อีก 1 เล่มที่จะปลุก = ต้องปลุกขั้นที่ 1 ทั้งหมด {EXAMPLE.starWeaponsForTokens + 1} เล่ม</li>
              <li>Crossbow ที่มอนดรอป: {EXAMPLE.dropsPerStar} × {EXAMPLE.starWeaponsForTokens + 1} = <strong>{EXAMPLE.dropsTotal.toLocaleString('en-US')} ชิ้น</strong></li>
              <li>Goblin Coin Shard: {WEAPON_TIER1.shards} × {EXAMPLE.starWeaponsForTokens + 1} + {WEAPON_TIER2.shards} = <strong>{EXAMPLE.shardsTotal} อัน</strong></li>
              <li className="muted">ถ้าปรากฏว่าปลุกจากเล่มธรรมดาได้ ก็ลดไป {EXAMPLE.dropsPerStar} ชิ้นกับ {WEAPON_TIER1.shards} อัน</li>
            </ul>
          </div>
        </section>

        <section className="card" id="sec-chain">
          <h3 className="star__h3" style={{ marginTop: 0 }}>สายอัปเกรด ★ ตัวไหนกลายเป็น ★★ / ★★★ ตัวไหน</h3>
          <p className="muted" style={{ marginTop: 2, maxWidth: '74ch' }}>
            ขั้นที่ 2 มี 2 แบบให้เลือกของสายเดียวกัน (ไม่ใช่ 3 ขั้นตามจำนวนดาว) เลือกแล้วคือคนละชิ้น บางคู่เปลี่ยนสายจากกายภาพเป็นเวท
            และมักเป็นของ<strong>อาชีพขั้นที่ 2</strong>คนละอาชีพ เช่น ★★ Crossbow ของ Hunter, ★★★ Crossbow ของ Rogue ·{' '}
            <strong>ชื่ออังกฤษในเกมเปลี่ยนไประหว่างขั้น {RENAMED.length} สาย</strong> เช่น ★ Slayer กลายเป็น ★★ Two Handed Sword
            ตารางนี้จับคู่ด้วยรหัสไอเทม ไม่ใช่ชื่อ · กดชื่อเพื่อกระโดดไปดูผลเต็มของชิ้นนั้น
          </p>
          <ChainTable chains={WEAPON_CHAINS} />
          <p className="muted" style={{ marginTop: 12, fontSize: 13, maxWidth: '74ch' }}>
            อาวุธ ★ อีก {WEAPON_NO_TIER2.length} ชิ้น ({WEAPON_NO_TIER2.map((p) => baseName(p.name)).join(', ')}) ยังไม่มีขั้นที่ 2 ในแหล่งไหนเลย
            ส่วน {GUIDE_ONLY.map((g) => g.family).join(' กับ ')} ไต้หวันประกาศขั้นที่ 2 แล้วแต่ไฟล์เกมเรายังไม่มี (อยู่ท้ายรายการอาวุธ)
          </p>
        </section>

        <h3 className="star__group" style={{ marginTop: 22 }}>
          <span className="star__stars">★</span> อาวุธขั้นที่ 1{' '}
          <span className="muted" style={{ fontWeight: 400, fontSize: 14 }}>{WEAPON_FIRST.length} ชิ้น เรียงตามชื่อ</span>
        </h3>
        <p className="muted" style={{ marginTop: 2, maxWidth: '74ch' }}>
          แต่ละใบบอกผลตอนใส่เฉย ๆ แล้วไล่ทีละขั้นตีบวก ชิ้นที่หาตัวธรรมดามาเทียบได้จะมีบรรทัดบอกว่าติดดาวแล้ว ATK กับ Slot ขยับเท่าไร
          ชิ้นที่ไม่มีบรรทัดนั้น ตรวจกับไคลเอนต์แล้วว่าไม่มีรุ่นธรรมดาอยู่จริง
        </p>
        {WEAPON_FIRST.map((piece) => (
          <PieceCard key={piece.id} piece={piece} />
        ))}

        <h3 className="star__group" style={{ marginTop: 22 }}>
          <span className="star__stars">★★ / ★★★</span> อาวุธขั้นที่ 2{' '}
          <span className="muted" style={{ fontWeight: 400, fontSize: 14 }}>{WEAPON_CHAINS.length} สาย สายละสองแบบ</span>
        </h3>
        <p className="muted" style={{ marginTop: 2, maxWidth: '74ch' }}>วางคู่กันไว้ให้เทียบ เพราะตอนปลุกต้องเลือกแบบใดแบบหนึ่ง</p>
        {WEAPON_CHAINS.map(({ first, second }) => (
          <div key={first.id} className="star__pair">
            <h4 className="star__pairname">
              {baseName(second[0].name)}{' '}
              <span className="muted" style={{ fontWeight: 400, fontSize: 13 }}>
                ทำจาก <a href={`#item-${first.id}`}>{first.name}</a>
              </span>
            </h4>
            {second.map((piece) => (
              <PieceCard key={piece.id} piece={piece} />
            ))}
          </div>
        ))}

        <h3 className="star__group" style={{ marginTop: 22 }}>
          <span className="star__stars">★★</span> ประกาศแล้วที่ไต้หวัน แต่ยังไม่มีในไคลเอนต์เรา{' '}
          <span className="muted" style={{ fontWeight: 400, fontSize: 14 }}>{GUIDE_ONLY.length} สาย</span>
        </h3>
        <p className="muted" style={{ marginTop: 2, maxWidth: '74ch' }}>
          ไฟล์เกมของเรายังไม่มีไอเทมพวกนี้ จึงยังกดดูในฐานข้อมูลไม่ได้ ตัวเลขแปลจากไกด์ตรง ๆ เป็นแหล่งเดียว และอาจต่างจากตอนเข้าเซิร์ฟเรา
        </p>
        {GUIDE_ONLY.map((g) => (
          <div key={g.family} className="star__pair">
            <h4 className="star__pairname">
              {g.family}{' '}
              <span className="muted" style={{ fontWeight: 400, fontSize: 13 }}>
                ทำจาก <a href={`#item-${g.first.id}`}>{g.first.name}</a>
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

      <section id="sec-wear" style={{ marginTop: 26 }}>
        <h2 className="section-title">ของสวมใส่ <span className="muted" style={{ fontWeight: 400 }}>· ★ {WEAR_FIRST.length + WEAR_CHAINS.length} ชิ้น · มีขั้นเดียว</span></h2>

        <section className="card">
          <h3 className="star__h3" style={{ marginTop: 0 }}>ของสวมใส่ใช้อะไร เสียอะไร</h3>
          <p className="star__status" style={{ marginTop: 2 }}>
            <strong>ของสวมใส่ไม่มีขั้นที่ 2</strong> ปลุกครั้งเดียวได้ ★ แล้วจบ
          </p>
          <p className="muted" style={{ marginTop: 6, maxWidth: '74ch' }}>
            แต่ตอนปลุกมี<strong>ให้เลือก 2 ทาง</strong> ได้ชุด ★ ชิ้นเดียวกัน ต่างกันแค่ว่าจะจ่ายด้วยของดรอป หรือจ่ายด้วยขั้นตีบวก:
          </p>
          <ul className="star__prep" style={{ listStyle: 'disc', marginTop: 8 }}>
            <li><strong>ทางที่ 1 ประหยัดตีบวก</strong> ใช้ของดรอปชิ้นเดียวกัน {ARMOR_STABLE.tokens} ชิ้น + เศษเหรียญ {ARMOR_STABLE.shards} อัน เสียตีบวกแค่ {ARMOR_STABLE.refine} ขั้น</li>
            <li><strong>ทางที่ 2 ประหยัดของดรอป</strong> ใช้ของดรอปแค่ {ARMOR_STRONG.tokens} ชิ้น + เศษเหรียญ {ARMOR_STRONG.shards} อัน แต่เสียตีบวก {ARMOR_STRONG.refine} ขั้น</li>
          </ul>
          <CostTable rows={ACTIVATION.slice(2)} />
          <div className="star__example">
            <p className="star__example-title">ตัวอย่าง: มี Boots +10 อยู่หนึ่งคู่ อยากปลุก</p>
            <ul>
              <li>ทางที่ 1: หา Boots ดรอปอีก {ARMOR_STABLE.tokens} คู่ ปลุกแล้วได้ ★ Boots <strong>+{10 - ARMOR_STABLE.refine}</strong></li>
              <li>ทางที่ 2: หา Boots ดรอปแค่ {ARMOR_STRONG.tokens} คู่ ปลุกแล้วได้ ★ Boots <strong>+{10 - ARMOR_STRONG.refine}</strong> แล้วค่อยตีบวกกลับขึ้นไปเอง</li>
              <li className="muted">เลือกตามว่าอะไรหายากกว่าสำหรับคุณ ของดรอป {ARMOR_STABLE.tokens - ARMOR_STRONG.tokens} ชิ้น หรือการตีบวกกลับ {ARMOR_STRONG.refine - ARMOR_STABLE.refine} ขั้น</li>
            </ul>
          </div>
        </section>

        <h3 className="star__group" style={{ marginTop: 22 }}>
          <span className="star__stars">★</span> ชุด ผ้าคลุม รองเท้า{' '}
          <span className="muted" style={{ fontWeight: 400, fontSize: 14 }}>{WEAR_FIRST.length} ชิ้น ใส่ได้ทุกอาชีพ</span>
        </h3>
        {WEAR_FIRST.map((piece) => (
          <PieceCard key={piece.id} piece={piece} />
        ))}

        <section className="card card--cyan" style={{ marginTop: 22 }}>
          <h3 className="star__h3" style={{ marginTop: 0 }}>ข้อยกเว้นชิ้นเดียว: โล่ที่มีขั้นที่ 2</h3>
          <p className="muted" style={{ marginTop: 2, maxWidth: '74ch' }}>
            {WEAR_CHAINS.map((c) => c.first.name).join(', ')} เป็นโล่ของ Ninja แต่เกมจัดมันอยู่ในกติกาแบบ<strong>อาวุธ</strong>:
            มีขั้นที่ 2 ให้เลือก 2 แบบ (Sun สายกายภาพ / Moon สายเวท) ไกด์ต้นทางก็ลิสต์มันไว้ในตารางอาวุธ
            ถ้าจะปลุกชิ้นนี้ให้ใช้ตารางค่าใช้จ่ายของอาวุธ
          </p>
          <ChainTable chains={WEAR_CHAINS} />
        </section>
        {WEAR_CHAINS.map(({ first, second }) => (
          <div key={first.id}>
            <PieceCard piece={first} />
            <div className="star__pair">
              <h4 className="star__pairname">ขั้นที่ 2 ของ {first.name}</h4>
              {second.map((piece) => (
                <PieceCard key={piece.id} piece={piece} />
              ))}
            </div>
          </div>
        ))}
      </section>

      <section id="sec-token" style={{ marginTop: 26 }}>
        <h2 className="section-title">
          โทเคนสำหรับปลุก <span className="muted" style={{ fontWeight: 400 }}>· {TOKENS.length} แบบ</span>
        </h2>
        <p className="star__status" style={{ marginTop: 2 }}>
          <strong>ได้มายังไง:</strong> เอาอาวุธชิ้นนั้นที่มอนดรอปไปแลกกับ NPC ตัวแรก ({NPCS[0].where}) ของดรอป 1 ชิ้น = โทเคน 1 อัน
          ของซื้อจากร้าน NPC ใช้แลกไม่ได้ อาวุธ ★ ต้องใช้ {WEAPON_TIER1.tokens} อัน แปลว่าต้องหาของดรอปชิ้นเดียวกัน {WEAPON_TIER1.tokens} ชิ้น
        </p>
        <p className="muted" style={{ marginTop: 6, marginBottom: 10, maxWidth: '72ch' }}>
          ในเกมเรียกว่า Forging Token / Crafting Token โทเคนของชิ้นไหนใช้ปลุกได้เฉพาะชิ้นนั้น ชื่อโทเคนตั้งตามชื่ออาวุธขั้นที่ 1
          ยกเว้น Studded Knuckles ที่เป็นโทเคนของ ★ Hora · ชุดกับผ้าคลุมยังไม่มีไอเทมโทเคนในไคลเอนต์ · ส่วนโทเคน ★★ ไม่มีไอเทมแยก ได้จากเอาอาวุธ ★ ไปแลกที่ NPC เดียวกัน
        </p>
        <ul className="star__tokens">
          {TOKENS.map((token) => {
            const source = tokenSource(token);
            return (
              <li key={token.id}>
                <Link className="recipe__item" href={itemHref(token.id, token.category)}>
                  <ItemIcon iconUrl={token.icon} category={token.category} size={20} />
                  <span>{token.name}</span>
                </Link>
                <span className="star__tokensrc">
                  แลกจาก{' '}
                  {source?.plain ? (
                    <Link href={itemHref(source.plain.id, source.plain.category)}>{baseName(source.name)}</Link>
                  ) : (
                    <span>{source ? baseName(source.name) : token.name.replace(/^★ (.*) (Forging|Crafting) Token$/, '$1')}</span>
                  )}{' '}
                  ที่มอนดรอป 1 ชิ้น
                  {source && <> · ใช้ปลุก <a href={`#item-${source.id}`}>{source.name}</a></>}
                </span>
              </li>
            );
          })}
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
        <strong>NPC ขั้นที่ 1 พิกัด กติกาแลกโทเคน และค่าใช้จ่ายในการปลุก ตรงกันสองแหล่ง</strong> คือไกด์ roz-global.info (อ่าน 8 ก.ย. 2026)
        กับประกาศแพตช์เซิร์ฟไต้หวัน 28 ส.ค. 2025 ที่คัดลอกไว้บนบอร์ด Bahamut (อ่าน 25 ก.ย. 2026) ทั้งคู่เป็นเซิร์ฟไต้หวัน ยังตรวจกับเซิร์ฟเราไม่ได้ ·
        NPC แลก Goblin Coin Shard และอัตราแลก มาจากบอร์ด Bahamut แหล่งเดียว ·
        &quot;ขั้นที่ 2 ปลุกจากอาวุธ ★&quot; เป็นข้อสรุปของเราจากรหัสไอเทมและตัวเลข ไม่มีประกาศยืนยัน ·
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
