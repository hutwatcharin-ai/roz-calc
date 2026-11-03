// Gear id -> its collection picture (scripts/build-item-art.py).
import file from '@/data/item-art.json';

const ITEMS = (file as unknown as { items: Record<string, string> }).items;

export function itemArt(id: number): string | null {
  const f = ITEMS[String(id)];
  return f ? `/images/item-art/${f}.webp` : null;
}
