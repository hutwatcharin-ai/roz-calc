// The click path the browser check was going to cover: press "เพิ่มเข้าแผน",
// see the button flip, see the plan land in storage, and see the planner page
// list the monster.
//
// Written because the Chrome extension went down mid-feature and the honest
// alternative to "I could not verify it" is a test that verifies it. Driven
// with react-dom/client and act directly rather than adding a testing library:
// one dev dependency (jsdom) buys the whole thing.

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { FARM_PLAN_STORAGE_KEY, MAX_PLAN_SIZE } from '@/lib/farm-plan';
import { FarmPlanProvider } from '@/components/FarmPlanProvider';
import AddToPlanButton from '@/components/AddToPlanButton';

// React 18's act() warns unless this is set.
(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

function mount(ui: React.ReactElement) {
  act(() => {
    root.render(ui);
  });
}

function button(): HTMLButtonElement {
  const el = container.querySelector('button');
  if (!el) throw new Error('no button rendered');
  return el as HTMLButtonElement;
}

function click(el: HTMLElement) {
  act(() => {
    el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
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
  vi.restoreAllMocks();
});

describe('add to plan, from a click', () => {
  it('starts as an invitation and flips to a confirmation', () => {
    mount(
      <FarmPlanProvider>
        <AddToPlanButton monsterId={1002} />
      </FarmPlanProvider>,
    );

    expect(button().textContent).toContain('เพิ่มเข้าแผน');
    expect(button().getAttribute('aria-pressed')).toBe('false');

    click(button());

    expect(button().textContent).toContain('อยู่ในแผน');
    expect(button().getAttribute('aria-pressed')).toBe('true');
  });

  it('writes the plan to storage where the planner page reads it', () => {
    mount(
      <FarmPlanProvider>
        <AddToPlanButton monsterId={1002} />
      </FarmPlanProvider>,
    );
    click(button());

    expect(window.localStorage.getItem(FARM_PLAN_STORAGE_KEY)).toBe('[1002]');
  });

  it('takes the monster back out when pressed again', () => {
    mount(
      <FarmPlanProvider>
        <AddToPlanButton monsterId={1002} />
      </FarmPlanProvider>,
    );
    click(button());
    click(button());

    expect(button().textContent).toContain('เพิ่มเข้าแผน');
    expect(window.localStorage.getItem(FARM_PLAN_STORAGE_KEY)).toBe('[]');
  });

  it('shows a monster already in the plan as already in the plan on first paint', () => {
    // The reason the button renders nothing until storage has been read: a
    // flash of "เพิ่มเข้าแผน" on a monster the player already added is a wrong
    // claim, however brief.
    window.localStorage.setItem(FARM_PLAN_STORAGE_KEY, '[1002]');
    mount(
      <FarmPlanProvider>
        <AddToPlanButton monsterId={1002} />
      </FarmPlanProvider>,
    );

    expect(button().textContent).toContain('อยู่ในแผน');
  });

  it('refuses rather than silently evicting when the plan is full', () => {
    const full = JSON.stringify(Array.from({ length: MAX_PLAN_SIZE }, (_, i) => i + 1));
    window.localStorage.setItem(FARM_PLAN_STORAGE_KEY, full);
    mount(
      <FarmPlanProvider>
        <AddToPlanButton monsterId={9999} />
      </FarmPlanProvider>,
    );

    expect(button().disabled).toBe(true);
    expect(button().textContent).toContain('แผนเต็ม');

    click(button());
    expect(window.localStorage.getItem(FARM_PLAN_STORAGE_KEY)).toBe(full);
  });

  it('still works in a browser that refuses to store anything', () => {
    // Safari private mode throws on setItem rather than returning. The button
    // must keep working for the session instead of taking the page down.
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    mount(
      <FarmPlanProvider>
        <AddToPlanButton monsterId={1002} />
      </FarmPlanProvider>,
    );
    click(button());

    expect(button().textContent).toContain('อยู่ในแผน');
  });
});
