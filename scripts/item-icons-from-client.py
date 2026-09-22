"""Icons for items that have none, from the game client.

823 of 5,003 items had no icon on 22 Sep 2026. The client's itemInfo_data.lub
names each item's resource (in CP949, Korean), and
texture/유저인터페이스/item/<resource>.bmp is its 24x24 inventory icon, drawn
on the client's magenta key colour.

Writes public/images/items/<id>.png (magenta made transparent) for every item
with no icon_url that the client has an icon for, and a list of those ids to
data/raw/client-icons.json. Setting icon_url in the database is a separate,
explicit step:  --apply  (needs SUPABASE_SERVICE_ROLE_KEY in .env.local).

Run: python scripts/item-icons-from-client.py [--apply]
"""
import json
import os
import sys
import urllib.request

from PIL import Image

sys.path.insert(0, os.path.dirname(__file__))
import lub  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SYSTEM = r'D:\data_grf_extracted\System'
ICONS = r'D:\data_grf_extracted\files\data\texture\유저인터페이스\item'
OUT = os.path.join(ROOT, 'public', 'images', 'items')
LIST = os.path.join(ROOT, 'data', 'raw', 'client-icons.json')
APPLY = '--apply' in sys.argv


def env():
    pairs = (l.split('=', 1) for l in open(os.path.join(ROOT, '.env.local'), encoding='utf-8').read().splitlines() if '=' in l)
    return {k.strip(): v.strip() for k, v in pairs}


def rest(path, method='GET', body=None, service=False):
    e = env()
    key = e['SUPABASE_SERVICE_ROLE_KEY'] if service else e['NEXT_PUBLIC_SUPABASE_ANON_KEY']
    req = urllib.request.Request(
        f"{e['NEXT_PUBLIC_SUPABASE_URL']}/rest/v1/{path}", method=method,
        data=json.dumps(body).encode() if body is not None else None,
        headers={'apikey': key, 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json', 'Prefer': 'return=minimal'},
    )
    with urllib.request.urlopen(req) as res:
        return json.load(res) if method == 'GET' else None


def items_without_icon():
    out, offset = [], 0
    while True:
        page = rest(f'items?select=id,icon_url&order=id&offset={offset}&limit=1000')
        out += [r['id'] for r in page if not r['icon_url']]
        if len(page) < 1000:
            return out
        offset += 1000


def resource_names():
    L = lub.runtime()
    lub.load(L, os.path.join(SYSTEM, 'itemInfo_data.lub'))
    names = {}
    for k, v in L.globals().tbl_data.items():
        raw = v[b'identifiedResourceName']
        if isinstance(raw, bytes):
            names[int(k)] = raw.decode('cp949', 'replace')
    return names


def main():
    names = resource_names()
    on_disk = {f[:-4].lower(): f for f in os.listdir(ICONS) if f.lower().endswith('.bmp')}
    made = []
    for item_id in items_without_icon():
        name = names.get(item_id)
        file = on_disk.get(name.lower()) if name else None
        if not file:
            continue
        image = Image.open(os.path.join(ICONS, file)).convert('RGBA')
        px = image.load()
        for y in range(image.height):
            for x in range(image.width):
                r, g, b, _ = px[x, y]
                if r > 240 and g < 20 and b > 240:
                    px[x, y] = (0, 0, 0, 0)
        image.save(os.path.join(OUT, f'{item_id}.png'), 'PNG', optimize=True)
        made.append(item_id)
    json.dump(made, open(LIST, 'w', encoding='utf-8'))
    print(f'{len(made)} icons written from the client')
    if APPLY:
        for item_id in made:
            rest(f'items?id=eq.{item_id}', 'PATCH', {'icon_url': f'/images/items/{item_id}.png'}, service=True)
        print(f'icon_url set on {len(made)} rows')


if __name__ == '__main__':
    main()
