'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { supabaseBrowser } from '@/lib/supabase';
import { mergeSearchResults, SEARCH_TYPE_LABELS, type SearchResult } from '@/lib/search';
import { escapeLikePattern } from '@/lib/like-escape';

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  // True when at least one of the six underlying queries failed. A partial
  // list must never present itself as complete -- a player typing "prontera"
  // during a maps outage still sees monster/item hits, but the box has to
  // say a category could not be searched instead of implying maps simply has
  // no match.
  const [hasError, setHasError] = useState(false);
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
      setHasError(false);
    }
  }, [open]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setHasError(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      const db = supabaseBrowser();
      const needle = escapeLikePattern(query);

      const [monsters, items, cards, equipment, skills, maps] = await Promise.all([
        db.from('monsters').select('id, name_en, image_url').ilike('name_en', `%${needle}%`).limit(5),
        // Items excludes cards and equipment so the same row cannot appear
        // twice under two different badges.
        db.from('items').select('id, name_en, icon_url')
          .not('category', 'in', '("Card","Armor","Weapon","Costume Equipment")')
          .ilike('name_en', `%${needle}%`).limit(5),
        db.from('items').select('id, name_en, icon_url').eq('category', 'Card').ilike('name_en', `%${needle}%`).limit(5),
        db.from('items').select('id, name_en, icon_url')
          .in('category', ['Armor', 'Weapon', 'Costume Equipment'])
          .ilike('name_en', `%${needle}%`).limit(5),
        // classes is fetched so mergeSearchResults can route a skill to the
        // tab it actually lives on (isInGameSkill(classes)) instead of always
        // landing on the default "ingame" tab, which 511 of 851 skills fail.
        db.from('skills').select('slug, name, icon_url, classes').ilike('name', `%${needle}%`).limit(5),
        // map_stats is one row per map already, so no de-duplication is needed
        // here the way monster_spawns would have required.
        db.from('map_stats').select('map_code, map_display_name').ilike('search_text', `%${needle}%`).limit(5),
      ]);

      if (monsters.error) console.error('global search: monsters query failed', monsters.error);
      if (items.error) console.error('global search: items query failed', items.error);
      if (cards.error) console.error('global search: cards query failed', cards.error);
      if (equipment.error) console.error('global search: equipment query failed', equipment.error);
      if (skills.error) console.error('global search: skills query failed', skills.error);
      if (maps.error) console.error('global search: maps query failed', maps.error);

      setHasError(
        Boolean(
          monsters.error || items.error || cards.error || equipment.error || skills.error || maps.error,
        ),
      );
      setResults(
        mergeSearchResults({
          monsters: monsters.data ?? [],
          items: items.data ?? [],
          cards: cards.data ?? [],
          equipment: equipment.data ?? [],
          skills: skills.data ?? [],
          maps: maps.data ?? [],
        }),
      );
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
        <span className="mono kbd-hint" style={{ fontSize: 12, opacity: 0.7 }} aria-hidden="true">
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
              placeholder="ค้นทุกอย่างในฐานข้อมูล..."
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
              {/* A failed category must not read as "nothing there" -- results
                  from the categories that succeeded are still shown below,
                  but the list is flagged as incomplete rather than complete. */}
              {!loading && hasError && (
                <p style={{ padding: '10px 16px', color: 'var(--faint)', margin: 0, borderBottom: '1px solid var(--hair)' }}>
                  ค้นบางหมวดไม่สำเร็จ ผลลัพธ์ด้านล่างอาจไม่ครบ
                </p>
              )}
              {!loading && query.trim() && results.length === 0 && (
                <p style={{ padding: '14px 16px', color: 'var(--faint)', margin: 0 }}>
                  {hasError ? 'ค้นหาไม่สำเร็จ ลองใหม่อีกครั้ง' : 'ไม่พบผลลัพธ์'}
                </p>
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
                      color: 'var(--faint)',
                      border: '1px solid var(--hair)',
                      borderRadius: 4,
                      padding: '2px 6px',
                    }}
                  >
                    {SEARCH_TYPE_LABELS[r.type]}
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
