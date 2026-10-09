import Link from 'next/link';
import JsonLd from '@/components/JsonLd';
import CraftGuide from '@/components/CraftGuide';
import PageHeader from '@/components/PageHeader';
import RecipeTable from '@/components/RecipeTable';
import { breadcrumbJsonLd } from '@/lib/jsonld';
import CraftCalc from '@/components/craft-calc/CraftCalc';
import { craftCalcConfig } from '@/lib/craft-calc-config';
import { CREATE_DEADLY_POISON, recipesOfKind, recipesOfSkill, type Recipe } from '@/lib/crafting';

export const metadata = {
  title: 'วิธีทำยา Alchemist และขวดพิษ Assassin — สูตร Ragnarok Zero',
  description:
    'วิธีปรุงยา Alchemist ด้วย Prepare Potion ใน Ragnarok Zero Global เตรียม Mortar Bowl ตำรา และวัตถุดิบ พร้อมสูตรยาฟื้น ไอเทมเคมี Slim Potion ยาต้านธาตุ และสูตร Poison Bottle ของ Assassin (Create Deadly Poison) · ทำ Counteragent Mixture และสีย้อม 8 สีกับ NPC',
};

// The NPC-made solutions and dyes (owner, 30 Sep 2026). Steps and amounts
// from rozerodb's Alchemy Lab guide, which says its numbers follow the classic
// RateMyServer quest pages and its NPC screenshots are from Global -- so the
// NPCs are seen on Global and the amounts are classic RO's. Rewritten here,
// not quoted. The "made into" column is ours: the hat quests that take each
// dye, from data/crafting-recipes.json.
type Mat = { id: number; name: string; amount: number };
const I = (id: number, name: string, amount = 1): Mat => ({ id, name, amount });
const ALCOHOL = I(970, 'Alcohol');
const BOTTLE = I(713, 'Empty Bottle');
const COUNTER = I(973, 'Counteragent');
const MIXTURE = I(974, 'Mixture');

const UNLOCK = [
  { who: 'Merchant Louitz', map: 'alberta_in', x: 130, y: 54, what: 'บ้านหลังใหญ่ทางเหนือของ Alberta ชั้นบน ห้องสุดทางเดิน · ต้องพก Alcohol, Detrimindexta และ Karvodailnirol อย่างละ 1 ติดตัว (ไม่ถูกใช้) เขาจะส่งไปหาคนต่อไป' },
  { who: 'Aure Dupon', map: 'geffen', x: 181, y: 114, what: 'ฝั่งตะวันออกของ Geffen ใต้เสาไฟ · ถามเรื่อง Morgenstein' },
  { who: 'Morgenstein', map: 'geffen_in', x: 141, y: 140, what: 'ชั้น 2 ตึกกิลด์ช่างตีเหล็กเก่า · ถามเรื่องงานวิจัยก่อน แล้วคุยอีกครั้งเพื่อทำน้ำยา' },
];

const SOLUTIONS = [
  { out: COUNTER, zeny: 3000, mats: [ALCOHOL, I(971, 'Detrimindexta'), BOTTLE] },
  { out: MIXTURE, zeny: 4000, mats: [ALCOHOL, I(972, 'Karvodailnirol'), BOTTLE] },
];

const RED = 507, YELLOW = 508, WHITE = 509, BLUE = 510, GREEN = 511;
const HATS: Record<number, { id: number; name: string }[]> = {
  975: [{ id: 5047, name: 'Fashionable Glasses' }, { id: 5444, name: 'Hair Brush' }, { id: 5039, name: 'Rainbow Eggshell' }, { id: 5077, name: 'Tulip Hairpin' }],
  976: [{ id: 5039, name: 'Rainbow Eggshell' }],
  978: [{ id: 5052, name: 'Blue Hairband' }, { id: 5039, name: 'Rainbow Eggshell' }, { id: 5049, name: 'Striped Hairband' }],
  982: [{ id: 5026, name: 'Chef Hat' }],
};
const DYES = [
  { out: I(975, 'Scarlet Dyestuffs'), zeny: 3000, mats: [I(RED, 'Red Herb', 30), COUNTER, BOTTLE] },
  { out: I(976, 'Lemon Dyestuffs'), zeny: 3000, mats: [I(YELLOW, 'Yellow Herb', 30), COUNTER, BOTTLE] },
  { out: I(978, 'Cobaltblue Dyestuffs'), zeny: 3500, mats: [I(BLUE, 'Blue Herb', 20), COUNTER, BOTTLE] },
  { out: I(982, 'White Dyestuffs'), zeny: 3000, mats: [I(WHITE, 'White Herb', 30), COUNTER, BOTTLE] },
  { out: I(979, 'Darkgreen Dyestuffs'), zeny: 5000, mats: [I(BLUE, 'Blue Herb', 5), I(GREEN, 'Green Herb', 20), I(YELLOW, 'Yellow Herb', 20), COUNTER, MIXTURE, BOTTLE] },
  { out: I(980, 'Orange Dyestuffs'), zeny: 5000, mats: [I(RED, 'Red Herb', 20), I(YELLOW, 'Yellow Herb', 20), COUNTER, MIXTURE, BOTTLE] },
  { out: I(981, 'Violet Dyestuffs'), zeny: 5000, mats: [I(BLUE, 'Blue Herb', 10), I(RED, 'Red Herb', 30), COUNTER, MIXTURE, BOTTLE] },
  { out: I(983, 'Black Dyestuffs'), zeny: 7000, mats: [I(RED, 'Red Herb', 30), I(YELLOW, 'Yellow Herb', 30), I(GREEN, 'Green Herb', 30), I(BLUE, 'Blue Herb', 5), COUNTER, MIXTURE, BOTTLE] },
];

