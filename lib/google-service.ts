// Google APIs as the site's service account (the key the Telegram reports
// use: Viewer on GA4, a user on Search Console). GA4_SERVICE_ACCOUNT_JSON is
// the key file, base64. Signed with node:crypto, so no Google SDK.
import { createSign } from 'node:crypto';

export const GA4_PROPERTY = 'properties/552516626';
export const GSC_SITE = 'sc-domain:rozerothai.com';

export async function googleToken(scope: string): Promise<string> {
  const raw = process.env.GA4_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error('GA4_SERVICE_ACCOUNT_JSON missing');
  const key = JSON.parse(Buffer.from(raw, 'base64').toString('utf8'));
  const now = Math.floor(Date.now() / 1000);
  const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const unsigned = `${b64({ alg: 'RS256', typ: 'JWT' })}.${b64({ iss: key.client_email, scope, aud: key.token_uri, iat: now, exp: now + 3600 })}`;
  const sig = createSign('RSA-SHA256').update(unsigned).sign(key.private_key, 'base64url');
  const res = await fetch(key.token_uri, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${unsigned}.${sig}` }),
  });
  const body = await res.json();
  if (!body.access_token) throw new Error(`google token: ${body.error ?? res.status}`);
  return body.access_token;
}

export interface Ga4Row {
  dims: string[];
  mets: number[];
}

/** runReport, or runRealtimeReport when `realtime`. */
export async function ga4(token: string, body: object, realtime = false): Promise<Ga4Row[]> {
  const res = await fetch(`https://analyticsdata.googleapis.com/v1beta/${GA4_PROPERTY}:${realtime ? 'runRealtimeReport' : 'runReport'}`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error.message);
  return (json.rows ?? []).map((r: { dimensionValues?: { value: string }[]; metricValues?: { value: string }[] }) => ({
    dims: (r.dimensionValues ?? []).map((d) => d.value),
    mets: (r.metricValues ?? []).map((m) => Number(m.value)),
  }));
}

export interface GscRow {
  keys?: string[];
  clicks: number;
  impressions: number;
  position: number;
}

export async function gsc(token: string, start: string, end: string, dims: string[], limit: number): Promise<GscRow[]> {
  const res = await fetch(`https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(GSC_SITE)}/searchAnalytics/query`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ startDate: start, endDate: end, dimensions: dims, rowLimit: limit }),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error.message);
  return json.rows ?? [];
}
