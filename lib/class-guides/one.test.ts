// Checks one guide file before it is registered in index.ts:
//   GUIDE=knight npx vitest run lib/class-guides/one.test.ts
import { it } from 'vitest';
import { checkGuide } from './check-guide';

it.skipIf(!process.env.GUIDE)('guide file is internally consistent', async () => {
  const mod = await import(`./${process.env.GUIDE}.ts`);
  const guide = Object.values(mod).find((v: any) => v && typeof v === 'object' && 'builds' in v);
  if (!guide) throw new Error(`no ClassGuide export in ${process.env.GUIDE}.ts`);
  checkGuide(guide as any);
});
