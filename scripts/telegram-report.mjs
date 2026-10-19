// rozerothai.com's own Telegram bot (@rozerothaibot, 19 Oct 2026): what the
// owner used to go and look up by hand, sent to them instead.
//
//   node scripts/telegram-report.mjs daily    yesterday: visitors against the
//                                              same weekday a week before, top
//                                              pages, searches that found nothing
//   node scripts/telegram-report.mjs weekly   Search Console: last 7 days against
//                                              the 7 before, queries that moved
//   node scripts/telegram-report.mjs uptime   (by hand; the 15-minute schedule was
//                                              dropped 19 Oct 2026) the home page and the farm data
//                                              answer 200; a message only if not
//   add --dry to print instead of sending
//
// Runs on GitHub Actions (.github/workflows/telegram-report.yml). Needs
// TELEGRAM_BOT_TOKEN and GA4_SERVICE_ACCOUNT_JSON (the service-account key,
// base64, the one with Viewer on GA4 and a user on Search Console);
// TELEGRAM_CHAT_ID defaults to the owner's chat. No dependencies: the
// service-account token is signed with node:crypto.

import { createSign } from 'node:crypto';

const MODE = process.argv[2];
const DRY = process.argv.includes('--dry');
const SITE = 'https://rozerothai.com';
const PROPERTY = 'properties/552516626';
const GSC_SITE = 'sc-domain:rozerothai.com';
const CHAT = process.env.TELEGRAM_CHAT_ID || '6242848323';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const fmt = (n) => Math.round(Number(n)).toLocaleString('en-US');
function delta(now, before) {
  if (!before) return '';
  const pct = ((now - before) / before) * 100;
  return ` (${pct >= 0 ? '+' : ''}${pct.toFixed(0)}%)`;
}

async function send(text) {
  if (DRY || !process.env.TELEGRAM_BOT_TOKEN) {
    console.log(text);
    return;
  }
  const res = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ chat_id: CHAT, text, parse_mode: 'HTML', disable_web_page_preview: true }),
  });
  const body = await res.json();
  if (!body.ok) throw new Error(`Telegram: ${body.description}`);
}

async function accessToken(scope) {
  const key = JSON.parse(Buffer.from(process.env.GA4_SERVICE_ACCOUNT_JSON ?? '', 'base64').toString('utf8'));
  const now = Math.floor(Date.now() / 1000);
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
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

async function daily() {
  const token = await accessToken('https://www.googleapis.com/auth/analytics.readonly');
  const totals = await ga4(token, {
    dateRanges: [
      { startDate: 'yesterday', endDate: 'yesterday', name: 'now' },
      { startDate: '8daysAgo', endDate: '8daysAgo', name: 'before' },
    ],
    metrics: [{ name: 'activeUsers' }, { name: 'sessions' }, { name: 'screenPageViews' }],
  });
  // With two date ranges each row carries the range name as its last dimension.
  const pick = (name) => totals.find((r) => r.dims.at(-1) === name)?.mets ?? [0, 0, 0];
  const [users, sessions, views] = pick('now');
  const [usersB, sessionsB, viewsB] = pick('before');

  const pages = await ga4(token, {
    dateRanges: [{ startDate: 'yesterday', endDate: 'yesterday' }],
    dimensions: [{ name: 'pagePath' }],
    metrics: [{ name: 'screenPageViews' }],
    orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
    limit: 5,
  });

  // Searches that found nothing: what players look for and the site lacks.
  // result_count is only queryable once registered as a custom dimension;
  // until then the section says so instead of going quiet.
  let empty = null;
  try {
    empty = await ga4(token, {
      dateRanges: [{ startDate: 'yesterday', endDate: 'yesterday' }],
      dimensions: [{ name: 'customEvent:search_term' }],
      metrics: [{ name: 'eventCount' }],
      dimensionFilter: {
        andGroup: {
          expressions: [
            { filter: { fieldName: 'eventName', stringFilter: { value: 'search' } } },
            { filter: { fieldName: 'customEvent:result_count', stringFilter: { value: '0' } } },
          ],
        },
      },
      orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
      limit: 8,
    });
  } catch {
    empty = null;
  }
  // Until then, the commonest searches at least say what players look for.
  let common = [];
  if (empty === null) {
    try {
      common = await ga4(token, {
        dateRanges: [{ startDate: 'yesterday', endDate: 'yesterday' }],
        dimensions: [{ name: 'customEvent:search_term' }],
        metrics: [{ name: 'eventCount' }],
        dimensionFilter: { filter: { fieldName: 'eventName', stringFilter: { value: 'search' } } },
        orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
        limit: 8,
      });
    } catch {
      common = [];
    }
  }

  const day = new Date(Date.now() + 7 * 3600e3 - 86400e3).toISOString().slice(0, 10);
  const lines = [
    `📊 <b>rozerothai.com</b> · ${day}`,
    `คนเข้า <b>${fmt(users)}</b>${delta(users, usersB)} · เซสชัน ${fmt(sessions)}${delta(sessions, sessionsB)} · เปิดหน้า ${fmt(views)}${delta(views, viewsB)}`,
    `<i>เทียบกับวันเดียวกันสัปดาห์ก่อน</i>`,
    '',
    '<b>หน้าที่คนเข้าเยอะสุด</b>',
    ...pages.map((r, i) => `${i + 1}. ${esc(r.dims[0])} — ${fmt(r.mets[0])}`),
    '',
    ...(empty === null
      ? ['<b>คำที่ค้นในเว็บเยอะสุด</b>', ...(common.length ? common.map((r) => `• ${esc(r.dims[0])} ×${fmt(r.mets[0])}`) : ['ไม่มี'])]
      : ['<b>ค้นแล้วไม่เจอ</b>', ...(empty.length ? empty.map((r) => `• ${esc(r.dims[0])} ×${fmt(r.mets[0])}`) : ['ไม่มี'])]),
  ];
  await send(lines.join('\n'));
}

async function gsc(token, start, end, dims, limit) {
  const res = await fetch(`https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(GSC_SITE)}/searchAnalytics/query`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ startDate: start, endDate: end, dimensions: dims, rowLimit: limit }),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error.message);
  return json.rows ?? [];
}

