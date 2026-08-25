'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { supabaseBrowser } from '@/lib/supabase';
import { mergeSearchResults, type SearchResult } from '@/lib/search';

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === 'Escape') {
        setOpen(false);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    } else {
      setQuery('');
      setResults([]);
    }
  }, [open]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      const db = supabaseBrowser();
      const [{ data: monsters, error: monstersError }, { data: items, error: itemsError }] = await Promise.all([
        db.from('monsters').select('id, name_en, image_url').ilike('name_en', `%${query}%`).limit(5),
        db.from('items').select('id, name_en, icon_url').ilike('name_en', `%${query}%`).limit(5),
      ]);

      if (monstersError) console.error('global search: monsters query failed', monstersError);
      if (itemsError) console.error('global search: items query failed', itemsError);

      setResults(mergeSearchResults(monsters ?? [], items ?? []));
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'var(--panel)',
          border: '1px solid var(--hair)',
          borderRadius: 6,
          color: 'var(--faint)',
          padding: '8px 12px',
          cursor: 'pointer',
          fontSize: 13,
        }}
      >
        ค้นหา
        <span className="mono" style={{ fontSize: 11, opacity: 0.7 }}>
          Ctrl+K
        </span>
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            paddingTop: '12vh',
            zIndex: 100,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="card"
            style={{ width: 'min(560px, 92vw)', padding: 0, overflow: 'hidden' }}
          >
            <input
              ref={inputRef}
              className="mono"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ค้นมอนสเตอร์หรือไอเทม..."
              style={{
                width: '100%',
                padding: '14px 16px',
                background: 'transparent',
                border: 'none',
                borderBottom: '1px solid var(--hair)',
                color: 'var(--text)',
                fontSize: 15,
                outline: 'none',
              }}
            />

            <div style={{ maxHeight: '50vh', overflowY: 'auto' }}>
              {loading && (
                <p style={{ padding: '14px 16px', color: 'var(--faint)', margin: 0 }}>กำลังค้นหา...</p>
              )}
              {!loading && query.trim() && results.length === 0 && (
                <p style={{ padding: '14px 16px', color: 'var(--faint)', margin: 0 }}>ไม่พบผลลัพธ์</p>
              )}
              {results.map((r) => (
                <Link
                  key={`${r.type}-${r.id}`}
                  href={r.href}
                  onClick={() => setOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 16px',
                    borderBottom: '1px solid var(--hair)',
                    color: 'var(--text)',
                    textDecoration: 'none',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {r.iconUrl && (
                      <img src={r.iconUrl} alt="" width={20} height={20} style={{ imageRendering: 'pixelated' }} />
                    )}
                    {r.name}
                  </span>
                  <span
                    className="mono"
                    style={{
                      fontSize: 10,
                      color: r.type === 'monster' ? 'var(--yellow)' : 'var(--pink)',
                      border: '1px solid var(--hair)',
                      borderRadius: 4,
                      padding: '2px 6px',
                    }}
                  >
                    {r.type === 'monster' ? 'มอนสเตอร์' : 'ไอเทม'}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
