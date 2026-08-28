// The "how many more until I level" row on a monster page, driven end to end:
// a character in storage, a monster's EXP, and a real number rendered.
//
// Worth a component test rather than a lib test alone, because every previous
// version of this wiring bug on this site was a library that worked and a page
// that never called it.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { CHARACTER_STORAGE_KEY } from '@/lib/character-context';
import { CharacterContextProvider } from '@/components/CharacterContextProvider';
import ExpRangeCalculator from '@/components/ExpRangeCalculator';
import KillRatePanel from '@/components/KillRatePanel';

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

function storeCharacter(level: number) {
  window.localStorage.setItem(
    CHARACTER_STORAGE_KEY,
    JSON.stringify({ level, job: 'swordsman', damagePerHit: 100, attacksPerSecond: 1, vit: 10 }),
  );
}

async function mount(node: React.ReactNode) {
  await act(async () => {
    root.render(<CharacterContextProvider>{node}</CharacterContextProvider>);
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

describe('the level-up row on a monster page', () => {
  it('says how many kills are left, using the bar the character is actually on', async () => {
    // Level 1 fills the 2,500 bar. At 300 EXP a kill that is 9 kills, and the
    // row must name level 2 as the destination, not level 1.
    storeCharacter(1);
    await mount(<KillRatePanel monsterHp={100} expPerKill={300} monsterName="Poring" />);

    expect(container.textContent).toContain('ตีอีกกี่ตัวขึ้นเลเวล 2');
    expect(container.textContent).toContain('9 ตัว');
  });

  it('says the guide runs out rather than showing nothing at level 50', async () => {
    storeCharacter(50);
    await mount(<KillRatePanel monsterHp={100} expPerKill={300} monsterName="Poring" />);

    expect(container.textContent).toContain('ถึงเลเวล 50 เท่านั้น');
    expect(container.textContent).not.toContain(' ตัว\n');
  });

  it('does not claim a kill count for a monster with no EXP in the data', async () => {
    storeCharacter(20);
    await mount(<KillRatePanel monsterHp={100} expPerKill={null} monsterName="Poring" />);

    expect(container.textContent).toContain('ไม่มีค่า EXP ในข้อมูล');
  });
});

describe('the EXP range calculator', () => {
  it('totals the bars between two levels', async () => {
    await mount(<ExpRangeCalculator />);
    // Default range is 1 to 30. Sum of rows 2..30.
    expect(container.textContent).toContain('2,316,500');
  });

  it('re-totals when the destination changes', async () => {
    await mount(<ExpRangeCalculator />);
    const selects = container.querySelectorAll('select');
    expect(selects).toHaveLength(2);

    await act(async () => {
      const to = selects[1] as HTMLSelectElement;
      to.value = '3';
      to.dispatchEvent(new Event('change', { bubbles: true }));
    });

    // 1 to 3 is 2,500 + 3,000.
    expect(container.textContent).toContain('5,500');
  });
});
