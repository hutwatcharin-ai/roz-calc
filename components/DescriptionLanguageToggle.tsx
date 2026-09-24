'use client';

// Thai by default, with a switch back to English.
//
// The switch exists because our wording and the game's will not always match,
// and a player who learned the English text in-game needs to compare. Both
// versions are rendered on the server and passed in, so no dictionary reaches
// the browser and switching costs nothing.

import { useEffect, useState } from 'react';
import { isSpacerLine, segments } from '@/lib/color-codes';

const STORAGE_KEY = 'roz-calc:description-language';

export default function DescriptionLanguageToggle({
  thaiLines,
  englishLines,
}: {
  thaiLines: string[];
  englishLines: string[];
}) {
  const [showEnglish, setShowEnglish] = useState(false);

  // Read after mount, never during render: the server and the first client
  // render must produce identical markup or React reports a hydration mismatch.
  useEffect(() => {
    try {
      setShowEnglish(window.localStorage.getItem(STORAGE_KEY) === 'en');
    } catch {
      // Storage can throw outright in private mode. The default stands.
    }
  }, []);

  function choose(english: boolean) {
    setShowEnglish(english);
    try {
      window.localStorage.setItem(STORAGE_KEY, english ? 'en' : 'th');
    } catch {
      // Not remembering the choice is survivable; failing the page is not.
    }
  }

  const lines = showEnglish ? englishLines : thaiLines;

  return (
    <>
      <div className="lang-toggle">
        <button type="button" className={showEnglish ? undefined : 'on'} onClick={() => choose(false)}>
          ไทย
        </button>
        <button type="button" className={showEnglish ? 'on' : undefined} onClick={() => choose(true)}>
          English
        </button>
      </div>
      {/* Lines may carry the client's ^RRGGBB codes (the game's own Thai
          text does); they render as tones, never as raw codes. */}
      <div className="gametext">
        {lines.map((line, i) =>
          isSpacerLine(line) ? (
            <div key={i} className="gametext__gap" aria-hidden="true" />
          ) : (
            <p key={i}>
              {segments(line).map((seg, j) =>
                seg.href ? (
                  <a key={j} href={seg.href} className="gametext__navi">{seg.text}</a>
                ) : (
                  <span key={j} className={seg.tone === 'default' ? undefined : `gametext__${seg.tone}`}>{seg.text}</span>
                ),
              )}
            </p>
          ),
        )}
      </div>
    </>
  );
}
