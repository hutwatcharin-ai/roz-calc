import type { RegionSeed } from '@/lib/map-regions';

// Phase 1: major hubs plus the two multi-floor dungeons players search for most.
// Coordinates are maintained against the 1280x1024 in-game atlas.
export const MAP_REGION_SEEDS: RegionSeed[] = [
  { slug: 'aldebaran', nameEn: 'Aldebaran', nameTh: 'อัลเดบารัน', kind: 'city', x: 812, y: 292, width: 58, height: 59, hasKafra: true, mapCodes: ['aldebaran'] },
  { slug: 'geffen', nameEn: 'Geffen', nameTh: 'เกฟเฟน', kind: 'city', x: 576, y: 528, width: 59, height: 58, hasKafra: true, mapCodes: ['geffen'] },
  { slug: 'prontera', nameEn: 'Prontera', nameTh: 'พรอนเทรา', kind: 'city', x: 812, y: 587, width: 58, height: 56, hasKafra: true, mapCodes: ['prontera'] },
  { slug: 'izlude', nameEn: 'Izlude', nameTh: 'อิซลูด', kind: 'city', x: 866, y: 638, width: 42, height: 44, hasKafra: true, mapCodes: ['izlude'] },
  { slug: 'payon', nameEn: 'Payon', nameTh: 'พะยอน', kind: 'city', x: 967, y: 746, width: 46, height: 57, hasKafra: true, mapCodes: ['payon'] },
  { slug: 'alberta', nameEn: 'Alberta', nameTh: 'อัลเบอร์ตา', kind: 'city', x: 1059, y: 913, width: 54, height: 51, hasKafra: true, mapCodes: ['alberta'] },
  { slug: 'morroc', nameEn: 'Morroc', nameTh: 'มอร็อค', kind: 'city', x: 606, y: 845, width: 49, height: 48, hasKafra: true, mapCodes: ['morocc'] },
  { slug: 'comodo', nameEn: 'Comodo', nameTh: 'โคโมโด', kind: 'city', x: 297, y: 835, width: 59, height: 58, hasKafra: true, mapCodes: ['comodo'] },
  { slug: 'umbala', nameEn: 'Umbala', nameTh: 'อุมบาลา', kind: 'city', x: 308, y: 660, width: 48, height: 56, hasKafra: true, mapCodes: ['umbala'] },
  { slug: 'payon-cave', nameEn: 'Payon Cave', nameTh: 'ถ้ำพะยอน', kind: 'dungeon', x: 1065, y: 692, width: 78, height: 44, mapCodes: ['pay_dun00', 'pay_dun01', 'pay_dun02', 'pay_dun03', 'pay_dun04'] },
  { slug: 'izlude-dungeon', nameEn: 'Byalan Dungeon', nameTh: 'ถ้ำใต้ทะเลไบลัน', kind: 'dungeon', x: 976, y: 639, width: 94, height: 42, mapCodes: ['iz_dun00', 'iz_dun01', 'iz_dun02'] },
  { slug: 'orc-village', nameEn: 'Orc Village', nameTh: 'หมู่บ้านออร์ค', kind: 'field', x: 445, y: 632, width: 105, height: 76, mapCodes: ['gef_fild10', 'gef_fild14'] },
  { slug: 'prontera-fields', nameEn: 'Prontera Fields', nameTh: 'ทุ่งพรอนเทรา', kind: 'field', x: 744, y: 520, width: 188, height: 198, mapCodes: ['prt_fild00', 'prt_fild01', 'prt_fild02', 'prt_fild03', 'prt_fild04', 'prt_fild05', 'prt_fild06', 'prt_fild07', 'prt_fild08', 'prt_fild09', 'prt_fild10'] },
  { slug: 'geffen-fields', nameEn: 'Geffen Fields', nameTh: 'ทุ่งเกฟเฟน', kind: 'field', x: 450, y: 455, width: 190, height: 310, mapCodes: ['gef_fild00', 'gef_fild01', 'gef_fild02', 'gef_fild03', 'gef_fild04', 'gef_fild05', 'gef_fild06', 'gef_fild07', 'gef_fild08', 'gef_fild09', 'gef_fild10', 'gef_fild11', 'gef_fild13'] },
];
