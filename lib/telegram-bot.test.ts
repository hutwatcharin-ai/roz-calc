import { describe, expect, it, vi } from 'vitest';
import { parseCommand, reply, type BotDeps, type InboxPost } from './telegram-bot';

const POSTS: InboxPost[] = [
  { id: '1', title: 'Old notice', kind: 'official', urgent: false, at: '2026-10-20', done: true },
  { id: '2', title: 'Maintenance 22 Oct', kind: 'official', urgent: true, at: '2026-10-21T03:00:00.000Z', done: false },
  { id: '3', title: 'Player says <drop>', kind: 'player', urgent: false, at: '2026-10-21T05:00:00.000Z', done: false },
];

function deps(over: Partial<BotDeps> = {}): BotDeps {
  return {
    now: Date.parse('2026-10-22T12:00:00+07:00'),
    inbox: async () => POSTS.map((p) => ({ ...p })),
    dispatch: async () => {},
    visitors: async () => ({ live: 3, today: { users: 120, views: 400 }, yesterday: { users: 900, views: 3000 } }),
    searchWeek: async () => ({ start: 'a', end: 'b', clicks: 50, impressions: 900, position: 12.3, prevClicks: 40, top: [] }),
    status: async () => [{ path: '/', status: 200 }],
    find: async () => [],
    ...over,
  };
}

describe('parseCommand', () => {
  it('reads the command, the bot-name suffix and the argument', () => {
    expect(parseCommand('/find@rozerothaibot  poring card ')).toEqual({ cmd: 'find', arg: 'poring card' });
    expect(parseCommand('/NEWS')).toEqual({ cmd: 'news', arg: '' });
    expect(parseCommand('hello')).toBeNull();
  });
});

describe('reply', () => {
  it('/inbox lists only posts not done, urgent counted, titles escaped, player posts marked', async () => {
    const out = await reply('/inbox', deps());
    expect(out).toContain('ค้าง 2 อัน');
    expect(out).toContain('ด่วน 1');
    expect(out).not.toContain('Old notice');
    expect(out).toContain('Player says &lt;drop&gt;');
    expect(out).toContain('ผู้เล่นส่งต่อ');
    expect(out).toContain('https://discord.com/channels/1562409530212614216/1562420024122277888/3');
  });

  it('/news shows official posts newest first, done ones ticked', async () => {
    const out = await reply('/news', deps());
    expect(out.indexOf('Maintenance')).toBeLessThan(out.indexOf('Old notice'));
    expect(out).not.toContain('Player says');
    expect(out).toMatch(/Old notice<\/a> · 20 ต.ค\. ✅/);
  });

  it('/check starts the workflow', async () => {
    const dispatch = vi.fn(async () => {});
    expect(await reply('/check', deps({ dispatch }))).toContain('สั่งดึงข่าว');
    expect(dispatch).toHaveBeenCalledOnce();
  });

  it('/up names the path that failed', async () => {
    const out = await reply('/up', deps({ status: async () => [{ path: '/', status: 200 }, { path: '/x', status: 502 }] }));
    expect(out).toContain('/x → 502');
  });

  it('/events lists only events still running', async () => {
    const out = await reply('/events', deps());
    expect(out).toContain('Guild Hall of Fame');
    expect(out).toMatch(/เหลือ \d+ วัน/);
  });

  it('a failing source becomes a message, not a silent bot', async () => {
    const out = await reply('/today', deps({ visitors: async () => { throw new Error('quota'); } }));
    expect(out).toContain('/today ไม่สำเร็จ: quota');
  });

  it('/find without a name asks for one; unknown commands get the help', async () => {
    expect(await reply('/find', deps())).toContain('/find poring');
    expect(await reply('/nope', deps())).toContain('/news');
  });
});
