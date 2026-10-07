// app/tools/build/page.tsx
//
// The build simulator (owner, 6 Oct 2026). It replaced /tools/hit-flee, which
// asked for HIT/FLEE off the status window and listed monsters: a player who
// wants to hit one monster opens that monster's page, so the list was little
// used. What the site lacked was a place to put a whole character together --
// stats, gear, cards, food -- and see the status window before spending
// points or zeny. The old path redirects here (next.config.mjs), and monster
// pages read the HIT/FLEE this page saves.
//
// The site's flagship tool (owner, same day): its own arcade marquee instead
// of the plain page header, and the source as one short line at the foot
// rather than a paragraph above the tool.
//
// SEO pass, 7 Oct 2026 (Downloads/rozerothai-audit/tools-build-seo.md): the
// page was ~400 words of button labels. Under the tool now: how to use it,
// the formulas with which are measured, and short answers to what players
// ask -- written for players, rendered on the server so search engines read
// it too. No FAQPage or HowTo markup (lib/jsonld rules); WebApplication only.
import BuildSimulator from '@/components/BuildSimulator';
import JsonLd from '@/components/JsonLd';
import { breadcrumbJsonLd, webApplicationJsonLd } from '@/lib/jsonld';

const DESCRIPTION =
  'จำลองบิลด์และคำนวณสเตตัส Ragnarok Zero: เลือกอาชีพ อัปสเตตัสตามแต้มจริง ใส่อุปกรณ์ ตีบวก การ์ด เอนชานต์ อาหาร แล้วดู HIT FLEE CRI ATK MATK ASPD HP SP และตีมอนที่เลือกโดนกี่ %';

export const metadata = {
  title: 'จำลองบิลด์ · คำนวณสเตตัส Ragnarok Zero — HIT FLEE ASPD ใส่ของ การ์ด',
  description: DESCRIPTION,
  alternates: { canonical: '/tools/build' },
  openGraph: { images: [{ url: '/og-build.png', width: 1200, height: 630 }] },
  twitter: { card: 'summary_large_image', images: ['/og-build.png'] },
};

// A parade of classes across the marquee: decoration, one of each line.
const PARADE = ['knight', 'wizard', 'hunter', 'priest', 'assassin', 'blacksmith'];

