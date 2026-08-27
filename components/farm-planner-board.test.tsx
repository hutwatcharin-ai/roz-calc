// The second half of the path: having pressed "เพิ่มเข้าแผน", open the planner
// and see the monster listed. The Supabase client is stubbed -- the point here
// is the wiring from stored ids to rendered rows, not the network.

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { FARM_PLAN_STORAGE_KEY } from '@/lib/farm-plan';
import { FarmPlanProvider } from '@/components/FarmPlanProvider';
import { CharacterContextProvider } from '@/components/CharacterContextProvider';
import FarmPlannerBoard from '@/components/FarmPlannerBoard';

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const STATS = [
  {
    monster_id: 1002,
    name_en: 'Poring',
    level: 1,
    hp: 55,
    base_exp: 150,
    exp_per_hp: 2.73,
    avg_zeny_per_kill: 20,
    image_url: null,
    is_aggressive: false,
    atk_max: 7,
  },
  {
    monster_id: 1004,
    name_en: 'Hornet',
    level: 11,
    hp: 169,
    base_exp: 160,
    exp_per_hp: 0.95,
    avg_zeny_per_kill: 40,
    image_url: null,
    is_aggressive: true,
    atk_max: 24,
  },
];

const SPAWNS = [
  { monster_id: 1002, map_display_name: 'Prontera Field' },
  { monster_id: 1004, map_display_name: 'Payon Forest' },
];

// Captures what the board asked for, so a test can assert it queried the
// planned ids rather than everything.
const asked: { table: string; ids: unknown }[] = [];

vi.mock('@/lib/supabase', () => ({
  supabaseBrowser: () => ({
    from(table: string) {
      return {
        select() {
          return {
            in(_column: string, ids: unknown) {
              asked.push({ table, ids });
              const data = table === 'monster_spawns' ? SPAWNS : STATS;
              return Promise.resolve({ data, error: null });
            },
          };
        },
      };
    },
  }),
}));

let container: HTMLDivElement;
let root: Root;

async function mountBoard() {
  await act(async () => {
    root.render(
      <CharacterContextProvider>
        <FarmPlanProvider>
          <FarmPlannerBoard />
        </FarmPlanProvider>
      </CharacterContextProvider>,
    );
  });
}

beforeEach(() => {
  asked.length = 0;
  window.localStorage.clear();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe('the planner page', () => {
  it('lists the monsters that were added, by name', async () => {
    window.localStorage.setItem(FARM_PLAN_STORAGE_KEY, '[1002,1004]');
    await mountBoard();

    const rows = container.querySelectorAll('.data-table tbody tr');
    expect(rows).toHaveLength(2);
    expect(container.textContent).toContain('Poring');
    expect(container.textContent).toContain('Hornet');
    expect(container.textContent).toContain('Prontera Field');
  });

  it('asks only for the planned ids', async () => {
    window.localStorage.setItem(FARM_PLAN_STORAGE_KEY, '[1002]');
    await mountBoard();

    expect(asked.map((a) => a.table).sort()).toEqual(['monster_farming_stats', 'monster_spawns']);
    for (const call of asked) expect(call.ids).toEqual([1002]);
  });

  it('says the plan is empty rather than showing an empty table', async () => {
    await mountBoard();

    expect(container.querySelector('.data-table')).toBeNull();
    expect(container.textContent).toContain('ยังไม่มีมอนสเตอร์ในแผน');
  });

  it('takes a row out when its remove button is pressed', async () => {
    window.localStorage.setItem(FARM_PLAN_STORAGE_KEY, '[1002,1004]');
    await mountBoard();

    const remove = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent === 'เอาออก',
    );
    expect(remove).toBeDefined();

    await act(async () => {
      remove!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(window.localStorage.getItem(FARM_PLAN_STORAGE_KEY)).toBe('[1004]');
  });

  it('never sums EXP per hour across the plan', async () => {
    // A player stands in one place at a time. The page compares rows instead,
    // and this is the guard against someone later "adding a useful total".
    window.localStorage.setItem(FARM_PLAN_STORAGE_KEY, '[1002,1004]');
    window.localStorage.setItem(
      'roz-calc:character',
      JSON.stringify({ level: 20, job: 'knight', vit: 20, damagePerHit: 200, attacksPerSecond: 2 }),
    );
    await mountBoard();

    expect(container.textContent).toContain('ตัวที่คุ้มที่สุดคือ');
    expect(container.textContent).not.toContain('EXP รวม');
  });
});
