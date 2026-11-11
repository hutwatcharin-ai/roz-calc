import os
import struct
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from dressup import strfx  # noqa: E402

EFFECT = 'D:/Data grf roz/data_grf_extracted/files/data/texture/effect'
MC = os.path.join(EFFECT, 'efst_magiccircle', 'mc.str')


def key(frame, type_, x, y, color=(255, 255, 255, 255)):
    return strfx.StrKey(frame=frame, type=type_, pos=(x, y), uv=(0, 0, 1, 1, 0, 0, 1, 1),
                        xy=(-1, 1, 1, -1, -1, -1, 1, 1), aniframe=0.0, anitype=0, delay=0.0, angle=0.0,
                        color=color, src_blend=5, dst_blend=2, mt_preset=0)


@unittest.skipUnless(os.path.exists(MC), 'extracted client not on this machine')
class RealFile(unittest.TestCase):
    def test_magic_circle_header(self):
        s = strfx.parse_str(open(MC, 'rb').read())
        self.assertEqual(s.fps, 60)
        self.assertEqual(s.max_key, 145)
        self.assertEqual(len(s.layers), 4)
        # layer 0 is empty in every file seen; the drawn layers each name a texture
        self.assertEqual((s.layers[0].textures, s.layers[0].keys), ([], []))
        for layer in s.layers[1:]:
            self.assertGreaterEqual(len(layer.textures), 1)
            for t in layer.textures:
                self.assertTrue(t.lower().endswith(('.bmp', '.tga')), t)

    def test_first_key_of_magic_circle(self):
        s = strfx.parse_str(open(MC, 'rb').read())
        k = s.layers[1].keys[0]
        self.assertEqual((k.frame, k.type), (0, 0))
        self.assertEqual(k.pos, (320.0, 240.0))
        self.assertEqual(k.xy, (-50.0, 50.0, 50.0, -50.0, -25.0, -25.0, 25.0, 25.0))
        self.assertEqual(k.color, (255.0, 255.0, 255.0, 156.0))
        self.assertEqual((k.src_blend, k.dst_blend), (5, 7))
        self.assertIsNotNone(strfx.layer_state(s.layers[1], 0))

    def test_find_texture_ignores_case(self):
        self.assertTrue(strfx.find_texture(MC, 'MagicCircle1.BMP').lower().endswith('magiccircle1.bmp'))
        self.assertIsNone(strfx.find_texture(MC, 'nope.bmp'))


class Interpolation(unittest.TestCase):
    def test_morph_adds_its_delta_every_frame(self):
        layer = strfx.StrLayer(textures=['a.bmp'], keys=[key(0, 0, 0, 0), key(0, 1, 1, 0)])
        self.assertEqual(strfx.layer_state(layer, 10).pos[0], 10)

    def test_layer_hidden_before_its_first_key(self):
        layer = strfx.StrLayer(textures=['a.bmp'], keys=[key(5, 0, 0, 0)])
        self.assertIsNone(strfx.layer_state(layer, 4))
        self.assertIsNotNone(strfx.layer_state(layer, 5))

    def test_set_key_without_morph_hides_after_its_frame(self):
        layer = strfx.StrLayer(textures=['a.bmp'], keys=[key(0, 0, 0, 0), key(3, 0, 7, 0)])
        self.assertEqual(strfx.layer_state(layer, 1).pos, (0, 0))
        self.assertEqual(strfx.layer_state(layer, 3).pos, (7, 0))

    def test_rejects_other_files(self):
        with self.assertRaises(ValueError):
            strfx.parse_str(b'NOPE' + struct.pack('<I', 0x94) + bytes(32))


if __name__ == '__main__':
    unittest.main()
