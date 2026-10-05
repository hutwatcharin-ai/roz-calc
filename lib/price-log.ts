// Every sell (or buy) price the owner enters through /admin/prices, one JSON line each,
// in .price-log.jsonl at the project root (git-ignored: it is the owner's
// working record, not site data). It is what makes a wrong Enter undoable --
// each line keeps the value it replaced -- and what marks a price as checked
// in the tool. Local only, like the tool itself (lib/admin).

import fs from 'node:fs';
import path from 'node:path';

export interface PriceEdit {
  /** ISO time of the edit. */
  at: string;
  id: number;
  name: string;
  from: number | null;
  to: number | null;
  /** 'buy' for an NPC shop price; absent means the sell price. */
  field?: 'buy';
  /** Set on a line that reverses an earlier one. */
  undoOf?: string;
}

const FILE = path.join(process.cwd(), '.price-log.jsonl');

export function readPriceLog(): PriceEdit[] {
  try {
    return fs
      .readFileSync(FILE, 'utf8')
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line) as PriceEdit);
  } catch {
    return [];
  }
}

export function appendPriceLog(edit: PriceEdit): void {
  fs.appendFileSync(FILE, `${JSON.stringify(edit)}\n`, 'utf8');
}
