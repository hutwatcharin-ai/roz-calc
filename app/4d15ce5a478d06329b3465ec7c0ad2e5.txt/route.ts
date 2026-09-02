// IndexNow key file. Must live at the domain root, filename = key, body = key
// (Bing/IndexNow spec). The key itself is not secret -- it only proves we
// control this host, the same role a DNS TXT record plays for GSC.
const KEY = '4d15ce5a478d06329b3465ec7c0ad2e5';

export function GET() {
  return new Response(KEY, { headers: { 'content-type': 'text/plain' } });
}
