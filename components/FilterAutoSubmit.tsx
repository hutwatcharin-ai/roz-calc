'use client';

// Picking a value from a filter submits the form.
//
// Every list page asks the reader to choose a race, then a size, then press
// ค้นหา -- a step nobody expects any more, and the one place this site still
// behaves like a 2005 form. The button stays: it is what a keyboard user
// presses after typing, what a reader without JavaScript uses, and the only
// way to submit the text box.
//
// A listener on the form rather than a prop on each control: the controls are
// server-rendered in thirteen pages, and this adds the behaviour without
// turning any of them into client components.
import { useEffect, useRef } from 'react';

export default function FilterAutoSubmit() {
  const anchor = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const form = anchor.current?.closest('form');
    if (!form) return;
    function onChange(event: Event) {
      const target = event.target as HTMLElement | null;
      // Only the pickers. A text box firing "change" on blur would submit the
      // page while the reader is still deciding, and a number field would
      // submit on every arrow-key step.
      if (!target) return;
      const isSelect = target instanceof HTMLSelectElement;
      const isCheckbox = target instanceof HTMLInputElement && target.type === 'checkbox';
      if (!isSelect && !isCheckbox) return;
      form!.requestSubmit();
    }
    // A GET form sends every control, so one pick produced
    // ?q=&race=&element=Fire&size=&aggro=&... -- a URL nobody can read and
    // one that made the page look filtered by things it was not. Empty
    // controls are disabled for the instant of the submit, which is how a
    // browser is told to leave them out, then put back.
    function onSubmit() {
      const emptied: (HTMLInputElement | HTMLSelectElement)[] = [];
      for (const el of Array.from(form!.elements)) {
        const control = el as HTMLInputElement | HTMLSelectElement;
        if (!control.name || control.disabled) continue;
        if (control instanceof HTMLInputElement && (control.type === 'checkbox' || control.type === 'radio')) continue;
        // data-default marks a control whose default value says nothing: the
        // sort select always has a value, and carrying ?sort=level on every
        // link made an ordinary browse look like a filtered view.
        const omitValue = (control as HTMLElement).dataset?.default;
        if (control.value === '' || (omitValue !== undefined && control.value === omitValue)) {
          control.disabled = true;
          emptied.push(control);
        }
      }
      // Re-enabled after the browser has read the form, so the page the
      // reader is still looking at keeps working if navigation is slow.
      setTimeout(() => {
        for (const control of emptied) control.disabled = false;
      }, 0);
    }

    form.addEventListener('change', onChange);
    form.addEventListener('submit', onSubmit);
    return () => {
      form.removeEventListener('change', onChange);
      form.removeEventListener('submit', onSubmit);
    };
  }, []);

  return <span ref={anchor} hidden aria-hidden="true" />;
}
