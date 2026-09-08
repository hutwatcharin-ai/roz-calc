// Costumes that come in a (Bound) copy.
//
// A Bound costume is the same look as the normal one, account-bound and not
// tradeable. There are 682 of them against 940 free costumes, so with both
// shown the list is mostly duplicates -- which is why they were deleted
// outright on 31 Aug. They are back (7 Sep) because deleting them made the
// database wrong, and the list hides them behind a checkbox instead.

const BOUND = /[([]Bound[)\]]\s*$/i;

export function isBound(name: string): boolean {
  return BOUND.test(name.trim());
}

/** The normal costume's name, for pairing a Bound copy with its twin. */
export function withoutBound(name: string): string {
  return name.replace(/\s*[([]Bound[)\]]\s*$/i, '').trim();
}
