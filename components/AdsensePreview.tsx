// Where AdSense units would sit, drawn as labelled boxes so the owner can
// judge the positions before any Google code goes near the site (23 Sep 2026).
//
// Nothing renders unless NEXT_PUBLIC_ADS_PREVIEW=1, which is set on the local
// machine only: production must not show boxes for ads that do not exist.
// When AdSense is approved this component is what gets replaced by the real
// unit, so the positions decided here are the positions that ship.

const ON = process.env.NEXT_PUBLIC_ADS_PREVIEW === '1';

const SIZES: Record<string, { wide: [number, number]; narrow: [number, number] }> = {
  rectangle: { wide: [336, 280], narrow: [300, 250] },
  banner: { wide: [728, 90], narrow: [320, 100] },
};

export default function AdsensePreview({ size, where }: { size: keyof typeof SIZES; where: string }) {
  if (!ON) return null;
  const box = SIZES[size];
  const style = {
    '--ad-w': `${box.wide[0]}px`,
    '--ad-h': `${box.wide[1]}px`,
    '--ad-narrow-w': `${box.narrow[0]}px`,
    '--ad-narrow-h': `${box.narrow[1]}px`,
  } as React.CSSProperties;
  return (
    <aside className="adslot adslot--inline adslot--adsense" style={style} aria-label="ตัวอย่างตำแหน่ง AdSense">
      <span className="adslot__tag">โฆษณา</span>
      <span className="adslot__house adslot__adsense">
        <strong>AdSense</strong>
        <span>{where}</span>
        <em>{box.wide[0]}×{box.wide[1]} · มือถือ {box.narrow[0]}×{box.narrow[1]}</em>
      </span>
    </aside>
  );
}
