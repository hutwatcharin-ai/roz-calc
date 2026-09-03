// Shared data loading for the two wearable detail routes (gear and costumes).
// Both render the same body from the same row; only the section they sit under
// differs, so the queries live here rather than being copied per route.

import { cache } from 'react';
import { supabaseBrowser } from './supabase';
import { fetchAllRows } from './fetch-all-rows';

// Cached so generateMetadata and the page body cost one query, not two.
// Returns the raw { data, error } -- each caller keeps its own handling, and a
// failed query must never be flattened into "no such row".
export const getGearItem = cache(async (id: number) => {
  return await supabaseBrowser().from('items').select('*').eq('id', id).maybeSingle();
});

export interface GearExtras {
  droppedBy: any[] | null;
  droppedByError: boolean;
  dict: {
    lines: Map<string, string>;
    terms: Map<string, string | null>;
  };
}

export async function loadGearExtras(id: number): Promise<GearExtras> {
  const db = supabaseBrowser();

  const { data: droppedBy, error: droppedByError } = await db
    .from('monster_drops')
    .select('rate, monsters(id, name_en, image_url, level)')
    .eq('item_id', id)
    .order('rate', { ascending: false });
  if (droppedByError) console.error('gear dropped-by query failed', droppedByError);

  // Paginated, not a bare select(): PostgREST caps at 1,000 rows and stays
  // silent when it truncates, which would render hundreds of items' effects in
  // English with no error to show for it.
  const [{ data: lineRows, error: linesError }, { data: termRows, error: termsError }] =
    await Promise.all([
      fetchAllRows<{ source_line: string; thai_line: string }>((from, to) =>
        db
          .from('item_description_lines')
          .select('source_line, thai_line')
          .order('source_line')
          .range(from, to),
      ),
      fetchAllRows<{ source_term: string; thai_term: string | null }>((from, to) =>
        db
          .from('item_description_terms')
          .select('source_term, thai_term')
          .order('source_term')
          .range(from, to),
      ),
    ]);

  // A dictionary that failed to load is not an empty dictionary. Falling back
  // to English is right either way, but the two cases must stay apart in logs.
  if (linesError) console.error('item description lines query failed', linesError);
  if (termsError) console.error('item description terms query failed', termsError);

  return {
    droppedBy: droppedBy ?? null,
    droppedByError: Boolean(droppedByError),
    dict: {
      lines: new Map((lineRows ?? []).map((r) => [r.source_line, r.thai_line])),
      terms: new Map((termRows ?? []).map((r) => [r.source_term, r.thai_term])),
    },
  };
}
