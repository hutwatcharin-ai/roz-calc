"""Turns the mirrored card GIFs (docs/card-art/, gitignored) into the two WebP
sizes the site serves from public/images/cards/.

  public/images/cards/<id>.webp        150x200, a card's own page
  public/images/cards/thumb/<id>.webp   60x80,  the list and the hover popup

The list shows 50 rows a page, so the thumbnail is the size that decides how
heavy that page is: the full art is ~8 KB each and would put ~400 KB on it,
the thumbnails are ~2 KB and put ~100 KB.

Quality 82 rather than the maps' 75: card art is flat colour with hard edges
and lettering along the top, and 75 leaves visible fringing on the frame.

Run after scripts/mirror-card-art.mjs:  python scripts/compress-card-art.py
"""
import os

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, 'docs', 'card-art')
OUT = os.path.join(ROOT, 'public', 'images', 'cards')
THUMB = os.path.join(OUT, 'thumb')
THUMB_SIZE = (60, 80)

os.makedirs(THUMB, exist_ok=True)

made = 0
full_bytes = 0
thumb_bytes = 0
sources = sorted(f for f in os.listdir(RAW) if f.endswith('.gif'))

for name in sources:
    card_id = name[:-4]
    src = os.path.join(RAW, name)
    # GIFs here are palette images with no transparency; RGB keeps WebP small
    # and avoids a stray alpha channel on a picture that has no holes in it.
    image = Image.open(src).convert('RGB')

    full_path = os.path.join(OUT, f'{card_id}.webp')
    image.save(full_path, 'WEBP', quality=82, method=6)
    full_bytes += os.path.getsize(full_path)

    thumb_path = os.path.join(THUMB, f'{card_id}.webp')
    # LANCZOS, not the default: the card frame is a one-pixel line and a
    # cheaper filter turns it into mush at this size.
    image.resize(THUMB_SIZE, Image.LANCZOS).save(thumb_path, 'WEBP', quality=82, method=6)
    thumb_bytes += os.path.getsize(thumb_path)
    made += 1

print(f'{made} cards')
print(f'full:  {full_bytes / 1024 / 1024:.2f} MB  ({full_bytes / made / 1024:.1f} KB each)')
print(f'thumb: {thumb_bytes / 1024:.0f} KB  ({thumb_bytes / made / 1024:.1f} KB each, {THUMB_SIZE[0]}x{THUMB_SIZE[1]})')
print(f'a 50-row page of thumbnails: {thumb_bytes / made * 50 / 1024:.0f} KB')
