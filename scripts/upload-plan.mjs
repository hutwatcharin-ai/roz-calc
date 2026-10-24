// Which dress-up files still need uploading (pure; tested in upload-plan.test.ts).
// Every path already carries its content hash in the file name, so a path the
// bucket has is the same bytes: it never needs sending again.

/**
 * @param {Record<string, string>} local hashed path -> content hash
 * @param {Set<string>} remote keys already in the bucket
 * @returns {string[]} the local paths missing from the bucket, sorted
 */
export function planUpload(local, remote) {
  return Object.keys(local)
    .filter((p) => !remote.has(p))
    .sort();
}
