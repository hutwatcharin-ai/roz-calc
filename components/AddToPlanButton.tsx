'use client';

import Link from 'next/link';
import { useFarmPlan } from '@/components/FarmPlanProvider';

// Sits on a monster page and on every farming-finder row (spec 3.6). Since
// 19 Oct 2026 the list it fills is the monster comparison page
// (/database/monsters/compare), so it says "เปรียบเทียบ", not "แผน". Renders
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
  const { add, remove, has, full, ready, plan } = useFarmPlan();

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
        + เปรียบเทียบ
      </button>
    );
  }

  const inPlan = has(monsterId);
  const blocked = !inPlan && full;

  // Where the list is read (owner, 19 Oct 2026: "after pressing it, where do
  // I look?"): a link beside the button once the list has anything in it.
  // Not on the compact rows of a table, where one link per row is noise.
  const button = (
    <button
      type="button"
      className={`planbtn${inPlan ? ' planbtn--on' : ''}${compact ? ' planbtn--compact' : ''}`}
      onClick={() => (inPlan ? remove(monsterId) : add(monsterId))}
      disabled={blocked}
      title={blocked ? 'รายการเปรียบเทียบเต็มแล้ว เอาตัวอื่นออกก่อน' : inPlan ? 'กดอีกทีเพื่อเอาออก · ดูที่หน้าเปรียบเทียบมอน' : undefined}
      aria-pressed={inPlan}
    >
      {inPlan ? '✓ อยู่ในรายการเปรียบเทียบ' : blocked ? 'รายการเต็ม' : '+ เปรียบเทียบ'}
    </button>
  );
  if (compact || plan.length === 0) return button;
  return (
    <>
      {button}
      <Link href="/database/monsters/compare" className="planlink">
        ดูที่เปรียบเทียบ ({plan.length}) ›
      </Link>
    </>
  );
}
