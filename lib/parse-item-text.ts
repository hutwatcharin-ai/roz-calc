export interface ParsedItemText {
  weaponType: string | null;
  atk: number | null;
  weaponLevel: number | null;
  requiredLevel: number | null;
  equippableClasses: string[];
}

function findField(lines: string[], label: string): string | null {
  const line = lines.find((l) => l.trim().startsWith(`${label} :`));
  if (!line) return null;
  return line.split(':').slice(1).join(':').trim();
}

function toInt(value: string | null): number | null {
  if (value === null) return null;
  const n = parseInt(value, 10);
  return Number.isNaN(n) ? null : n;
}

export function parseItemDescription(lines: string[]): ParsedItemText {
  const equipRaw = findField(lines, 'Equippable by');

  return {
    weaponType: findField(lines, 'Type'),
    atk: toInt(findField(lines, 'ATK')),
    weaponLevel: toInt(findField(lines, 'Weapon Level')),
    requiredLevel: toInt(findField(lines, 'Required Level')),
    equippableClasses: equipRaw
      ? equipRaw
          .split(',')
          .map((c) => c.replace(/\s*Class\s*$/i, '').trim())
          .filter(Boolean)
      : [],
  };
}
