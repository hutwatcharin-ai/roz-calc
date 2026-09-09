// The bug this module exists for was invisible from the outside: the query
// ran, returned rows, and only dropped the ones that matched by name. So the
// test asserts the shape of the filter string, which is the part that was
// wrong, and each case names the failure it guards.
import { describe, it, expect } from 'vitest';
import { nameOrIdsFilter } from '@/lib/name-search';

describe('nameOrIdsFilter', () => {
  it('uses a real wildcard, not a URL-encoded one', () => {
    // %25 is a percent that has already been encoded once. PostgREST reads it
    // literally inside an or= string, so the clause matched nothing and the
    // search returned its alias hits alone.
    const filter = nameOrIdsFilter('name_en', 'wolf', [1107]);
    expect(filter).toBe('and(name_en.ilike."%wolf%"),id.in.(1107)');
    expect(filter).not.toContain('%25');
  });

  it('ANDs the words, the same as the path without aliases', () => {
    expect(nameOrIdsFilter('name_en', 'orc archer', [1])).toBe(
      'and(name_en.ilike."%orc%",name_en.ilike."%archer%"),id.in.(1)',
    );
  });

  it('survives punctuation, whichever layer removes it', () => {
    // searchWords splits on commas and brackets today, so they never reach
    // the filter. Unquoted they would have made PostgREST answer "failed to
    // parse logic tree" and the page render its error state, so the quoting
    // here means that stays true if normalisation ever changes.
    expect(nameOrIdsFilter('name_en', 'a,b', [1])).toBe(
      'and(name_en.ilike."%a%",name_en.ilike."%b%"),id.in.(1)',
    );
    expect(nameOrIdsFilter('name_en', '(x)', [1])).toBe('and(name_en.ilike."%x%"),id.in.(1)');
  });

  it('escapes a LIKE wildcard the reader typed', () => {
    // % is not punctuation searchWords strips, so this one does reach the
    // filter: unescaped it would turn "100%" into a match-anything.
    // Two backslashes on the wire: escapeLikePattern adds one so LIKE reads a
    // literal percent, and the quoting escapes that backslash so the quoted
    // value carries it through intact.
    expect(nameOrIdsFilter('name_en', '100%', [])).toBe(String.raw`and(name_en.ilike."%100\\%%")`);
  });

  it('leaves out the half it does not have', () => {
    expect(nameOrIdsFilter('name_en', 'wolf', [])).toBe('and(name_en.ilike."%wolf%")');
    expect(nameOrIdsFilter('name_en', '', [7])).toBe('id.in.(7)');
    expect(nameOrIdsFilter('name_en', '', [])).toBeNull();
  });
});
