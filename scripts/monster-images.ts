// A monster row may only carry an image_url for an image this site actually
// serves.
//
// Found on production: Deviling and C4 Golem point at
// /images/monsters/1582.png and /images/monsters/2812.png, and neither file
// exists -- 522 of the 524 monsters were mirrored as .gif and these two never
// arrived. Both rendered a broken-image icon on every surface the monster
// appears on, and nothing anywhere reported it.
//
// The rule lives here rather than in transform.ts because transform is pure
// and fixture-tested; whether a file exists is a fact about the checkout, and
// the importer is the layer that already knows about the filesystem.

export interface HasImage {
  id: number;
  name_en: string;
  image_url: string | null;
}

/** Given a predicate that says whether a public path exists, list the rows whose image does not. */
export function missingImages<T extends HasImage>(rows: T[], exists: (publicPath: string) => boolean): T[] {
  return rows.filter((row) => row.image_url !== null && !exists(row.image_url));
}

/**
 * The same rows with an unusable image_url replaced by null, so the page falls
 * back to no image instead of a broken one. The row itself is kept: the monster
 * is real, only its picture is missing.
 */
export function withServableImages<T extends HasImage>(
  rows: T[],
  exists: (publicPath: string) => boolean,
): T[] {
  return rows.map((row) =>
    row.image_url !== null && !exists(row.image_url) ? { ...row, image_url: null } : row,
  );
}
