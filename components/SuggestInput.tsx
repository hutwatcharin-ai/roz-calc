'use client';

// A search box with the arcade "SELECT ..." suggestion panel under it.
//
// First built for monsters (owner's pick B, 1 Oct 2026, from
// public/draft/monster-suggest) to replace a native <datalist>, which could
// show no sprite and only filled the box. The owner then asked for the same
// box on the item, card, equipment and costume lists.
//
// - Picking a row (click, or arrows then Enter) opens that row's page.
// - Enter with no row picked still submits the form, so the box filters the
//   list exactly as it always did.
// - Rows come either with the page (`entries`, the ~340 monsters) or from a
//   cached JSON fetched the first time the box is focused (`src`, the lists
//   with thousands of rows), so a page that is only browsed pays nothing.

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { highlightParts, rankSuggestions, type SuggestEntry } from '@/lib/suggest';
import { ELEMENT_COLOUR } from '@/lib/element-colour';

function Marked({ text, query }: { text: string; query: string }) {
  const [before, hit, after] = highlightParts(text, query);
  return (
    <>
      {before}
      {hit && <mark>{hit}</mark>}
      {after}
    </>
  );
}

export default function SuggestInput({
  entries,
  src,
  heading,
  defaultValue,
  placeholder,
  listLabel,
  look = 'sprite',
}: {
  entries?: SuggestEntry[];
  src?: string;
  heading: string;
  defaultValue: string;
  placeholder: string;
  listLabel: string;
  /** How to draw the picture: a monster sprite, a 24px item icon, or a portrait card. */
  look?: 'sprite' | 'icon' | 'art';
}) {
  const listId = useId();
  const router = useRouter();
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [loaded, setLoaded] = useState<SuggestEntry[] | null>(entries ?? null);
  const [wanted, setWanted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // The input is uncontrolled so a word typed before the page finished
  // loading is not wiped when React takes over; pick it up here.
  useEffect(() => {
    const el = inputRef.current;
    if (el && el.value !== defaultValue) {
      setValue(el.value);
      if (document.activeElement === el) {
        setWanted(true);
        setOpen(true);
      }
    }
    // Once, on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!wanted || loaded || !src) return;
    let cancelled = false;
    fetch(src)
      .then((r) => (r.ok ? r.json() : []))
      .then((rows: SuggestEntry[]) => {
        if (!cancelled) setLoaded(rows);
      })
      // No list is not an error the reader needs to see: the box still
      // submits and filters the page as before.
      .catch(() => {
        if (!cancelled) setLoaded([]);
      });
    return () => {
      cancelled = true;
    };
  }, [wanted, loaded, src]);

  const hits = useMemo(() => (loaded ? rankSuggestions(loaded, value) : []), [loaded, value]);
  const shown = open && hits.length > 0;

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      if (!hits.length) return;
      event.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, hits.length - 1));
    } else if (event.key === 'ArrowUp') {
      if (!shown) return;
      event.preventDefault();
      setActive((i) => Math.max(i - 1, -1));
    } else if (event.key === 'Enter') {
      if (shown && active >= 0) {
        event.preventDefault();
        setOpen(false);
        router.push(hits[active].entry.href);
      }
    } else if (event.key === 'Escape') {
      if (shown) {
        event.preventDefault();
        setOpen(false);
        setActive(-1);
      }
    }
  }

  return (
    <div className={`msug msug--${look}`}>
      <input
        type="search"
        name="q"
        ref={inputRef}
        defaultValue={defaultValue}
        onChange={(event) => {
          setValue(event.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onFocus={() => {
          setWanted(true);
          setOpen(true);
        }}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={shown}
        aria-controls={listId}
        aria-activedescendant={shown && active >= 0 ? `${listId}-${active}` : undefined}
      />
      {shown && (
        // mousedown is cancelled so a click lands before the input's blur
        // closes the list.
        <div className="msug__panel" onMouseDown={(event) => event.preventDefault()}>
          <p className="msug__hd" aria-hidden="true">{heading}</p>
          <ul id={listId} role="listbox" aria-label={listLabel} className="msug__list">
            {hits.map(({ entry: e, via }, i) => (
              <li key={e.id} id={`${listId}-${i}`} role="option" aria-selected={i === active}>
                <Link
                  href={e.href}
                  className={'msug__it' + (i === active ? ' is-on' : '')}
                  style={e.el && ELEMENT_COLOUR[e.el] ? { ['--el' as string]: ELEMENT_COLOUR[e.el] } : undefined}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => setOpen(false)}
                  tabIndex={-1}
                >
                  <span className="msug__cur" aria-hidden="true">▶</span>
                  <span className="msug__sprite">
                    {e.sprite ? <img src={e.sprite} alt="" loading="lazy" decoding="async" /> : <span className="msug__none">?</span>}
                  </span>
                  <span className="msug__nm">
                    <Marked text={e.label} query={value} />
                    {(via || e.sub) && (
                      <small>
                        {via && <><Marked text={via} query={value} />{e.sub ? ' · ' : ''}</>}
                        {e.sub}
                      </small>
                    )}
                  </span>
                  <span className="msug__side">
                    {e.lv != null && <span className="msug__lv"><i>LV</i>{e.lv}</span>}
                    {e.tag === 'mvp' ? <span className="msug__tag">★ MVP</span> : e.tag === 'mini' ? <span className="msug__tag msug__tag--mini">MINI BOSS</span> : null}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <button type="submit" className="msug__all">
            PRESS <b>ENTER</b> · ดูทั้งหมดที่มี &ldquo;{value.trim()}&rdquo;
          </button>
        </div>
      )}
    </div>
  );
}
