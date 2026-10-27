// The weekly banner report an advertiser gets by email (owner, 27 Oct 2026).
// Every Friday 09:00 Thailand, and once more the day after a booking ends with
// the whole run, it reads the ad's GA4 counts, writes a short Thai report and
// mails it from the site address with the same report attached as a PDF.
//
//   node scripts/ad-mail-report.mjs            send what is due today (nothing on other days)
//   node scripts/ad-mail-report.mjs --now      send now whatever the day (a test)
//   add --dry to write report.html/report.pdf instead of sending
//
// Runs on GitHub Actions (.github/workflows/ad-mail-report.yml). Needs
// GA4_SERVICE_ACCOUNT_JSON (base64 key, as in telegram-report.mjs),
// GMAIL_APP_PASSWORD (App Password of the sender account) and AD_REPORT_TO
// (the advertiser's address -- a secret because the repo is public). Every
// mail is BCC'd to the sender account so the owner sees what went out. If GA4
// cannot be read, the owner hears it on Telegram and the advertiser gets
// nothing rather than an empty report.
//
// Only ads with "report": true in data/ads.json are reported. One recipient
// for now; a second advertiser will need its own address.

import { createSign } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';

const DRY = process.argv.includes('--dry');
const NOW = process.argv.includes('--now');
const PROPERTY = 'properties/552516626';
const FROM = process.env.GMAIL_USER || 'rozthai.contact@gmail.com';
const CHAT = process.env.TELEGRAM_CHAT_ID || '6242848323';
const DAY = 86400000;

const fmt = (n) => Math.round(Number(n)).toLocaleString('en-US');
const iso = (d) => d.toISOString().slice(0, 10);
const TH_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const TH_DAYS = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
const thDate = (d) => `${d.getUTCDate()} ${TH_MONTHS[d.getUTCMonth()]}`;
const thYear = (d) => d.getUTCFullYear() + 543;

// Today in Thailand, as a UTC-midnight date so day sums stay exact.
const today = new Date(iso(new Date(Date.now() + 7 * 3600000)) + 'T00:00:00Z');

async function telegram(text) {
  if (DRY || !process.env.TELEGRAM_BOT_TOKEN) return console.log(text);
  await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ chat_id: CHAT, text, disable_web_page_preview: true }),
  });
}

