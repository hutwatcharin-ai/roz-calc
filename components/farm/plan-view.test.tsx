// The plan tab from stored ids to rendered cards. The payload is passed in
// directly -- since the integration the plan reads the same farm-data every
// mode reads, so there is no per-plan query left to stub.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { FARM_PLAN_STORAGE_KEY } from '@/lib/farm-plan';
import { FarmPlanProvider } from '@/components/FarmPlanProvider';
import PlanView from './PlanView';
import { caster, mob, nobody, place, world } from '@/lib/farm-engine/fixtures';
import type { PlayerInput } from '@/lib/farm-engine/types';

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const DATA = world(
  [mob(1002, { name: 'Poring', baseExp: 150 }), mob(1004, { name: 'Hornet', isAggressive: true, baseExp: 160 })],
  [place('prt_fild08', [[1002, 40]]), place('pay_fild01', [[1004, 30]])],
);

let container: HTMLDivElement;
let root: Root;

async function mountPlan(player: PlayerInput = nobody) {
  await act(async () => {
    root.render(
      <FarmPlanProvider>
        <PlanView data={DATA} player={player} level={50} levelGuessed />
      </FarmPlanProvider>,
    );
  });
}

beforeEach(() => {
  window.localStorage.clear();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe('the plan tab', () => {
  it('lists the monsters that were added, by name, with where to find them', async () => {
    window.localStorage.setItem(FARM_PLAN_STORAGE_KEY, '[1002,1004]');
    await mountPlan();

    expect(container.querySelectorAll('.farmplan__card')).toHaveLength(2);
    expect(container.textContent).toContain('Poring');
    expect(container.textContent).toContain('Hornet');
    expect(container.textContent).toContain('prt_fild08');
  });

  it('says the plan is empty rather than showing no cards', async () => {
    await mountPlan();

    expect(container.querySelector('.farmplan')).toBeNull();
    expect(container.textContent).toContain('ยังไม่มีมอนสเตอร์ในแผน');
  });

  it('takes a monster out when its remove button is pressed', async () => {
    window.localStorage.setItem(FARM_PLAN_STORAGE_KEY, '[1002,1004]');
    await mountPlan();

    const remove = Array.from(container.querySelectorAll('button')).find((b) => b.textContent === 'เอาออก');
    expect(remove).toBeDefined();
    await act(async () => {
      remove!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(window.localStorage.getItem(FARM_PLAN_STORAGE_KEY)).toBe('[1004]');
  });

  it('names the best monster per rate and never adds rates together', async () => {
    // A player stands in one place at a time; this guards against someone
    // later "adding a useful total".
    window.localStorage.setItem(FARM_PLAN_STORAGE_KEY, '[1002,1004]');
    await mountPlan(caster());

    expect(container.textContent).toContain('EXP/ชม. ดีสุด');
    expect(container.textContent).toContain('Hornet');
    expect(container.textContent).not.toContain('EXP รวม');
    expect(container.textContent).not.toContain('รวมทั้งแผน');
  });
});
