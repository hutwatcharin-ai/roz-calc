// The graded-card slab itself: label, barcode, and the card in its window.
// Drawn small on the card page and big in the CardSlab dialog (owner,
// 1 Oct 2026: "the slab frame on the normal picture too"). The label is ours,
// not a real grading company's; the 10 is decoration.

export default function SlabBody({
  id,
  name,
  slot,
  src,
  alt,
  mini = false,
}: {
  id: number;
  name: string;
  slot: string | null;
  src: string;
  alt: string;
  mini?: boolean;
}) {
  return (
    <div className={mini ? 'slab slab--mini' : 'slab'}>
      <div className="slab__label">
        <div className="slab__left">
          <span className="slab__brand">RO ZERO THAI · CARD</span>
          <span className="slab__name">{name}</span>
          <span className="slab__meta">
            #{id}
            {slot ? ` · ${slot}` : ''}
          </span>
        </div>
        <div className="slab__grade">
          <span className="slab__gradeword">GEM MT</span>
          <span className="slab__gradenum">10</span>
        </div>
        <span className="slab__barcode" aria-hidden="true" />
      </div>
      <div className="slab__window">
        <img className="slab__art" src={src} alt={alt} width={mini ? 150 : 300} height={mini ? 200 : 400} />
        <span className="slab__glare" aria-hidden="true" />
        {mini && (
          // The foil sweep, on the page only (not in the enlarged view).
          <span className="cardframe__foil" aria-hidden="true">
            <span />
          </span>
        )}
      </div>
    </div>
  );
}
