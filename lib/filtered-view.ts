// Is this list URL a filtered view?
//
// A filtered list is the same rows in another order, and the monster list's
// filters multiply into more URLs than this site has pages: element × race ×
// size × level band × HP band × page × sort. Google following all of them
// spends the crawl budget on duplicates of one page (owner, 18 Sep 2026:
// "ไม่อยากให้เก็บแบบเก็บไปเรื่อยแบบนั้น").
//
// So the bare list stays indexable and every filtered view says noindex,
// follow -- followable because the facet chips are links, and a crawler that
// stops following them stops discovering the monster pages behind them.
//
// It lives here rather than inside the page so it can be tested: the failure
// mode is silent (a page that quietly stops being indexed, or a filter that
// quietly starts being indexed) and nothing on screen would show it.

/** Params that mean the reader narrowed or paged the list. */
export const LIST_FILTER_PARAMS = [
  'q',
  'race',
  'element',
  'size',
  'aggro',
  'mvp',
  'lvmin',
  'lvmax',
  'hpmin',
  'hpmax',
  'card',
  'mode',
  'page',
  'sort',
] as const;

export function isFilteredView(
  searchParams: Record<string, string | string[] | undefined>,
  params: readonly string[] = LIST_FILTER_PARAMS,
): boolean {
  return params.some((key) => {
    const value = searchParams[key];
    // An empty value is what an unused <select> submits: ?race= is the plain
    // list, not a filtered one.
    if (Array.isArray(value)) return value.some((v) => v !== '');
    return typeof value === 'string' && value !== '';
  });
}
