// Costume positions and their Thai labels, shared by /database/costumes and
// the costume suggestions (app/suggest/[kind]).

// Costume positions crawled from rozerodb item pages (2 Sep) -- these are the
// values items.weapon_type actually holds for Costume Equipment rows, ordered
// by how many rows carry each.
export const POSITIONS = [
  'Upper Head',
  'Lower Head',
  'Mid Head',
  'Garment',
  'Upper/Mid Head',
  'Mid/Lower Head',
  'All Head Slots',
  'Upper/Lower Head',
] as const;

/** 281 costumes carry no position at all; they get a chip of their own rather than vanishing from every position. */
export const NO_POSITION = 'none';

export const POSITION_LABELS: Record<string, string> = {
  'Upper Head': 'หัวบน',
  'Mid Head': 'หัวกลาง',
  'Lower Head': 'หัวล่าง',
  'Upper/Mid Head': 'หัวบน+กลาง',
  'Mid/Lower Head': 'หัวกลาง+ล่าง',
  'Upper/Lower Head': 'หัวบน+ล่าง',
  'All Head Slots': 'ครบทุกช่องหัว',
  Garment: 'ผ้าคลุม',
  [NO_POSITION]: 'ไม่ระบุตำแหน่ง',
};
