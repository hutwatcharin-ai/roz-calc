'use client';

// Click a card's art to see it big, sealed in a graded-card slab like a
// trading card sent off for grading (owner, 1 Oct 2026). The label is ours
// ("RO ZERO THAI"), not any real grading company's, and the grade is the
// card's game data dressed up, not a claim about anything.
//
// A native <dialog>: Escape, focus and the backdrop come with it. The art is
// 150x200, so the slab shows it at 2x and no more before it goes soft.

import { useRef } from 'react';
import SlabBody from '@/components/SlabBody';

export default function CardSlab({
  id,
  name,
  src,
  alt,
  slot,
  children,
}: {
  id: number;
  name: string;
  src: string;
  alt: string;
  slot: string | null;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const close = () => ref.current?.close();

  return (
    <>
      <button type="button" className="slabopen" onClick={() => ref.current?.showModal()} aria-label={`ขยายรูป ${name}`}>
        {children}
        <span className="slabopen__hint" aria-hidden="true">⤢ ขยาย</span>
      </button>
      <dialog
        ref={ref}
        className="slabdlg"
        aria-label={`${name} ขนาดใหญ่`}
        // A click on the backdrop lands on the dialog itself, not its content.
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
      >
        <SlabBody id={id} name={name} slot={slot} src={src} alt={alt} />
        <button type="button" className="slabdlg__close" onClick={close} aria-label="ปิด">
          ✕
        </button>
      </dialog>
    </>
  );
}
