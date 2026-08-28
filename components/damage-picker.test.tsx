// The multiplier tool driven through the DOM: change the weapon, watch the
// combined number change. The library maths is tested separately; what this
// covers is the wiring, which is where this site's bugs have actually lived.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import DamagePicker from '@/components/DamagePicker';
import MonsterBestWeaponPanel from '@/components/MonsterBestWeaponPanel';

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

async function mount(node: React.ReactNode) {
  await act(async () => {
    root.render(node);
  });
}

function selectByLabel(text: string): HTMLSelectElement {
  const label = Array.from(container.querySelectorAll('label')).find((el) =>
    el.textContent?.startsWith(text),
  );
  if (!label) throw new Error(`no label starting with ${text}`);
  const select = label.querySelector('select');
  if (!select) throw new Error(`label ${text} has no select`);
  return select;
}

/** The one number the tool exists to produce: element x size, from its own row. */
function multiplier(): string {
  const row = Array.from(container.querySelectorAll('tr')).find((tr) =>
    tr.textContent?.includes('คูณกันแล้ว'),
  );
  if (!row) throw new Error('no combined-multiplier row');
  const cell = row.querySelector('td:last-child');
  return cell?.textContent?.trim() ?? '';
}

async function choose(labelText: string, value: string) {
  await act(async () => {
    const select = selectByLabel(labelText);
    select.value = value;
    select.dispatchEvent(new Event('change', { bubbles: true }));
  });
}

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe('the damage multiplier tool', () => {
  it('multiplies the two tables rather than showing them side by side', async () => {
    await mount(<DamagePicker />);
    // Defaults: Undead-1 target, Large, Holy is the strong element.
    await choose('อาวุธที่ถือ', 'Book');
    await choose('ธาตุอาวุธ', 'Holy');

    // Holy into Undead-1 is 125; a Book against Large is 50; the product is 62.5
    // -- weaker than a bare hand, which is exactly the point of the page.
    expect(container.textContent).toContain('62.5%');
  });

  it('changes the multiplier, not just the weapon name, when the weapon changes', async () => {
    // Asserting on the number rather than on "the text differs": the panel
    // prints the weapon name too, so a version that ignored the choice entirely
    // still changed its text. Only the multiplier proves the choice was read.
    await mount(<DamagePicker />);
    await choose('ธาตุอาวุธ', 'Holy');

    await choose('อาวุธที่ถือ', 'Bare hand');
    expect(multiplier()).toBe('125%'); // Holy into Undead-1, no size penalty

    await choose('อาวุธที่ถือ', 'Dagger');
    expect(multiplier()).toBe('62.5%'); // same element, halved by Large
  });

  it('re-ranks the elements when the target element changes', async () => {
    await mount(<DamagePicker />);
    const undeadFirst = container.querySelector('.stat-table:last-of-type tbody tr th')?.textContent;

    await choose('ธาตุของเป้าหมาย', 'Fire');
    const fireFirst = container.querySelector('.stat-table:last-of-type tbody tr th')?.textContent;

    expect(fireFirst).not.toBe(undeadFirst);
  });
});

describe('the monster page panel', () => {
  it('renders without JavaScript state, from the monster own fields', async () => {
    await mount(<MonsterBestWeaponPanel element="Undead" elementLevel={1} size="Large" />);
    expect(container.textContent).toContain('ตีตัวนี้ด้วยอะไรดี');
    expect(container.textContent).toContain('ธาตุ Undead1');
  });

  it('shows nothing when a field it needs is missing', async () => {
    // Better silent than an answer computed against a default size nobody chose.
    await mount(<MonsterBestWeaponPanel element="Undead" elementLevel={null} size="Large" />);
    expect(container.textContent).toBe('');

    await act(async () => root.render(<MonsterBestWeaponPanel element={null} elementLevel={1} size="Large" />));
    expect(container.textContent).toBe('');
  });
});
