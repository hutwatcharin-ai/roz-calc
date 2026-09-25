// /llms.txt -- the llmstxt.org convention: a short plain-text map of the site
// for answer engines. Google ignores it; Perplexity/ChatGPT-style crawlers
// read it. Built from the nav tables so it cannot list a page that does not
// exist (lib/nav-links.test.ts checks those against the filesystem).
import { PRIMARY_LINKS, SECTION_LINKS } from '@/lib/nav-links';
import { SITE_URL } from '@/lib/site';

export const dynamic = 'force-static';

export function GET() {
  const section = (title: string, links: { href: string; label: string; ready: boolean }[]) =>
    [`## ${title}`, ...links.filter((l) => l.ready).map((l) => `- [${l.label}](${SITE_URL}${l.href})`)].join('\n');

  const body = [
    '# RO Zero Thai',
    '',
    '> ฐานข้อมูลและเครื่องมือ Ragnarok Zero Global ภาษาไทย: มอนสเตอร์ ไอเทม อุปกรณ์ การ์ด สกิล แมพ เควส NPC และไกด์ ตัวเลขทุกค่าอ้างอิงไฟล์เกมหรือฐานข้อมูลสาธารณะ และหน้าเว็บบอกที่มาของทุกค่า ค่าที่ไม่รู้แสดงเป็น "ไม่ทราบ" ไม่เดา',
    '',
    section('หน้าหลัก', PRIMARY_LINKS),
    '',
    section('ฐานข้อมูล', SECTION_LINKS.database),
    '',
    section('เครื่องมือ', SECTION_LINKS.tools),
    '',
    section('ไกด์', SECTION_LINKS.guides),
    '',
    '## Optional',
    `- [sitemap](${SITE_URL}/sitemap.xml)`,
    `- [เกี่ยวกับเว็บ](${SITE_URL}/about)`,
    '',
  ].join('\n');

  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
