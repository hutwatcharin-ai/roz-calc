import { describe, expect, it } from 'vitest';
import { linkItemRefs } from './quest-item-refs';

function flat(nodes: ReturnType<typeof linkItemRefs>): string {
  return nodes
    .map((n) => (typeof n === 'string' ? n : `<a:${(n as any).props.href}>${(n as any).props.children}</a>`))
    .join('');
}

describe('linkItemRefs', () => {
  it('turns [Name]id into an item link', () => {
    expect(flat(linkItemRefs('ช่วยรวบรวม [Hard Horn]947 มาให้ 10 ชิ้น'))).toBe(
      'ช่วยรวบรวม <a:/database/items/947>Hard Horn</a> มาให้ 10 ชิ้น',
    );
  });

  it('handles several refs and leaves plain text alone', () => {
    const out = flat(linkItemRefs('[A]1 กับ [B]22 นะ'));
    expect(out).toBe('<a:/database/items/1>A</a> กับ <a:/database/items/22>B</a> นะ');
    expect(flat(linkItemRefs('ไม่มีอ้างอิงอะไร'))).toBe('ไม่มีอ้างอิงอะไร');
  });

  it('ignores brackets without a trailing id', () => {
    expect(flat(linkItemRefs('กด [Enter] เพื่อไปต่อ'))).toBe('กด [Enter] เพื่อไปต่อ');
  });
});
