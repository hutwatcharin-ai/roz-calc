import { supabaseBrowser } from '@/lib/supabase';

// Newest updated_at across the three tables whose rows change when the game
// data does. Read as a freshness signal, not a claim -- if the column stops
// being maintained this stops advancing too, which is the point. Rendered on
// every page via the footer, so a Supabase blip must degrade to "no line",
// never to a failed render.
export async function getLastUpdated(): Promise<string | null> {
  try {
    const db = supabaseBrowser();
    const [m, i, q] = await Promise.all([
      db.from('monsters').select('updated_at').order('updated_at', { ascending: false }).limit(1).maybeSingle(),
      db.from('items').select('updated_at').order('updated_at', { ascending: false }).limit(1).maybeSingle(),
      db.from('quests').select('updated_at').order('updated_at', { ascending: false }).limit(1).maybeSingle(),
    ]);
    const dates = [m.data?.updated_at, i.data?.updated_at, q.data?.updated_at].filter((d): d is string => Boolean(d));
    if (dates.length === 0) return null;
    return dates.sort().at(-1) ?? null;
  } catch {
    return null;
  }
}
