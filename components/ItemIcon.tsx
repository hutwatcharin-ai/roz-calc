// components/ItemIcon.tsx
//
// The item's sprite, or an honest stand-in. 3,215 of the 4,515 items arrived
// from the export without an icon file we serve (the export deliberately did
// not mirror images), and an empty gap where every other row has a sprite
// reads as a broken page. The stand-in is a lettered tile keyed to the
// category -- a glyph, not an emoji, and not someone else's hotlinked file.

const LETTER: Record<string, string> = {
  Weapon: 'W',
  Armor: 'A',
  Card: 'C',
  'Costume Equipment': 'Cs',
  'Consumable / Recovery': 'P',
  Enchantment: 'En',
  'Enchant Stone': 'St',
  Special: 'Sp',
  Pet: 'Pt',
  Other: '·',
};

export default function ItemIcon({
  iconUrl,
  category,
  size = 24,
}: {
  iconUrl: string | null;
  category: string | null;
  size?: number;
}) {
  if (iconUrl) {
    return (
      <img
        loading="lazy"
        decoding="async"
        src={iconUrl}
        alt=""
        width={size}
        height={size}
        style={{ imageRendering: 'pixelated' }}
      />
    );
  }
  return (
    <span className="iconph" style={{ width: size, height: size }} aria-hidden="true">
      {LETTER[category ?? ''] ?? '·'}
    </span>
  );
}
