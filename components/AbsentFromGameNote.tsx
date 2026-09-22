// Shown on an item the live game client has no entry for (lib/game-absent.ts).
// Says what we checked and when, so the label reads as a finding rather than
// a verdict, and so a player who does see the item in game knows it is new.
import { ABSENT_CHECKED, isAbsentFromGame } from '@/lib/game-absent';

export default function AbsentFromGameNote({ id }: { id: number }) {
  if (!isAbsentFromGame(id)) return null;
  return (
    <p className="absentnote" role="note">
      <strong>ไม่พบในเกมเวอร์ชันปัจจุบัน</strong> ไอเทมนี้ไม่มีอยู่ในไฟล์ของตัวเกม RO Zero Global (ตรวจ {ABSENT_CHECKED})
      อาจเป็นของที่ยังไม่เปิด หรือของจากเซิร์ฟเวอร์อื่นที่ติดมากับแหล่งข้อมูล ถ้าเจอในเกมแล้ว แปลว่าเพิ่งเข้ามาในแพตช์ใหม่
    </p>
  );
}
