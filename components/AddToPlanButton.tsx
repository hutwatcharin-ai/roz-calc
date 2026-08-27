'use client';

import { useFarmPlan } from '@/components/FarmPlanProvider';

// Sits on a monster page and on every farming-finder row (spec 3.6). Renders
// nothing until storage has been read: showing "เพิ่มเข้าแผน" for a moment to
// someone whose plan already contains this monster would be a wrong claim,
// however brief.
export default function AddToPlanButton({
  monsterId,
  compact = false,
}: {
  monsterId: number;
  compact?: boolean;
}) {
  const { add, remove, has, full, ready } = useFarmPlan();

  if (!ready) return null;

  const inPlan = has(monsterId);
  const blocked = !inPlan && full;

  return (
    <button
      type="button"
      className={`planbtn${inPlan ? ' planbtn--on' : ''}${compact ? ' planbtn--compact' : ''}`}
      onClick={() => (inPlan ? remove(monsterId) : add(monsterId))}
      disabled={blocked}
      title={blocked ? 'แผนเต็มแล้ว เอาตัวอื่นออกก่อน' : undefined}
      aria-pressed={inPlan}
    >
      {inPlan ? '✓ อยู่ในแผน' : blocked ? 'แผนเต็ม' : '+ เพิ่มเข้าแผน'}
    </button>
  );
}
