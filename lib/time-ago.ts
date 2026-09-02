// Thai relative-time label for a freshness badge. Coarse buckets on purpose:
// "3 วันที่แล้ว" is a trust signal, "3 วัน 4 ชม. 12 นาทีที่แล้ว" is noise.
export function timeAgoTh(iso: string, now: Date = new Date()): string {
  const then = new Date(iso);
  const diffMs = now.getTime() - then.getTime();
  if (!Number.isFinite(diffMs) || diffMs < 0) return 'เมื่อสักครู่';

  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return 'เมื่อสักครู่';
  if (minutes < 60) return `${minutes} นาทีที่แล้ว`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ชม.ที่แล้ว`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} วันที่แล้ว`;

  const months = Math.floor(days / 30);
  return `${months} เดือนที่แล้ว`;
}