async function weekly() {
  const token = await accessToken('https://www.googleapis.com/auth/webmasters.readonly');
  // Search Console lags two to three days: compare the 7 days ending 3 days ago.
  const d = (n) => new Date(Date.now() - n * 86400e3).toISOString().slice(0, 10);
  const [nowStart, nowEnd, prevStart, prevEnd] = [d(9), d(3), d(16), d(10)];
  const [total] = await gsc(token, nowStart, nowEnd, [], 1);
  const [totalB] = await gsc(token, prevStart, prevEnd, [], 1);
  const now = await gsc(token, nowStart, nowEnd, ['query'], 500);
  const before = new Map((await gsc(token, prevStart, prevEnd, ['query'], 500)).map((r) => [r.keys[0], r]));

  const top = now.slice().sort((a, b) => b.clicks - a.clicks).slice(0, 8);
  const moved = now
    .filter((r) => r.impressions >= 10 && before.has(r.keys[0]))
    .map((r) => ({ q: r.keys[0], pos: r.position, from: before.get(r.keys[0]).position }))
    .filter((r) => Math.abs(r.from - r.pos) >= 2)
    .sort((a, b) => b.from - b.pos - (a.from - a.pos));
  const up = moved.filter((r) => r.pos < r.from).slice(0, 5);
  const down = moved.filter((r) => r.pos > r.from).reverse().slice(0, 5);

  const lines = [
    `🔎 <b>Google Search</b> · ${nowStart} ถึง ${nowEnd}`,
    `คลิก <b>${fmt(total?.clicks ?? 0)}</b>${delta(total?.clicks ?? 0, totalB?.clicks)} · เห็นในผลค้น ${fmt(total?.impressions ?? 0)}${delta(total?.impressions ?? 0, totalB?.impressions)} · อันดับเฉลี่ย ${(total?.position ?? 0).toFixed(1)}`,
    `<i>เทียบกับ 7 วันก่อนหน้า (Search Console ช้า 2-3 วัน)</i>`,
    '',
    '<b>คำค้นที่ได้คลิกเยอะสุด</b>',
    ...top.map((r) => `• ${esc(r.keys[0])} — ${fmt(r.clicks)} คลิก · อันดับ ${r.position.toFixed(1)}`),
    '',
    '<b>ขึ้นอันดับ</b>',
    ...(up.length ? up.map((r) => `▲ ${esc(r.q)} ${r.from.toFixed(1)} → ${r.pos.toFixed(1)}`) : ['ไม่มี']),
    '<b>ตกอันดับ</b>',
    ...(down.length ? down.map((r) => `▼ ${esc(r.q)} ${r.from.toFixed(1)} → ${r.pos.toFixed(1)}`) : ['ไม่มี']),
  ];
  await send(lines.join('\n'));
}

async function check(path) {
  try {
    const res = await fetch(SITE + path, { signal: AbortSignal.timeout(20000), headers: { 'user-agent': 'rozerothai-uptime' } });
    return res.status;
  } catch (e) {
    return e.name === 'TimeoutError' ? 'timeout' : 'error';
  }
}

async function uptime() {
  const paths = ['/', '/tools/leveling-spots/farm-data'];
  // Twice, a minute apart: one slow answer is not an outage worth a message.
  let bad = [];
  for (let attempt = 0; attempt < 2; attempt++) {
    bad = [];
    for (const path of paths) {
      const status = await check(path);
      if (status !== 200) bad.push(`${path} → ${status}`);
    }
    if (bad.length === 0) {
      console.log('all 200');
      return;
    }
    if (attempt === 0) await new Promise((r) => setTimeout(r, 60000));
  }
  await send([`🚨 <b>rozerothai.com ตอบไม่ปกติ</b>`, ...bad.map(esc), '', 'เช็ก Coolify'].join('\n'));
}

const run = { daily, weekly, uptime }[MODE];
if (!run) throw new Error('usage: telegram-report.mjs daily|weekly|uptime [--dry]');
await run();
