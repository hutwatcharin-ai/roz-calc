import { createClient } from '@supabase/supabase-js';

export function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }
  return createClient(url, key);
}

export function supabaseBrowser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }
  return createClient(url, key, {
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