async function accessToken() {
  const key = JSON.parse(Buffer.from(process.env.GA4_SERVICE_ACCOUNT_JSON ?? '', 'base64').toString('utf8'));
  const now = Math.floor(Date.now() / 1000);
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const scope = 'https://www.googleapis.com/auth/analytics.readonly';
  const unsigned = `${b64({ alg: 'RS256', typ: 'JWT' })}.${b64({ iss: key.client_email, scope, aud: key.token_uri, iat: now, exp: now + 3600 })}`;
  const sig = createSign('RSA-SHA256').update(unsigned).sign(key.private_key, 'base64url');
  const res = await fetch(key.token_uri, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${unsigned}.${sig}` }),
  });
  const body = await res.json();
  if (!body.access_token) throw new Error(`token: ${JSON.stringify(body)}`);
  return body.access_token;
}

async function ga4(token, body) {
  const res = await fetch(`https://analyticsdata.googleapis.com/v1beta/${PROPERTY}:runReport`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error.message);
  return (json.rows ?? []).map((r) => ({
    dims: (r.dimensionValues ?? []).map((d) => d.value),
    mets: (r.metricValues ?? []).map((m) => Number(m.value)),
  }));
}

// Event count and distinct users for one of the ad's events, split by dims.
function adEvent(token, adId, event, start, end, dims = []) {
  return ga4(token, {
    dateRanges: [{ startDate: iso(start), endDate: iso(end) }],
    dimensions: dims.map((name) => ({ name })),
    metrics: [{ name: 'eventCount' }, { name: 'totalUsers' }],
    dimensionFilter: {
      andGroup: {
        expressions: [
          { filter: { fieldName: 'eventName', stringFilter: { value: event } } },
          { filter: { fieldName: 'customEvent:ad_id', stringFilter: { value: adId } } },
        ],
      },
    },
  });
}

async function numbers(token, adId, start, end) {
  const [imp, clicks, days, devices] = await Promise.all([
    adEvent(token, adId, 'banner_impression', start, end),
    adEvent(token, adId, 'banner_click', start, end),
    adEvent(token, adId, 'banner_impression', start, end, ['date']),
    adEvent(token, adId, 'banner_impression', start, end, ['deviceCategory']),
  ]);
  const [views, people] = imp[0]?.mets ?? [0, 0];
  const deviceViews = Object.fromEntries(devices.map((r) => [r.dims[0], r.mets[0]]));
  return {
    views,
    people,
    clicks: clicks[0]?.mets[0] ?? 0,
    days: Object.fromEntries(days.map((r) => [r.dims[0], r.mets[1]])),
    desktopShare: views ? Math.round(((deviceViews.desktop ?? 0) / views) * 100) : 0,
  };
}

// What is due today: the weekly report on Fridays while the ad runs, and the
// whole-run summary the day after it ends. --now forces a weekly one.
function due(ad) {
  const starts = new Date(ad.starts + 'T00:00:00Z');
  const ends = new Date(ad.ends + 'T00:00:00Z');
  const yesterday = new Date(today - DAY);
  if (+today === +ends + DAY) return { final: true, start: starts, end: ends, starts, ends };
  if (today <= starts || today > ends) return null;
  if (!NOW && today.getUTCDay() !== 5) return null;
  const start = new Date(Math.max(+starts, +today - 7 * DAY));
  return { final: false, start, end: yesterday, starts, ends };
}

function html(ad, when, n) {
  const totalDays = Math.round((when.ends - when.starts) / DAY) + 1;
  const done = Math.min(totalDays, Math.round((when.end - when.starts) / DAY) + 1);
  const week = Math.ceil(done / 7);
  const left = totalDays - done;
  const title = when.final ? 'สรุปทั้งแคมเปญ' : `สัปดาห์ที่ ${week}`;
  const each = n.people ? (n.views / n.people).toFixed(1) : '0';
  const range = `${thDate(when.start)} – ${thDate(when.end)} ${thYear(when.end)}`;
  const period = when.final ? 'ตลอดแคมเปญ' : 'สัปดาห์นี้';

  const dayRows = [];
  const most = Math.max(1, ...Object.values(n.days));
  for (let d = new Date(when.start); d <= when.end; d = new Date(+d + DAY)) {
    const people = n.days[iso(d).replace(/-/g, '')] ?? 0;
    const label = when.final ? thDate(d) : `${TH_DAYS[d.getUTCDay()]} ${d.getUTCDate()}`;
    dayRows.push(`<tr><td width="90" style="padding:3px 0;color:#b9b3e8">${label}</td><td><div style="background:#39e6ff;height:${when.final ? 8 : 14}px;width:${Math.max(1, Math.round((people / most) * 100))}%;border-radius:3px"></div></td><td width="70" align="right">${fmt(people)} คน</td></tr>`);
  }

  const card = (value, label, color) =>
    `<td width="33%" align="center" style="padding:6px"><div style="background:#0b0820;border:1px solid #39e6ff;border-radius:8px;padding:14px 4px"><div style="font-size:28px;font-weight:bold;color:${color}">${value}</div><div style="font-size:13px;color:#b9b3e8">${label}</div></div></td>`;

  const renewal = !when.final && left <= 10
    ? `<tr><td style="padding:4px 24px 10px;font-size:14px;line-height:1.7;color:#fff">แคมเปญเหลืออีก ${left} วัน หากต้องการต่อ ตอบกลับเมลนี้ได้เลยครับ ต่อ 3 เดือนลด 10% · 6 เดือนลด 20%</td></tr>`
    : '';
  const thanks = when.final
    ? `<tr><td style="padding:4px 24px 10px;font-size:14px;line-height:1.7;color:#fff">ขอบคุณที่ลงโฆษณากับเราครับ หากต้องการลงต่อ ตอบกลับเมลนี้ได้เลย</td></tr>`
    : '';

  return `<!doctype html>
<html lang="th"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@400;700&display=swap" rel="stylesheet">
<title>รายงานแบนเนอร์ ${ad.advertiser}</title></head>
<body style="margin:0;background:#0b0820;font-family:'Noto Sans Thai',Tahoma,sans-serif;color:#e8e6ff">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0b0820"><tr><td align="center" style="padding:24px 12px">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#140f33;border:2px solid #39e6ff;border-radius:10px">
<tr><td style="padding:22px 24px 14px;border-bottom:2px solid #ff3fa4">
  <div style="font-size:12px;color:#39e6ff"><span style="letter-spacing:2px">ROZEROTHAI.COM</span> · รายงานโฆษณา</div>
  <div style="font-size:24px;font-weight:bold;color:#fff;margin-top:6px">แบนเนอร์ ${ad.advertiser} · ${title}</div>
  <div style="font-size:14px;color:#b9b3e8;margin-top:4px">${range} · แบนเนอร์บนสุดทุกหน้า</div>
</td></tr>
<tr><td style="padding:20px 24px 4px;font-size:17px;line-height:1.7;color:#fff">
  ${period}มีผู้เล่น <b style="color:#39e6ff">${fmt(n.people)} คน</b> เห็นแบนเนอร์ของคุณ<br>
  แต่ละคนเห็นซ้ำเฉลี่ย <b style="color:#ffe14d">คนละ ${each} ครั้ง</b><br>
  และกดเข้าเว็บ ${ad.advertiser} <b style="color:#ff3fa4">${fmt(n.clicks)} ครั้ง</b>
</td></tr>
<tr><td style="padding:14px 16px 6px"><table width="100%" cellpadding="0" cellspacing="0"><tr>
  ${card(fmt(n.people), 'คนที่เห็น<br>(ไม่นับซ้ำ)', '#39e6ff')}
  ${card(fmt(n.views), 'ครั้งที่เห็น<br>(รวมเห็นซ้ำ)', '#ffe14d')}
  ${card(fmt(n.clicks), 'คลิก<br>ไปเว็บ ' + ad.advertiser, '#ff3fa4')}
</tr></table></td></tr>
<tr><td style="padding:12px 24px">
  <div style="font-size:15px;font-weight:bold;color:#fff;margin-bottom:8px">คนที่เห็นในแต่ละวัน</div>
  <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px">${dayRows.join('')}</table>
  <div style="font-size:12px;color:#8f89c4;margin-top:6px">คนกลุ่มเดิมกลับมาเกือบทุกวัน ยอดรวมจึงไม่เท่ากับผลบวกของแต่ละวัน</div>
</td></tr>
<tr><td style="padding:10px 24px">
  <div style="font-size:15px;font-weight:bold;color:#fff;margin-bottom:8px">เห็นจากเครื่องไหน</div>
  <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px">
    <tr><td style="padding:4px 0">คอมพิวเตอร์</td><td align="right"><b style="color:#ffe14d">${n.desktopShare}%</b></td></tr>
    <tr><td style="padding:4px 0">มือถือ / แท็บเล็ต</td><td align="right"><b style="color:#ffe14d">${100 - n.desktopShare}%</b></td></tr>
  </table>
  <div style="font-size:12px;color:#8f89c4;margin-top:4px">ผู้เล่นส่วนใหญ่เปิดเว็บบนคอมข้างจอเกม</div>
</td></tr>
<tr><td style="padding:10px 24px"><table width="100%" cellpadding="0" cellspacing="0"><tr><td style="background:#0b0820;border-left:3px solid #ffe14d;padding:12px 14px;font-size:13px;line-height:1.6;color:#b9b3e8">
  <b style="color:#fff">ลงโฆษณา</b> ${thDate(when.starts)} – ${thDate(when.ends)} · ${when.final ? 'ครบ' : 'ผ่านไป'} ${done} จาก ${totalDays} วัน
  <div style="background:#2a2452;height:8px;border-radius:4px;margin-top:6px"><div style="background:#ff3fa4;height:8px;width:${Math.round((done / totalDays) * 100)}%;border-radius:4px"></div></div>
</td></tr></table></td></tr>
${renewal}${thanks}
<tr><td style="padding:10px 24px 18px;font-size:12px;line-height:1.8;color:#8f89c4">
  <b style="color:#b9b3e8">นับยังไง</b><br>
  · นับว่า "เห็น" เมื่อแบนเนอร์อยู่บนจอจริง<br>
  · คนที่ใช้โปรแกรมบล็อกโฆษณาจะไม่ถูกนับ<br>
  · คลิกนับทุกครั้งที่กดแบนเนอร์ไปเว็บ ${ad.advertiser}<br>
  · ตัวเลขจาก Google Analytics
</td></tr>
<tr><td style="padding:14px 24px;border-top:1px solid #2a2452;font-size:12px;color:#8f89c4">
  ส่งอัตโนมัติทุกวันศุกร์ 9 โมง · ติดต่อ ${FROM} · <a href="https://rozerothai.com/advertise" style="color:#39e6ff">rozerothai.com/advertise</a>
</td></tr>
</table></td></tr></table>
</body></html>`;
}

async function pdf(page) {
  const { chromium } = await import('playwright-core');
  const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
  try {
    const tab = await browser.newPage();
    await tab.setContent(page, { waitUntil: 'networkidle' });
    await tab.addStyleTag({ content: '@page{size:A4;margin:0} html,body{-webkit-print-color-adjust:exact;print-color-adjust:exact}' });
    return await tab.pdf({ format: 'A4', printBackground: true, pageRanges: '1' });
  } finally {
    await browser.close();
  }
}

async function main() {
  const ads = JSON.parse(readFileSync(new URL('../data/ads.json', import.meta.url), 'utf8')).ads.filter((a) => a.report);
  const jobs = ads.map((ad) => ({ ad, when: due(ad) })).filter((j) => j.when);
  if (!jobs.length) return console.log('nothing due today');

  let token;
  try {
    token = await accessToken();
  } catch (e) {
    await telegram(`รายงานแบนเนอร์ไม่ได้ส่ง: อ่าน GA4 ไม่ได้ (${e.message})`);
    throw e;
  }

  for (const { ad, when } of jobs) {
    let n;
    try {
      n = await numbers(token, ad.id, when.start, when.end);
    } catch (e) {
      await telegram(`รายงานแบนเนอร์ ${ad.advertiser} ไม่ได้ส่ง: อ่าน GA4 ไม่ได้ (${e.message})`);
      throw e;
    }
    const page = html(ad, when, n);
    const file = await pdf(page);
    const name = `${ad.advertiser}-rozerothai-${iso(when.end)}.pdf`;
    const subject = `รายงานแบนเนอร์ ${ad.advertiser} บน rozerothai.com · ${when.final ? 'สรุปทั้งแคมเปญ' : `${thDate(when.start)} – ${thDate(when.end)}`}`;

    if (DRY) {
      writeFileSync('report.html', page);
      writeFileSync('report.pdf', file);
      console.log(`${subject}\n${fmt(n.people)} people, ${fmt(n.views)} views, ${n.clicks} clicks -> report.html, report.pdf`);
      continue;
    }

    const to = process.env.AD_REPORT_TO;
    if (!to || !process.env.GMAIL_APP_PASSWORD) throw new Error('AD_REPORT_TO and GMAIL_APP_PASSWORD are required to send');
    const { default: nodemailer } = await import('nodemailer');
    const mail = nodemailer.createTransport({ service: 'gmail', auth: { user: FROM, pass: process.env.GMAIL_APP_PASSWORD } });
    await mail.sendMail({
      from: `rozerothai.com <${FROM}>`,
      to,
      bcc: FROM,
      subject,
      html: page,
      attachments: [{ filename: name, content: file, contentType: 'application/pdf' }],
    });
    await telegram(`ส่งรายงานแบนเนอร์ ${ad.advertiser} แล้ว: ${fmt(n.people)} คนเห็น · ${n.clicks} คลิก`);
    console.log(`sent ${subject}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
