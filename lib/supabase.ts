import { createClient } from '@supabase/supabase-js';

export function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }
  return createClient(url, key);
}

// Every read the site makes, server side only (owner, 12 Oct 2026). The
// browser used to query Supabase itself with the anon key, which meant the
// key sat in every page and anyone could pull every table over REST without
// touching the site. Reads now happen here (pages at build/ISR time, and the
// /api/search, /api/monster and /api/feedback routes for the three client
// components), so the anon role can lose its read policies.
//
// The service-role key is preferred. The anon key is only a fallback for a
// deploy that runs before SUPABASE_SERVICE_ROLE_KEY is set; once the anon
// read policies are dropped (supabase/sql/close-anon-reads.sql), that
// fallback reads nothing.
export function supabaseRead() {
  if (typeof window !== 'undefined') {
    throw new Error('supabaseRead is server-only: call an /api route from the browser');
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }
  return createClient(url, key, {
    auth: { persistSession: false },
    global: {
      // Next 14 refuses to cache any fetch carrying an Authorization header,
      // which supabase-js always sends — that silently forced every page to
      // no-store and defeated page-level `revalidate` (ISR). Game data only
      // changes on import, and every import ends in a redeploy that busts
      // this cache, so a day-long window is safe.
      fetch: (input, init) =>
        fetch(input, { ...init, next: { revalidate: 86400 } } as RequestInit),
    },
  });
}
