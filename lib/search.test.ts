import { describe, it, expect } from 'vitest';
import { mergeSearchResults, SEARCH_TYPE_LABELS, type SearchGroups } from './search';

const empty: SearchGroups = { monsters: [], items: [], cards: [], equipment: [], skills: [], maps: [] };

describe('mergeSearchResults', () => {
  it('returns nothing for empty groups', () => {
    expect(mergeSearchResults(empty)).toEqual([]);
  });

  it('builds a monster result with the right href and icon', () => {
    const [r] = mergeSearchResults({ ...empty, monsters: [{ id: 1002, name_en: 'Poring', image_url: '/images/monsters/1002.gif' }] });
    expect(r).toEqual({ type: 'monster', id: '1002', name: 'Poring', href: '/database/monsters/1002', iconUrl: '/images/monsters/1002.gif' });
  });

  it('sends a card to the item detail page but labels it a card', () => {
    // Cards are items. The href must reach a real page; the badge is what
    // tells the player which kind of thing they found.
    const [r] = mergeSearchResults({ ...empty, cards: [{ id: 4118, name_en: 'Ground Petite Card', icon_url: '/images/items/4118.gif' }] });
    expect(r.type).toBe('card');
    expect(r.href).toBe('/database/items/4118');
  });

  it('sends equipment to the item detail page but labels it equipment', () => {
    const [r] = mergeSearchResults({ ...empty, equipment: [{ id: 1201, name_en: 'Knife', icon_url: null }] });
    expect(r.type).toBe('equipment');
    expect(r.href).toBe('/database/items/1201');
  });

  it('keys a skill by slug, not by a numeric id', () => {
    const [r] = mergeSearchResults({ ...empty, skills: [{ slug: 'bash', name: 'Bash', icon_url: '/images/skills/x.webp' }] });
    expect(r).toEqual({ type: 'skill', id: 'bash', name: 'Bash', href: '/database/skills?q=Bash', iconUrl: '/images/skills/x.webp' });
  });

  it('keys a map by code and falls back to the code when it has no name', () => {
    // Only 245 of 497 maps carry a display name. A blank result row is worse
    // than one showing the code.
    const [r] = mergeSearchResults({ ...empty, maps: [{ map_code: 'moc_f18_a', map_display_name: null }] });
    expect(r.name).toBe('moc_f18_a');
    expect(r.href).toBe('/database/maps/moc_f18_a');
  });

  it('uses the display name when a map has one', () => {
    const [r] = mergeSearchResults({ ...empty, maps: [{ map_code: 'prontera', map_display_name: 'Prontera' }] });
    expect(r.name).toBe('Prontera');
  });

  it('url-encodes a map code that needs it', () => {
    const [r] = mergeSearchResults({ ...empty, maps: [{ map_code: 'a b', map_display_name: null }] });
    expect(r.href).toBe('/database/maps/a%20b');
  });

  it('keeps every group and orders them monsters, items, cards, equipment, skills, maps', () => {
    const results = mergeSearchResults({
      monsters: [{ id: 1, name_en: 'M', image_url: null }],
      items: [{ id: 2, name_en: 'I', icon_url: null }],
      cards: [{ id: 3, name_en: 'C', icon_url: null }],
      equipment: [{ id: 4, name_en: 'E', icon_url: null }],
      skills: [{ slug: 's', name: 'S', icon_url: null }],
      maps: [{ map_code: 'p', map_display_name: null }],
    });
    expect(results.map((r) => r.type)).toEqual(['monster', 'item', 'card', 'equipment', 'skill', 'map']);
  });

  it('defaults a missing icon to null rather than undefined', () => {
    const [r] = mergeSearchResults({ ...empty, items: [{ id: 9, name_en: 'X' }] });
    expect(r.iconUrl).toBeNull();
  });
});

describe('SEARCH_TYPE_LABELS', () => {
  it('has a distinct Thai label for every type', () => {
    const labels = Object.values(SEARCH_TYPE_LABELS);
    expect(labels).toHaveLength(6);
    expect(new Set(labels).size).toBe(6);
    for (const l of labels) expect(l.trim().length).toBeGreaterThan(0);
  });
});
