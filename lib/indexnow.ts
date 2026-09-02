// Pings IndexNow (Bing, and anything reading the same protocol -- Copilot's
// index is Bing's) with a batch of URLs. Not secret: the key only proves
// control of the host, which the key file at the domain root already does.
export const INDEXNOW_KEY = '4d15ce5a478d06329b3465ec7c0ad2e5';

export async function submitIndexNow(host: string, urls: string[]): Promise<{ ok: boolean; status: number }> {
  if (urls.length === 0) return { ok: true, status: 0 };
  const res = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      host,
      key: INDEXNOW_KEY,
      keyLocation: `https://${host}/${INDEXNOW_KEY}.txt`,
      urlList: urls,
    }),
  });
  return { ok: res.ok, status: res.status };
}
