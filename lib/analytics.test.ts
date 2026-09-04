// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  applyInternalParam,
  contentGroupFor,
  INTERNAL_KEY,
  reportToolUse,
  resetToolUse,
  sanitizeParams,
  track,
} from './analytics';

let calls: unknown[][];

beforeEach(() => {
  calls = [];
  window.gtag = (...args: unknown[]) => {
    calls.push(args);
  };
  localStorage.clear();
  resetToolUse();
});

afterEach(() => {
  delete window.gtag;
});

describe('contentGroupFor', () => {
  it('maps every section of the site to one of five groups', () => {
    expect(contentGroupFor('/')).toBe('home');
    expect(contentGroupFor('/database/monsters/1002')).toBe('database');
    expect(contentGroupFor('/drop-finder')).toBe('database');
    expect(contentGroupFor('/tools/refine')).toBe('tools');
    expect(contentGroupFor('/guides/exp')).toBe('guides');
    expect(contentGroupFor('/news/patch-2026-09-03')).toBe('news');
    expect(contentGroupFor('/about')).toBe('other');
  });
});

describe('sanitizeParams', () => {
  it('drops empty values and cuts strings at the 100-char GA4 limit', () => {
    const long = 'x'.repeat(150);
    expect(sanitizeParams({ a: 1, b: undefined, c: null, d: long, e: false })).toEqual({
      a: 1,
      d: 'x'.repeat(100),
      e: false,
    });
  });
});

describe('track', () => {
  it('sends the event through gtag with its params', () => {
    expect(track('search', { search_term: 'poring', result_count: 3 })).toBe(true);
    expect(calls).toEqual([['event', 'search', { search_term: 'poring', result_count: 3 }]]);
  });

  it('is a no-op without gtag on the page', () => {
    delete window.gtag;
    expect(track('search', { search_term: 'poring' })).toBe(false);
    expect(calls).toEqual([]);
  });
});

describe('reportToolUse', () => {
  it('fires once per tool per page, however many times it is asked', () => {
    expect(reportToolUse('refine', { target: 7 }, '/tools/refine')).toBe(true);
    expect(reportToolUse('refine', { target: 8 }, '/tools/refine')).toBe(false);
    expect(reportToolUse('refine', { target: 9 }, '/tools/refine')).toBe(false);
    expect(calls).toEqual([['event', 'tool_use', { tool: 'refine', target: 7 }]]);
  });

  it('fires again on another page, and for another tool on the same page', () => {
    reportToolUse('refine', {}, '/tools/refine');
    reportToolUse('refine', {}, '/tools/refine?x=1');
    reportToolUse('damage', {}, '/tools/refine');
    expect(calls.map((c) => c[2])).toEqual([{ tool: 'refine' }, { tool: 'refine' }, { tool: 'damage' }]);
  });
});

describe('applyInternalParam', () => {
  it('?internal=1 flags the browser and tells gtag, ?internal=0 clears it', () => {
    expect(applyInternalParam('1', localStorage)).toBe(true);
    expect(localStorage.getItem(INTERNAL_KEY)).toBe('1');
    expect(calls).toEqual([['set', { traffic_type: 'internal' }]]);

    expect(applyInternalParam('0', localStorage)).toBe(false);
    expect(localStorage.getItem(INTERNAL_KEY)).toBeNull();
  });

  it('leaves the flag alone when the param is absent', () => {
    localStorage.setItem(INTERNAL_KEY, '1');
    expect(applyInternalParam(null, localStorage)).toBe(true);
    expect(localStorage.getItem(INTERNAL_KEY)).toBe('1');
    expect(calls).toEqual([]);
  });
});
