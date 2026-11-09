# Bot and AI-crawler protection (2026-11-09)

Agreed with the owner in a grilling session. Goal: block AI *training* crawlers,
keep search and AI-answer crawlers (they send visitors), make bulk scraping
slower and detectable, prove copies after the fact, stop form spam, and close
the direct-to-origin hole. Hard rule from the owner: real visitors must not
notice any of it.

A public reference site cannot be made scrape-proof: every page must stay
readable by Googlebot, and a slow scraper with a Chrome user agent looks like
a person. "Complete" here means expensive to scrape, caught when it happens,
and provable afterwards -- not a JS challenge in front of every page.

Cloudflare plan: Free (one rate-limit rule, 10 s window; no path exceptions for
Bot Fight Mode, so Bot Fight Mode stays OFF -- it would challenge the Telegram
webhook).

## Steps (each ships behind a preview; live only on the owner's "ขึ้น")

1. **Origin lock.** A Cloudflare Transform Rule adds `x-origin-key: <secret>` to
   every request. `middleware.ts` (via `lib/origin-guard.ts`) checks it on the
   apex host. `ORIGIN_GUARD=log` (default once `ORIGIN_KEY` is set) only logs
   requests without the key; after a clean day switch to `ORIGIN_GUARD=enforce`
   (403). localhost / 127.* / tailnet skip the check (Coolify healthcheck, local
   prod tests, phone preview). `scripts/deploy.mjs` sends the key on its
   direct-origin checks. Rate limiters trust `cf-connecting-ip` only on keyed
   requests.
2. **robots.txt + Cloudflare AI Crawl Control**, per crawler (not the blanket
   "Block AI bots" switch). Managed robots.txt OFF.
   - Block: GPTBot, ClaudeBot, CCBot, Google-Extended, Applebot-Extended,
     Bytespider, meta-externalagent, Amazonbot, cohere-ai, Diffbot, omgili,
     Timpibot, PetalBot.
   - Allow: Googlebot, Bingbot, OAI-SearchBot, ChatGPT-User, Claude-SearchBot,
     Claude-User, PerplexityBot, Perplexity-User, DuckDuckBot.
   - Must never be blocked (link previews): facebookexternalhit, Discordbot,
     TelegramBot, LINE, Twitterbot.
3. **WAF rule on scraper user agents** (python-requests, curl, scrapy,
   Go-http-client, HeadlessChrome, ...): managed challenge, skipping
   `cf.client.bot` and `/api/telegram`. Our own tools send `rozerothai-*` user
   agents (keep-alive.yml, deploy.mjs) so no exception string is needed.
4. **Rate limit** `/api/search` + `/api/monster`: 60 requests / 10 s / IP, block
   10 s (block, not challenge: fetch() cannot solve one). Search box shows
   "ค้นหาถี่ไป รอสักครู่" on 429. Watch Security Events the first week for Thai
   mobile CGNAT addresses.
5. **Honeypot.** A robots-Disallowed path linked from a hidden plain `<a>`
   (never Next `<Link>` -- prefetch would trap real visitors), `aria-hidden`,
   `tabindex=-1`, `rel=nofollow`. A hit adds the IP to a Cloudflare IP list;
   listed IPs get a Managed Challenge (never a block: shared mobile IPs), and
   entries expire after 24 h. Verified bots are exempt. Daily 14:00 Telegram
   report gains a "honeypot caught N IPs" line.
6. **Canary watermark.** Zero-width characters encoding the page id, inserted
   at render time only into long Thai translation paragraphs. Never in names,
   numbers, `/navi` commands, anything with a copy button, title/meta/JSON-LD.
   No fake items or monsters (breaks the "never invent values" rule).
   `scripts/check-copy.mjs <url>` decodes a suspect page. The unique Thai
   translations plus git history are the fallback evidence.
7. **Turnstile** (invisible) on the feedback button and `/suggest`, script
   loaded only when the form opens. Missing token: reject with a retry message.
   siteverify down/timeout: accept and tag the row `unverified`. Not on
   `/api/build-link` (share must be instant; its per-IP limit stays).

All Cloudflare configuration lives in `scripts/cloudflare-bots.mjs`
(`--dry-run` first). Secrets only in `.env.local` and Coolify env.

## Owner setup

- Cloudflare API token, zone rozerothai.com: Zone > WAF Edit, Zone > Zone
  Settings Edit, Zone > Transform Rules Edit, Account > Account Filter Lists
  Edit. Env `CLOUDFLARE_BOTS_TOKEN`.
- Turnstile widget (invisible): `NEXT_PUBLIC_TURNSTILE_SITE_KEY`,
  `TURNSTILE_SECRET_KEY`.
- `ORIGIN_KEY` (random 32+ chars) in `.env.local` and Coolify; `ORIGIN_GUARD`
  in Coolify.

## Risks to watch

- Shared Thai mobile IPs hitting the rate limit (Security Events, week one).
- The enforce switch of step 1: if the Transform Rule is missing, the whole
  site 403s. The log phase exists to catch that.
- LINE / Facebook link previews: share one real link after each step.
- Slow Chrome-disguised scraping is not stopped; step 6 is the answer to it.
