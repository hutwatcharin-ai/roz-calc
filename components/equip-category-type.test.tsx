// The behavior the server-rendered version could not give (user report,
// 2 Sep): pick a category and the subtype dropdown appears immediately,
// with that category's own options, and a previously picked subtype does
// not leak across categories.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import EquipCategoryType from './EquipCategoryType';

const props = {
  initialCategory: '',
  initialType: '',
  categories: ['Weapon', 'Armor', 'Costume Equipment'] as const,
  labels: { Weapon: 'อาวุธ', Armor: 'เกราะ/สวมใส่', 'Costume Equipment': 'คอสตูม' },
  typesByCategory: {
    Weapon: ['Bow', 'Dagger'],
    Armor: ['Headgear', 'Shoes'],
    'Costume Equipment': ['Upper Head', 'Garment'],
  },
  placeholders: {
    Weapon: 'ทุกชนิดอาวุธ',
    Armor: 'ทุกตำแหน่งสวม',
    'Costume Equipment': 'ทุกตำแหน่งคอสตูม',
  },
};

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function selects(): HTMLSelectElement[] {
  return Array.from(container.querySelectorAll('select'));
}

function pickCategory(value: string) {
  const el = selects()[0];
  act(() => {
    const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')!.set!;
    setter.call(el, value);
    el.dispatchEvent(new Event('change', { bubbles: true }));
  });
}

describe('EquipCategoryType', () => {
  it('shows no subtype select until a category is picked', () => {
    act(() => root.render(<EquipCategoryType {...props} />));
    expect(selects()).toHaveLength(1);
  });

  it('picking a category reveals its own subtype options at once', () => {
    act(() => root.render(<EquipCategoryType {...props} />));
    pickCategory('Costume Equipment');
    const type = selects()[1];
    const options = Array.from(type.options).map((o) => o.textContent);
    expect(options).toContain('Upper Head');
    expect(options).toContain('ทุกตำแหน่งคอสตูม');
    expect(options).not.toContain('Bow');
  });

  it('switching categories resets the picked subtype', () => {
    act(() => root.render(<EquipCategoryType {...props} initialCategory="Weapon" initialType="Bow" />));
    expect(selects()[1].value).toBe('Bow');
    pickCategory('Armor');
    expect(selects()[1].value).toBe('');
    expect(Array.from(selects()[1].options).map((o) => o.textContent)).toContain('Shoes');
  });
});
