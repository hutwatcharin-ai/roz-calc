import json
import os
import sys
import tempfile
import unittest
from unittest import mock

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from dressup import fxrender, strfx  # noqa: E402

EFFECT = 'D:/Data grf roz/data_grf_extracted/files/data/texture/effect'
MC = os.path.join(EFFECT, 'efst_magiccircle', 'mc.str')


@unittest.skipUnless(os.path.exists(MC), 'extracted client not on this machine')
class Render(unittest.TestCase):
    def test_one_buffer_pair_per_frame(self):
        frames = fxrender.render_frames(MC)
        self.assertEqual(len(frames), 146)  # frames 0..max_key
        lit = [a for n, a in frames if a is not None]
        self.assertTrue(lit, 'magic circle draws something additive')

    def test_step_keeps_every_nth_frame(self):
        self.assertEqual(len(fxrender.render_frames(MC, step=2)), 73)

    def test_magic_circle_sits_on_the_feet(self):
        # a ground ring 100 x 50 STR units centred on the STR origin (320, 240)
        n, a = fxrender.render_frames(MC)[10]
        # each buffer comes cropped: (image, left, top) in canvas pixels
        img, left, top = a
        x0, y0, x1, y1 = img.getbbox()
        x0, x1, y0, y1 = x0 + left, x1 + left, y0 + top, y1 + top
        cx, cy = fxrender.ORIGIN_PX
        self.assertLess(abs((x0 + x1) / 2 - cx), 3)
        self.assertLess(abs((y0 + y1) / 2 - cy), 3)
        self.assertLess(x1 - x0, 104)

    def test_export_writes_atlas_and_frames_inside_it(self):
        with tempfile.TemporaryDirectory() as out:
            h, j, w = fxrender.export_fx(MC, out, 'fx/56', pos_x=0, pos_y=0, before=True)
            self.assertRegex(h, r'^[0-9a-f]{8}$')
            data = json.loads(open(os.path.join(out, f'fx/56.{h}.json'), encoding='utf-8').read())
            self.assertEqual(data['v'], 1)
            self.assertEqual(data['fps'], 60)
            self.assertTrue(data['before'])
            self.assertEqual(len(data['frames']), 146)
            from PIL import Image
            with Image.open(os.path.join(out, f'fx/56.{h}.webp')) as im:
                atlas = im.size
            for f in data['frames']:
                for r in (f['n'], f['a']):
                    if r is None:
                        continue
                    ax, ay, rw, rh, dx, dy = r
                    self.assertLessEqual(ax + rw, atlas[0])
                    self.assertLessEqual(ay + rh, atlas[1])

    def test_missing_texture_is_skipped_not_fatal(self):
        real = strfx.find_texture
        with mock.patch.object(fxrender.strfx, 'find_texture',
                               side_effect=lambda p, n: None if n.lower() == 'magiccircle1.bmp' else real(p, n)):
            with self.assertLogs('fxrender', level='WARNING'):
                frames = fxrender.render_frames(MC)
        self.assertEqual(len(frames), 146)


class Blend(unittest.TestCase):
    def test_additive_destinations(self):
        self.assertTrue(fxrender.is_additive(5, 2))
        self.assertTrue(fxrender.is_additive(5, 7))
        self.assertFalse(fxrender.is_additive(5, 6))

    def test_angle_is_1024_to_a_turn(self):
        self.assertAlmostEqual(fxrender.degrees(256), 90.0)


if __name__ == '__main__':
    unittest.main()