function ItemChip({ m, href }: { m: Mat; href?: string }) {
  return (
    <Link className="recipe__item" href={href ?? `/database/items/${m.id}`}>
      <img src={`/images/items/${m.id}.gif`} alt="" width={18} height={18} style={{ imageRendering: 'pixelated' }} />
      <span>{m.amount > 1 ? `${m.name} ×${m.amount}` : m.name}</span>
    </Link>
  );
}

function CraftTable({ rows, withHats }: { rows: { out: Mat; zeny: number; mats: Mat[] }[]; withHats?: boolean }) {
  return (
    <div className="recipe__scroll">
      <table className="data-table recipe">
        <thead>
          <tr>
            <th>ได้</th>
            <th>ใช้</th>
            <th className="num">ค่าทำ</th>
            {withHats && <th>เอาไปทำหมวก</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.out.id}>
              <td data-label="ได้"><ItemChip m={r.out} /></td>
              <td data-label="ใช้"><span className="recipe__list">{r.mats.map((m) => <ItemChip key={m.id} m={m} />)}</span></td>
              <td data-label="ค่าทำ" className="num">{r.zeny.toLocaleString('en-US')}z</td>
              {withHats && (
                <td data-label="เอาไปทำหมวก">
                  {HATS[r.out.id] ? (
                    <span className="recipe__list">
                      {HATS[r.out.id].map((h) => <ItemChip key={h.id} m={{ ...h, amount: 1 }} href={`/database/equipment/${h.id}`} />)}
                    </span>
                  ) : (
                    <span className="muted">—</span>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// The Creation Guide a recipe needs is its held material; it is the natural
// way to group them (owner, 8 Oct 2026: filter chips on every recipe list).
const bookOf = (r: Recipe) => r.materials.find((m) => m.held && /Guide$/.test(m.name)) ?? null;
const bookTag = (name: string) => 'g' + name.replace(/[^A-Za-z]/g, '');
const shortBook = (name: string) => name.replace(/ Creation Guide$/, '');

export default async function PotionCraftingGuidePage() {
  const confirmed = recipesOfKind('brew').filter((r) => r.confidence === 'both');
  const calc = await craftCalcConfig({
    id: 'brew',
    recipes: recipesOfKind('brew'),
    // One Mortar Bowl per try, success or not (the steps above).
    perTry: [{ id: 7134, name: 'Medicine Bowl (Mortar Bowl)', icon: '/images/items/7134.gif', category: 'Other', amount: 1 }],
    unknownRateNote: 'ยังไม่รู้โอกาสปรุงสำเร็จในเซิร์ฟนี้ (ขึ้นกับ INT DEX LUK Job Level และสกิล) ยอดนี้คิดแบบทำติดทุกครั้ง ถ้าทำไม่ติด Mortar Bowl กับวัตถุดิบก็หายด้วย ควรเผื่อไว้อีก',
  });
  const books = [...new Map(confirmed.map(bookOf).filter((b): b is NonNullable<typeof b> => b != null).map((b) => [b.name, b])).values()];
  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <JsonLd data={breadcrumbJsonLd([
        { name: 'หน้าแรก', path: '/' },
        { name: 'ไกด์', path: '/guides' },
        { name: 'ทำยา Alchemist และขวดพิษ Assassin', path: '/guides/potion-crafting' },
      ])} />
      <PageHeader
        title="วิธีทำยา Alchemist และขวดพิษ Assassin"
        lead={<>ทุกครั้งที่ปรุงต้องมีวัตถุดิบของสูตร ตำราที่ตรงกับยา และ <strong>Mortar Bowl 1 ชิ้น</strong> ตำราไม่หาย แต่ Mortar Bowl กับวัตถุดิบถูกใช้ต่อการลอง 1 ครั้ง</>}
      />

      <nav className="gtiles" aria-label="เลือกส่วนที่จะอ่าน">
        <a className="gtile" href="#recipes">
          <span className="gtile__k">ALCHEMIST</span>
          <span className="gtile__v"><img src="/images/items/501.gif" alt="" width={24} height={24} />{confirmed.length} สูตร</span>
          <span className="gtile__s">Prepare Potion · ยา ขวดเคมี ยาต้านธาตุ</span>
        </a>
        <a className="gtile" href="#assassin">
          <span className="gtile__k">ASSASSIN</span>
          <span className="gtile__v"><img src="/images/items/678.gif" alt="" width={24} height={24} />Poison Bottle</span>
          <span className="gtile__s">Create Deadly Poison</span>
        </a>
        <a className="gtile" href="#alchemy-lab">
          <span className="gtile__k">ทุกอาชีพ</span>
          <span className="gtile__v"><img src="/images/items/975.gif" alt="" width={24} height={24} />สีย้อม 8 สี</span>
          <span className="gtile__s">ทำกับ NPC ไม่ต้องมีสกิล</span>
        </a>
      </nav>

      <section className="card card--cyan" style={{ marginTop: 18 }}>
        <h2 className="section-title">เตรียมก่อนกดทำยา</h2>
        <ol className="gsteps">
          <li>เปลี่ยนเป็น Alchemist และเรียน Potion Research Lv.5 เพื่อปลด Prepare Potion</li>
          <li>พก <Link href="/database/items/7134">Medicine Bowl (Mortar Bowl)</Link> ตามจำนวนครั้งที่จะลอง</li>
          <li>พกตำราของสูตรนั้น ตำราเป็นกุญแจปลดสูตรและไม่ถูกใช้หมด</li>
          <li>พกวัตถุดิบและภาชนะให้ครบ แล้วใช้สกิล Prepare Potion เลือกของที่จะทำ</li>
        </ol>
      </section>

      {/* Replaced twenty hand-typed rows on 7 Sep 2026. They were a subset
          of this table, with no sprites and no links, and the grouping they
          carried -- which Creation Guide each recipe needs -- is the
          "ต้องมีติดตัว" column here. */}
      <section id="recipes" style={{ scrollMarginTop: 90 }}>
        <CraftCalc config={calc}>
        <CraftGuide
          kind="brew"
          calc
          title={`สูตรยา Alchemist (${confirmed.length})`}
          placeholder="ค้นชื่อยา หรือวัตถุดิบ เช่น Red Herb"
          tagsOf={(r) => { const b = bookOf(r); return b ? [bookTag(b.name)] : []; }}
          badgeOf={(r) => { const b = bookOf(r); return b ? shortBook(b.name) : null; }}
          facets={[{
            label: 'ตำรา',
            options: books.map((b) => ({ value: bookTag(b.name), label: shortBook(b.name), icon: b.icon ?? `/images/items/${b.id}.gif`, count: confirmed.filter((r) => bookOf(r)?.name === b.name).length })),
          }]}
        >
          <></>
        </CraftGuide>
        </CraftCalc>
      </section>

      <section className="card card--yellow" style={{ marginTop: 16 }}>
        <h2 className="section-title">เพิ่มโอกาสสำเร็จ</h2>
        <ul style={{ margin: 0, paddingInlineStart: 22 }}>
          <li>เพิ่ม Job Level, INT, DEX และ LUK</li>
          <li>อัป Potion Research และ Prepare Potion (Pharmacy) ให้สูง</li>
          <li>ยาบางกลุ่มมีความยากไม่เท่ากัน: Alcohol ง่ายกว่า ส่วน Condensed White และ Glistening Coat ยากกว่า</li>
          <li>ก่อนทำล็อตใหญ่ ลองจำนวนน้อยและจดผลจริง เพราะสูตรอัตราสำเร็จที่เผยแพร่ยังอิง TWRO ไม่ใช่ประกาศทางการของ ROZ</li>
        </ul>
      </section>

      {/* Added 11 Sep 2026 at the owner's request. The recipe was already in
          data/crafting-recipes.json but hidden as an Assassin Cross skill;
          in Zero, Create Deadly Poison is the Assassin's (lib/crafting). */}
      <section id="assassin" className="card card--pink" style={{ marginTop: 24, scrollMarginTop: 90 }}>
        <h2 className="section-title">Assassin: ทำ Poison Bottle ด้วย Create Deadly Poison</h2>
        <p style={{ marginTop: 0, maxWidth: '68ch' }}>
          Assassin ทำขวดพิษเองได้ด้วยสกิล <strong>Create Deadly Poison</strong> (Lv 1) ใช้วัตถุดิบตามตารางอย่างละ 1 ชิ้นต่อการทำ 1 ขวด
        </p>
        <h3 className="section-title" style={{ fontSize: 14, marginTop: 12 }}>ต้องอัปสกิลเหล่านี้ก่อน</h3>
        <ul style={{ margin: 0, paddingInlineStart: 22 }}>
          <li>Envenom Lv 10</li>
          <li>Detoxify Lv 1</li>
          <li>Enchant Poison Lv 5</li>
        </ul>
        <div style={{ marginTop: 14 }}>
          <RecipeTable rows={recipesOfSkill(CREATE_DEADLY_POISON)} />
        </div>
        <ul className="muted" style={{ marginTop: 12, marginBottom: 0, paddingInlineStart: 22 }}>
          <li>
            {/* The Job 60 caveat came out on 11 Sep 2026: the owner confirmed in
                game that an Assassin can already use Enchant Deadly Poison. */}
            <Link href="/database/items/678">Poison Bottle</Link> เป็นของที่ <strong>Enchant Deadly Poison</strong> ใช้ครั้งละ 1 ขวด ·
            Assassin ในเซิร์ฟ Global ใช้สกิลนี้ได้แล้ว
          </li>
          <li>
            <Link href="/database/items/1771">Venom Knife</Link> ที่สกิล Venom Knife ใช้ ไม่ต้องทำเอง ซื้อจากร้าน NPC ได้ (ดูร้านที่หน้าไอเทม)
          </li>
          <li>ยังไม่มีข้อมูลอัตราสำเร็จของ Create Deadly Poison ในเซิร์ฟนี้ ลองทำจำนวนน้อยก่อนเตรียมวัตถุดิบล็อตใหญ่</li>
        </ul>
      </section>

      <section id="alchemy-lab" style={{ marginTop: 28, scrollMarginTop: 90 }}>
        <h2 className="section-title">น้ำยาและสีย้อม ทำกับ NPC ไม่ต้องมีสกิล</h2>
        <p className="muted" style={{ marginTop: 6, maxWidth: '68ch' }}>
          อาชีพไหนก็ทำได้ · <strong>Counteragent</strong> กับ <strong>Mixture</strong> เป็นน้ำยาที่ใช้ทำสีย้อมและเควสหมวกบางใบ ·
          สีย้อมเอาไปแลกหมวกได้ ดูคอลัมน์ขวาสุด
        </p>

        <h3 className="section-title" style={{ fontSize: 15, marginTop: 14 }}>1. ปลดทำน้ำยา (ทำครั้งเดียว)</h3>
        <ol className="gsteps">
          {UNLOCK.map((u) => (
            <li key={u.who}>
              <strong>{u.who}</strong> <code className="mono navicmd">/navi {u.map} {u.x}/{u.y}</code>
              <br />
              <span className="muted">{u.what}</span>
            </li>
          ))}
        </ol>

        <h3 className="section-title" style={{ fontSize: 15, marginTop: 16 }}>2. ทำน้ำยากับ Morgenstein</h3>
        <CraftTable rows={SOLUTIONS} />

        <h3 className="section-title" style={{ fontSize: 15, marginTop: 16 }}>3. ทำสีย้อมกับ JavaDullihan</h3>
        <p className="muted" style={{ marginTop: 4 }}>
          อยู่ในตึกมุมขวาบนของ Morroc ห้องทางขวา <code className="mono navicmd">/navi morocc_in 146/99</code> · ไม่ต้องปลดก่อน แต่สีส่วนใหญ่ต้องใช้น้ำยาจากข้อ 2
        </p>
        <CraftTable rows={DYES} withHats />
        <p className="muted" style={{ marginTop: 8, fontSize: 13 }}>
          NPC ทั้งหมดมีในเซิร์ฟ Global · จำนวนวัตถุดิบและค่าทำเป็นตัวเลขของ RO คลาสสิก ยังไม่มีใครยืนยันกับเซิร์ฟนี้ ถ้าในเกมไม่ตรงบอกได้
        </p>
      </section>

      <p className="source-note" style={{ marginTop: 16 }}>
        <strong>ที่มา:</strong> เงื่อนไข Prepare Potion และ Potion Research จากข้อมูลไคลเอนต์ ROZ ในฐานข้อมูลของเว็บนี้ ชื่อ “Medicine Bowl” ในฐานข้อมูลคือไอเทมเดียวกับ “Mortar Bowl” ที่คำอธิบายสกิลเรียกใช้
      </p>
      <p className="muted" style={{ marginTop: 16 }}>
        หาไอเทมวัตถุดิบเพิ่มเติมได้ที่ <Link href="/database/items">ฐานข้อมูลไอเทม</Link> และเช็กมอนที่ดรอปจากหน้าไอเทมแต่ละชิ้น
      </p>
    </main>
  );
}
