// Escapes Postgres ILIKE/LIKE metacharacters (%, _) and the escape character
// itself (\) so a search string built from user input is matched literally
// instead of as a wildcard pattern -- without this, a search for a lone "%"
// returns every row in the table. Backslash is Postgres's default LIKE
// escape character, so it is included in the character class too: a single
// pass over the original string escapes each character exactly once, so a
// backslash the user typed is escaped like any other metacharacter rather
// than being read back as an escape itself.
//
// Shared by app/database/maps/page.tsx and components/GlobalSearch.tsx, the
// two places that build an ilike() pattern from a raw query string.
export function escapeLikePattern(q: string): string {
  return q.replace(/[\\%_]/g, (ch) => `\\${ch}`);
}
