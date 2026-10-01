'use client';

// The monster-name box, with the monsters in it.
//
// Typing "po" and being shown Poring, Poporing, Pouring was the first ask
// (18 Sep 2026), done with a native <datalist>. On 1 Oct 2026 the owner
// asked for the sprite in each row and for a pick to open the monster rather
// than fill the box and wait for another press of ค้นหา; a datalist can do
// neither, so this is a combobox we draw, in the arcade "select monster"
// look the owner chose (pick B, public/draft/monster-suggest).
//
// - Picking a row (click, or arrows then Enter) opens that monster's page.
// - Enter with no row picked still submits the form: the box filters the
//   list exactly as before, so "mum" keeps listing every mummy.
// - The monsters ship with the page (~355 rows); sprites load only for the
//   few rows on screen.

import { useId, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { highlightParts, rankSuggestions, type SuggestMonster } from '@/lib/monster-suggest';
import { ELEMENT_COLOUR, ELEMENT_COLOUR_UNKNOWN } from '@/lib/element-colour';

const href = (id: number) => `/database/monsters/${id}`;

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

export default function MonsterNameInput({ monsters, defaultValue }: { monsters: SuggestMonster[]; defaultValue: string }) {
  const listId = useId();
  const router = useRouter();
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  const hits = useMemo(() => rankSuggestions(monsters, value), [monsters, value]);
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
        router.push(href(hits[active].monster.id));
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
    <div className="msug">
      <input
        ref={inputRef}
        type="search"
        name="q"
        value={value}
        onChange={(event) => {
          setValue(event.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
        placeholder="เช่น Poring, บาโฟ, Mummy"
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
          <p className="msug__hd" aria-hidden="true">SELECT MONSTER</p>
          <ul id={listId} role="listbox" aria-label="มอนสเตอร์ที่ตรงกับคำค้น" className="msug__list">
            {hits.map(({ monster: m, via }, i) => (
              <li key={m.id} id={`${listId}-${i}`} role="option" aria-selected={i === active}>
                <Link
                  href={href(m.id)}
                  className={'msug__it' + (i === active ? ' is-on' : '')}
                  style={{ ['--el' as string]: ELEMENT_COLOUR[m.elementKey] ?? ELEMENT_COLOUR_UNKNOWN }}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => setOpen(false)}
                  tabIndex={-1}
                >
                  <span className="msug__cur" aria-hidden="true">▶</span>
                  <span className="msug__sprite">
                    {m.sprite && <img src={m.sprite} alt="" loading="lazy" decoding="async" />}
                  </span>
                  <span className="msug__nm">
                    <Marked text={m.label} query={value} />
                    <small>
                      {via && <><Marked text={via} query={value} /> · </>}
                      {[m.race, m.element].filter(Boolean).join(' · ')}
                    </small>
                  </span>
                  <span className="msug__side">
                    <span className="msug__lv"><i>LV</i>{m.level}</span>
                    {m.mvp ? <span className="msug__tag">★ MVP</span> : m.mini ? <span className="msug__tag msug__tag--mini">MINI BOSS</span> : null}
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
