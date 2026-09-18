'use client';

// The monster-name box, with the names in it.
//
// Typing "po" and being shown Poring, Poporing, Pouring is the one thing the
// owner asked for here (18 Sep 2026). It is a native <datalist>, not a
// dropdown we draw: the browser's own list is keyboard-accessible, works on
// a phone, and needs no library.
//
// The names ship with the page rather than being queried per keystroke. The
// list is 355 monsters, 6.9 KB before compression -- one payload instead of
// one request per letter, and nothing to debounce.
//
// The box still submits whatever is typed: the list is a suggestion, not a
// whitelist, so a Thai name or a partial word keeps working through the
// existing search.
import { useId } from 'react';

export default function MonsterNameInput({ names, defaultValue }: { names: string[]; defaultValue: string }) {
  const listId = useId();
  return (
    <>
      <input
        type="search"
        name="q"
        list={listId}
        defaultValue={defaultValue}
        placeholder="เช่น Poring, โพริง, Mummy"
        autoComplete="off"
      />
      <datalist id={listId}>
        {names.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>
    </>
  );
}
