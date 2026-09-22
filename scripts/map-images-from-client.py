"""Map pictures the site still lacks, from the game client's own minimaps.

lib/map-image.ts serves prontera.info's 512 px renders, then ratemyserver's
205 px minimaps. On 22 Sep 2026 21 map codes had neither. The client's
data.grf carries a 512 px minimap per map in texture/유저인터페이스/map/, and
a channel copy (bea_d03_a) names the map it is built on inside its .rsw, so
both direct and channel codes can be matched to a picture.

Writes public/images/maps/full/<file>.webp and adds an entry to
full/_index.json with source "client", so the page credits the right place.
The client paints the area outside the map pure magenta; that becomes the
site's dark map ground.

Run: python scripts/map-images-from-client.py [path-to-grf-data]
"""
import json
import os
import re
import sys
import urllib.request

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = sys.argv[1] if len(sys.argv) > 1 else r'D:\data_grf_extracted\files\data'
MINI = os.path.join(DATA, 'texture', '유저인터페이스', 'map')
FULL = os.path.join(ROOT, 'public', 'images', 'maps', 'full')
INDEX = os.path.join(FULL, '_index.json')
GROUND = (11, 8, 32)


def env():
    pairs = (l.split('=', 1) for l in open(os.path.join(ROOT, '.env.local'), encoding='utf-8').read().splitlines() if '=' in l)
    return {k.strip(): v.strip() for k, v in pairs}


def site_map_codes():
    e = env()
    req = urllib.request.Request(
        f"{e['NEXT_PUBLIC_SUPABASE_URL']}/rest/v1/map_stats?select=map_code,map_display_name&limit=2000",
        headers={'apikey': e['NEXT_PUBLIC_SUPABASE_ANON_KEY'], 'Authorization': 'Bearer ' + e['NEXT_PUBLIC_SUPABASE_ANON_KEY']},
    )
    return {r['map_code']: r.get('map_display_name') for r in json.load(urllib.request.urlopen(req))}


def base_map(code):
    """The map a channel copy is built on, read from its .rsw (None if no .rsw)."""
    path = os.path.join(DATA, f'{code}.rsw')
    if not os.path.exists(path):
        return None
    found = re.findall(rb'([\w@\-]+)\.gnd', open(path, 'rb').read(400))
    return found[0].decode().lower() if found else None


def main():
    minis = {f[:-4].lower(): f for f in os.listdir(MINI) if f.lower().endswith('.bmp')}
    index = json.load(open(INDEX, encoding='utf-8'))
    mini_gifs = {f[:-4] for f in os.listdir(os.path.join(ROOT, 'public', 'images', 'maps')) if f.endswith('.gif')}
    added, none = [], []
    for code, name in sorted(site_map_codes().items()):
        if code in index or code in mini_gifs:
            continue
        source = code.lower() if code.lower() in minis else base_map(code)
        if not source or source not in minis:
            none.append(code)
            continue
        out = os.path.join(FULL, f'{source}.webp')
        if not os.path.exists(out):
            image = Image.open(os.path.join(MINI, minis[source])).convert('RGB')
            px = image.load()
            for y in range(image.height):
                for x in range(image.width):
                    if px[x, y] == (255, 0, 255):
                        px[x, y] = GROUND
            image.save(out, 'WEBP', quality=75, method=6)
        index[code] = {'prontera': source, 'name': name or code, 'source': 'client'}
        added.append(f'{code}<-{source}')
    json.dump(index, open(INDEX, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    print(f'added {len(added)}: {added}')
    print(f'still without a picture ({len(none)}): {none}')


if __name__ == '__main__':
    main()
