// "อยากเล่นแบบไหน" on the class guide index (14 Oct 2026): the 2nd-job builds
// sorted under what a player wants to do, read off each build's own name and
// "pick this if" line. Nothing here is a new claim -- a build lands under a
// goal only when its guide already says so in those words, and a build the
// guide marks as missing is left out, since its page has nothing to show.

import type { ClassGuide } from '@/lib/class-guides/types';

export interface GoalBuild {
  slug: string;
  job: string;
  buildId: string;
  build: string;
  pickIf: string;
  main: boolean;
}

export interface Goal {
  id: string;
  title: string;
  builds: GoalBuild[];
}

export const GOALS: { id: string; title: string; match: RegExp }[] = [
  { id: 'bot', title: 'เปิดบอทเก็บเลเวล', match: /บอท/ },
  { id: 'money', title: 'หาเงิน หาของ', match: /หาเงิน|ขายขยะ|หาแร่|ขโมยของ|ฟาร์มการ์ด|ของมีออปชั่น/ },
  { id: 'dungeon', title: 'ลงดัน ตีบอส', match: /Memorial|ดัน|บอส/ },
  { id: 'party', title: 'เล่นกับปาร์ตี้ คอยบัฟ', match: /ปาร์ตี้|ซัพพอร์ต|ตัวบัฟ|ไอดีสอง|พาตัว/ },
  { id: 'hands', title: 'เล่นมือ ลากมอนตีหมู่', match: /เล่นมือ|ลากมอน|ตีหมู่|เป็นกลุ่ม/ },
  { id: 'pvp', title: 'PK และ WoE', match: /PK|WoE|War of Emperium/ },
];

export function classGoals(guides: ClassGuide[]): Goal[] {
  const seconds = guides.filter((g) => g.path.length > 1);
  return GOALS.map(({ id, title, match }) => ({
    id,
    title,
    builds: seconds
      .flatMap((g) =>
        g.builds
          .filter((b) => !b.missing && match.test(`${b.name} ${b.pickIf}`))
          .map((b) => ({ slug: g.slug, job: g.job, buildId: b.id, build: b.name, pickIf: b.pickIf, main: b.tag === 'สายหลัก' })),
      )
      // A job's main build first, then the order the guides list them in.
      .sort((a, b) => Number(b.main) - Number(a.main)),
  })).filter((goal) => goal.builds.length > 0);
}
