// Every "attacks first?" answer the owner records through /admin/monsters
// (5 Oct 2026), one JSON line each, in .aggro-log.jsonl at the project root
// (git-ignored, like .price-log.jsonl). Each line keeps the value it replaced,
// so a wrong click is undoable. Local only (lib/admin).

import fs from 'node:fs';
import path from 'node:path';

export interface AggroEdit {
  /** ISO time of the edit. */
  at: string;
  id: number;
  name: string;
  from: boolean | null;
  to: boolean | null;
  /** Set on a line that reverses an earlier one. */
  undoOf?: string;
}

const FILE = path.join(process.cwd(), '.aggro-log.jsonl');

export function readAggroLog(): AggroEdit[] {
  try {
    return fs
      .readFileSync(FILE, 'utf8')
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line) as AggroEdit);
  } catch {
    return [];
  }
}

export function appendAggroLog(edit: AggroEdit): void {
  fs.appendFileSync(FILE, `${JSON.stringify(edit)}\n`, 'utf8');
}
