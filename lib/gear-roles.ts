// "What is this gear for", the same question the card and item lists answer
// with chips.
//
// There is no column for it. The only evidence is the client's own effect text
// in items.description, so every group here is a wording that text actually
// uses, and a group only exists if enough rows carry it to be worth a chip.
// Nothing is inferred from a name or a stat block.
//
// Deliberately absent: "สายตี". Every weapon has ATK and every piece of armour
// has DEF, so a chip for those would match half the list and filter nothing --
// the same reason the item list drops groups it cannot support. A row can sit
// in several groups, so the counts overlap, and 515 of 876 rows sit in none:
// plain gear whose description is a sentence of flavour text and a DEF line.

export type GearRole = 'magic' | 'tank' | 'crit' | 'race' | 'speed' | 'pvp';

export const ROLE_ORDER: GearRole[] = ['magic', 'tank', 'crit', 'race', 'speed', 'pvp'];

export const ROLE_TH: Record<GearRole, { title: string; asks: string }> = {
  magic: { title: 'สายเวท', asks: 'เพิ่ม MATK, ลด SP ที่ใช้ หรือลดเวลาร่าย' },
  tank: { title: 'สายอึด', asks: 'เพิ่ม MHP/MDEF ต้านธาตุ หรือลดดาเมจที่รับ' },
  crit: { title: 'สายคริ', asks: 'เพิ่มอัตราคริติคอลหรือดาเมจคริ' },
  race: { title: 'ตีเผ่าเจาะจง', asks: 'ตีมอนบางเผ่าแรงขึ้น เช่น อันเดด ปีศาจ แมลง' },
  speed: { title: 'สายความเร็ว', asks: 'เพิ่ม ASPD หรือความเร็วเดิน' },
  pvp: { title: 'GvG/PvP', asks: 'ผลใช้ตอนตีกับผู้เล่น หรือในเขต GvG/WoE' },
};

const RACES = 'Demon|Undead|Brute|Formless|Insect|Fish|Plant|Angel|Dragon|Demi[- ]?Human';

const ROLE_PATTERNS: Record<GearRole, RegExp> = {
  magic: /\bMATK\b|Magic Attack|magical damage|\bMSP\b|SP consumption|variable cast/i,
  tank: /\bMHP\b|\bMDEF\b|Damage Taken|resistance|reduces? damage/i,
  // Both spellings occur: "CRIT +5" on older rows, "Crit Damage" on newer ones.
  crit: /\bCRIT|Critical/i,
  // Two wordings, and "damage to player" must not land here -- that is pvp.
  race: new RegExp(`damage\\s+(?:against|on|to|inflicted on)\\s+(?:all\\s+)?(?:${RACES})|(?:${RACES})\\s+(?:monsters?|type)`, 'i'),
  speed: /\bASPD\b|attack speed|Movement Speed|walking speed/i,
  pvp: /GvG|WoE|Damage Taken from Players|against Players|damage to player/i,
};

/** Every group this description supports, in display order. */
export function gearRoles(description: string | null | undefined): GearRole[] {
  if (!description) return [];
  return ROLE_ORDER.filter((role) => ROLE_PATTERNS[role].test(description));
}

export function isGearRole(value: string | null | undefined): value is GearRole {
  return value != null && (ROLE_ORDER as string[]).includes(value);
}
