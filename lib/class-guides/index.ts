import type { ClassGuide } from './types';
import { priest } from './priest';

export const CLASS_GUIDES: ClassGuide[] = [priest];

export function classGuide(slug: string): ClassGuide | null {
  return CLASS_GUIDES.find((guide) => guide.slug === slug) ?? null;
}

/** YouTube link that opens at the cited second, or the plain URL. */
export function citeHref(url: string, at?: string): string {
  if (!url) return '';
  if (!at || !url.includes('youtube.com/watch')) return url;
  const [m, s] = at.split(':').map(Number);
  return `${url}&t=${m * 60 + s}s`;
}
