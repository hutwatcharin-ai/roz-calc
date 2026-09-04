// tool_use counts a person, not a keystroke: opening the page is not a use,
// the first change is, and the twentieth change is still the same one use.
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import RefineCalculator from './RefineCalculator';
import { resetToolUse } from '@/lib/analytics';

let container: HTMLDivElement;
let root: Root;
let calls: unknown[][];

beforeEach(() => {
  calls = [];
  resetToolUse();
  window.gtag = (...args: unknown[]) => {
    calls.push(args);
  };
  window.history.replaceState(null, '', '/tools/refine');
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  delete window.gtag;
});

function setSelect(index: number, value: string) {
  const select = container.querySelectorAll('select')[index];
  const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')!.set!;
  act(() => {
    setter.call(select, value);
    select.dispatchEvent(new Event('change', { bubbles: true }));
  });
}

describe('refine calculator tool_use', () => {
  it('fires once, on the first change, with the values after that change', () => {
    act(() => root.render(<RefineCalculator />));
    expect(calls).toEqual([]);

    setSelect(0, 'armour');
    expect(calls).toHaveLength(1);
    expect(calls[0][1]).toBe('tool_use');
    expect(calls[0][2]).toMatchObject({ tool: 'refine', gear: 'armour', target: 7 });

    setSelect(1, '4');
    expect(calls).toHaveLength(1);
  });
});
