// components/PageHeader.tsx
//
// One page header for the whole site. It replaced the same three lines of
// inline style copy-pasted into eighteen pages, where the title was pinned at
// 32px and a long Thai heading wrapped to two lines on a narrow phone.
//
// The source line is part of the header rather than a box below it. Provenance
// belongs near the title, not between the reader and the tool -- on the refine
// page the two note boxes that used to sit there pushed the first control to
// 794px on a 900px screen.

import type { ReactNode } from 'react';

export default function PageHeader({
  title,
  lead,
  source,
  children,
}: {
  title: ReactNode;
  /** One sentence on what this page answers. Optional -- a list page rarely needs one. */
  lead?: ReactNode;
  /** Where the numbers come from. Quiet by design; warnings use .ceiling-note instead. */
  source?: ReactNode;
  /** Anything that belongs beside the title, such as a status badge. */
  children?: ReactNode;
}) {
  return (
    <header className="pagehead">
      <div className="pagehead__row">
        <h1 className="pagehead__title">{title}</h1>
        {children}
      </div>
      {lead && <p className="pagehead__lead">{lead}</p>}
      {source && <p className="source-note">{source}</p>}
    </header>
  );
}
