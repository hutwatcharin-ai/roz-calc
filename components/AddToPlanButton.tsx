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

  // Before storage has been read the button is drawn but hidden, not skipped:
  // rendering nothing let the row grow by 19 px the moment the plan loaded and
  // pushed the page down under the reader (CLS 0.066 on a phone, 23 Sep 2026).
  // Hidden rather than labelled, for the reason above -- an unread plan must
  // not claim this monster is or is not in it.
  if (!ready) {
    return (
      <button
        type="button"
        className={`planbtn planbtn--waiting${compact ? ' planbtn--compact' : ''}`}
        disabled
        aria-hidden="true"
        tabIndex={-1}
      >
        + เพิ่มเข้าแผน
      </button>
    );
  }

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
