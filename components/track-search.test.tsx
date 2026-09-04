// The search event fires once per term, not once per render -- paging through
// results for the same word must not count as a second search.
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import TrackSearch from './TrackSearch';

let container: HTMLDivElement;
let root: Root;
let calls: unknown[][];

beforeEach(() => {
  calls = [];
  window.gtag = (...args: unknown[]) => {
    calls.push(args);
  };
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  delete window.gtag;
});

describe('TrackSearch', () => {
  it('reports the term, the count and where it was searched', () => {
    window.history.replaceState(null, '', '/database/monsters?q=poring');
    act(() => root.render(<TrackSearch term="poring" count={3} />));
    expect(calls).toEqual([['event', 'search', { search_term: 'poring', result_count: 3, source: 'monsters' }]]);
  });

  it('does not repeat for the same term, and fires again for a new one', () => {
    window.history.replaceState(null, '', '/database/items?q=ore');
    act(() => root.render(<TrackSearch term="ore" count={12} />));
    act(() => root.render(<TrackSearch term="ore" count={12} />));
    expect(calls).toHaveLength(1);
    act(() => root.render(<TrackSearch term="oridecon" count={0} />));
    expect(calls).toHaveLength(2);
    expect(calls[1][2]).toEqual({ search_term: 'oridecon', result_count: 0, source: 'items' });
  });

  it('stays silent with no term', () => {
    act(() => root.render(<TrackSearch term="" count={524} />));
    expect(calls).toEqual([]);
  });
});
