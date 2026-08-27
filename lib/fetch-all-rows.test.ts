import { describe, it, expect } from 'vitest';
import { fetchAllRows, FETCH_PAGE_SIZE } from './fetch-all-rows';

function fakeTable(rowCount: number) {
  const calls: Array<[number, number]> = [];
  const rows = Array.from({ length: rowCount }, (_, i) => ({ id: i }));
  const page = async (from: number, to: number) => {
    calls.push([from, to]);
    return { data: rows.slice(from, to + 1), error: null };
  };
  return { calls, page };
}

describe('fetchAllRows', () => {
  it('returns every row when the table is larger than one page', async () => {
    // 1,300 is the real `items` count -- a bare .select() returns 1,000 of them
    // and reports no error, which is how this bug hides.
    const table = fakeTable(1300);
    const { data, error } = await fetchAllRows(table.page);
    expect(error).toBeNull();
    expect(data).toHaveLength(1300);
    expect(data?.[1299]).toEqual({ id: 1299 });
  });

  it('asks for contiguous, non-overlapping ranges', async () => {
    const table = fakeTable(1300);
    await fetchAllRows(table.page);
    expect(table.calls).toEqual([
      [0, FETCH_PAGE_SIZE - 1],
      [FETCH_PAGE_SIZE, FETCH_PAGE_SIZE * 2 - 1],
    ]);
  });

  it('stops on a short page instead of asking forever', async () => {
    const table = fakeTable(10);
    const { data } = await fetchAllRows(table.page);
    expect(data).toHaveLength(10);
    expect(table.calls).toHaveLength(1);
  });

  it('stops when an exactly-full last page is followed by an empty one', async () => {
    const table = fakeTable(FETCH_PAGE_SIZE);
    const { data } = await fetchAllRows(table.page);
    expect(data).toHaveLength(FETCH_PAGE_SIZE);
    expect(table.calls).toHaveLength(2);
  });

  it('returns no data at all on error, never a partial list', async () => {
    // A partial list is worse than none: the caller cannot tell it is partial,
    // which is the exact failure this helper exists to prevent.
    let call = 0;
    const { data, error } = await fetchAllRows<{ id: number }>(async () => {
      call += 1;
      if (call === 1) {
        return { data: Array.from({ length: FETCH_PAGE_SIZE }, (_, i) => ({ id: i })), error: null };
      }
      return { data: null, error: { message: 'boom' } as any };
    });
    expect(error?.message).toBe('boom');
    expect(data).toBeNull();
  });
});