export default function BuildPage() {
  return (
    <main className="shell" style={{ paddingBlock: 24 }}>
      <JsonLd data={breadcrumbJsonLd([
        { name: 'หน้าแรก', path: '/' },
        { name: 'จำลองบิลด์', path: '/tools/build' },
      ])} />
      <JsonLd data={webApplicationJsonLd({ name: 'จำลองบิลด์ Ragnarok Zero', path: '/tools/build', description: DESCRIPTION })} />
      <header className="bhero">
        <div className="bhero__text">
          <p className="bhero__kicker mono">▶ BUILD SIMULATOR</p>
          <h1 className="bhero__title">จำลองบิลด์ <span>คำนวณสเตตัส Ragnarok Zero</span></h1>
          <p className="bhero__lead">อัปสเตตัส ใส่ของ ตีบวก การ์ด อาหาร แล้วดูค่าจริงก่อนลงแต้ม</p>
        </div>
        <div className="bhero__parade" aria-hidden="true">
          {PARADE.map((c) => <img key={c} src={`/images/jobs/${c}.png`} alt="" width={72} height={72} />)}
        </div>
      </header>
      <BuildSimulator />

      <article className="bguide">
        <section className="card">
          <h2>วิธีใช้</h2>
          <ol>
            <li><b>ตัวละคร</b> เลือกอาชีพ ใส่ Base Lv กับ Job Lv แล้วกด +/− อัปสเตตัส ตัวเลข POINTS LEFT บอกแต้มที่เหลือตามกติกาแต้มของเกม (เริ่ม 48 แต้ม ได้เพิ่มทุกเลเวล และสเตตัสยิ่งสูงยิ่งใช้แต้มต่อขั้นมาก)</li>
            <li><b>ของที่ใส่</b> แตะช่องในหน้าต่างใส่ของเพื่อเลือกของ แล้วแตะของชิ้นนั้นอีกครั้งเพื่อตีบวก ใส่การ์ด เอนชานต์ Essence และออปชั่น แท็บคอสตูมใช้ใส่หินคอสตูม ส่วนอาหารกับยาอยู่กล่องถัดไป</li>
            <li><b>เทียบกับมอน</b> พิมพ์ชื่อมอนในช่อง TARGET จะบอกว่าตีโดนกี่ % หลบได้กี่ % ดาเมจตีธรรมดาเท่าไหร่ และถ้ายังไม่ถึงต้องอัป DEX หรือ AGI อีกกี่แต้ม</li>
          </ol>
          <p className="muted">บิลด์ถูกจำไว้ในเครื่องนี้ และหน้ามอนแต่ละตัวจะบอก % ตีโดน/หลบของบิลด์นี้ให้เอง · กดแชร์ได้เป็นลิงก์สั้นพร้อมรูปการ์ดบิลด์</p>
        </section>

        <section className="card">
          <h2>สูตรที่ใช้คำนวณ</h2>
          <p className="muted">สูตรส่วนใหญ่มาจาก roz.prontera.info ซึ่งระบุไว้เองว่าวัดในเกม Ragnarok Zero Global แล้ว (✔) ที่ยังเป็นสูตร Renewal ที่ไม่มีใครวัดใน Global จะติดป้าย &ldquo;ประมาณ&rdquo; ในหน้าต่างสเตตัส</p>
          <dl className="bguide__formulas">
            <div><dt>HIT ✔</dt><dd>175 + Base Lv + DEX + LUK÷3 (ปัดลง)</dd></div>
            <div><dt>FLEE ✔</dt><dd>100 + Base Lv + AGI + LUK÷5 (ปัดลง)</dd></div>
            <div><dt>CRI ✔</dt><dd>1 + LUK×0.3 + Base Lv÷100</dd></div>
            <div><dt>Perfect Dodge ✔</dt><dd>1 + LUK÷10 (ปัดลง)</dd></div>
            <div><dt>ATK จากสเตตัส ✔</dt><dd>ตีใกล้ STR + DEX÷5 + LUK÷3 + Lv÷4 · ตีไกล (ธนู เครื่องดนตรี แส้) สลับ STR กับ DEX</dd></div>
            <div><dt>MATK จากสเตตัส ✔</dt><dd>INT + INT÷2 + DEX÷5 + LUK÷3 + Lv÷4</dd></div>
            <div><dt>ตีโดน / หลบ</dt><dd>ตีโดน 100% เมื่อ HIT ถึงค่าเป้าของมอน ขาดทุก 1 แต้มลด 1% (ต่ำสุด 5%) · หลบสูงสุด 95% · ค่าเป้าของมอนจาก midgardhub</dd></div>
            <div><dt>ASPD (ประมาณ)</dt><dd>ค่าฐานตามอาชีพและอาวุธ − โทษโล่ + √(AGI²÷2 + DEX²÷5)÷4 · ตีไกลหาร DEX² ด้วย 7 · เพดาน 190</dd></div>
            <div><dt>ร่ายแปรผัน (ประมาณ)</dt><dd>เหลือ 1 − √((2×DEX + INT)÷530) ของเวลาร่ายเดิม แล้วหักด้วย % จากของ</dd></div>
            <div><dt>HP / SP (ประมาณ)</dt><dd>ค่าฐานตามเลเวล × (1 + VIT÷100 หรือ INT÷100) + ค่าจากของ · ค่าฐานวัดจริงแค่ Acolyte กับ Thief อาชีพอื่นอาจสูงเกินจริง 20-25%</dd></div>
            <div><dt>ดาเมจตีธรรมดา (ประมาณ)</dt><dd>ATK อาวุธคูณขนาดและธาตุ + ATK จากสเตตัส×2 ลดด้วย DEF มอน แล้วคูณ % ตีเผ่า/ธาตุ/ขนาด · ไม่รวมช่วงสุ่มดาเมจและสกิล</dd></div>
            <div><dt>ตีบวก</dt><dd>ATK/DEF ที่เพิ่มตามตารางตีบวกทางการ (หน้าตีบวกของเว็บนี้)</dd></div>
          </dl>
        </section>

        <section className="card">
          <h2>คำถามที่เจอบ่อย</h2>
          <h3>อาชีพไหนถืออาวุธสองมือได้ ดาเมจแต่ละมือเท่าไหร่</h3>
          <p>Assassin ถือมีด ดาบมือเดียว หรือขวานมือเดียวไว้มือซ้ายได้ ตอนถือสองอาวุธ มือขวาเหลือ 50% เพิ่ม 10% ต่อเลเวล Righthand Mastery และมือซ้ายเหลือ 30% เพิ่ม 10% ต่อเลเวล Lefthand Mastery (ตามข้อความสกิลในเกม) ใส่เลเวลสองสกิลนี้ได้ในส่วนตัวละคร</p>
          <h3>การ์ดในอาวุธมือซ้ายนับไหม</h3>
          <p>เครื่องมือนี้นับการ์ดทั้งสองมือให้ทุกการตี ตามพฤติกรรมเซิร์ฟเวอร์ทางการที่ rAthena อ้างไว้ ยังไม่มีใครวัดใน Global</p>
          <h3>กินอาหารเพิ่ม DEX สองอย่างพร้อมกันได้ไหม</h3>
          <p>อาหารที่เพิ่มสเตตัสเดียวกันไม่ทับกันในเกม เครื่องมือนี้เลยนับแค่อันที่เพิ่มมากที่สุด และขึ้นเตือนให้</p>
          <h3>&ldquo;ผลที่ยังไม่นับ&rdquo; คืออะไร</h3>
          <p>ผลของไอเทมที่เกิดแค่บางครั้ง (มีโอกาสติดตอนตี/โดนตี ใช้สกิล) ช่วงอีเวนต์ เงื่อนไขที่ยังไม่ถึง (ตีบวกไม่ถึง เซ็ตไม่ครบ) หรือเงื่อนไขที่ข้อมูลบอกไว้แค่เป็นข้อความ จะไม่ถูกบวกเข้าตัวเลขเงียบๆ แต่แยกไว้ให้ดูพร้อมเหตุผล ผลที่ขึ้นกับเลเวลสกิลจะนับเมื่อใส่เลเวลสกิลนั้น</p>
          <h3>ทำไมตัวเลขไม่ตรงกับหน้าต่างสเตตัสในเกม</h3>
          <p>บัฟและสกิลติดตัวยังไม่ได้นับ (เช่น Blessing, Increase Agility, สกิล Mastery ที่เพิ่ม ATK) และค่าที่ติด &ldquo;ประมาณ&rdquo; อาจคลาด ถ้าเจอค่าที่วัดในเกมไม่ตรง บอกเราได้ทาง GitHub ในท้ายหน้า</p>
          <h3>หินเอนชานต์ใส่ของชิ้นไหนได้บ้าง</h3>
          <p>ข้อมูลที่มียังไม่บอกว่าของชิ้นไหนเอนชานต์ได้ เครื่องมือนี้เลยเปิดให้ใส่ได้ทุกชิ้น ชิ้นละไม่เกิน 3 ก้อน ส่วน Essence ใส่ที่เสื้อ ส่วนหินคอสตูมจะขึ้นให้เลือกเฉพาะหินของช่องคอสตูมนั้น</p>
        </section>
      </article>

      <p className="bhero__credit">
        สูตรและข้อมูลไอเทม: <a href="https://roz.prontera.info/builds/new" rel="noopener" target="_blank">roz.prontera.info</a> · HIT/FLEE มอน: midgardhub
      </p>
    </main>
  );
}
