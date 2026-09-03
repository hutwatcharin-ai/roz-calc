// A page's limits, folded away.
//
// These notes exist because this site does not hide what its numbers cannot
// do -- but always-open, three of them stacked on one tool page pushed the
// tool itself below the fold, which is what the user called out on 3 Sep. So
// the text stays, exactly as it was; only its default state changes. A
// <details>, so it costs no client JS and a crawler still reads the content.

export default function Caveat({
  label = 'ข้อจำกัดของตัวเลขนี้',
  children,
}: {
  label?: string;
  children: React.ReactNode;
}) {
  return (
    <details className="caveat">
      <summary>{label}</summary>
      <div className="caveat__body">{children}</div>
    </details>
  );
}
