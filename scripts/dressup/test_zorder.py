"""Draw-order rules, checked against the client's own tables and imf files.

Views and jobs used (all measured from the client data, see task-4-report.md):
  robe 1   천사날개 (Angel Wing): not in RobeTopLayer, big layer type
  robe 2   모험가배낭 (Adventurer's Backpack): in RobeTopLayer, small layer type
  acc 2517 _C_Chewy_Low_Twin: TB_Layer_Priority Default 143 (mid band, rank 43), empty Direction
  acc 446  _입에무는막대사탕 (mouth lollipop): Default 303 (lower band, rank 3)
  imf 초보자_남 action 32 (ready, d 0) frames 0-2: head priority 1, body 0 -> head behind body
  imf 기사_남 action 50 (hurt, d 2) frame 0: same
"""
import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from dressup import zorder  # noqa: E402

S = zorder.SCALE
NOVICE, KNIGHT = '초보자', '기사'


def z(kind, view, action, frame=0, job=NOVICE, sex='m'):
    return zorder.z_for(kind, view, job, sex, action, frame)


class BaseTest(unittest.TestCase):
    def test_base_values(self):
        self.assertEqual([z(k, None, 0) for k in ('body', 'head', 'weapon')], [10 * S, 15 * S, 23 * S])
        self.assertEqual([z(k, None, 4) for k in ('body', 'head', 'weapon')], [15 * S, 20 * S, 28 * S])
        # an accessory with no TB_Layer_Priority entry keeps its slot
        self.assertEqual(z('acc_upper', 1, 0), 19 * S)
        self.assertEqual(z('acc_upper', 1, 3), 24 * S)


class RobeTest(unittest.TestCase):
    def test_robe_behind_body_facing_front(self):
        self.assertFalse(zorder.is_top_layer(1))
        self.assertLess(z('robe', 1, 0), z('body', None, 0))

    def test_robe_over_body_facing_away(self):
        self.assertGreater(z('robe', 1, 4), z('body', None, 4))
        self.assertLess(z('robe', 1, 4), z('head', None, 4))

    def test_top_layer_robe(self):
        self.assertTrue(zorder.is_top_layer(2))
        self.assertGreater(z('robe', 2, 0), z('body', None, 0))

    def test_draw_on_top_is_per_job(self):
        # _New_BigLayerDir_M: the Novice lists no frames for stand d 2 (wing over body), the
        # Knight lists 0-2 (wing behind the body).
        self.assertGreater(z('robe', 1, 2, job=NOVICE), z('body', None, 2, job=NOVICE))
        self.assertLess(z('robe', 1, 2, job=KNIGHT), z('body', None, 2, job=KNIGHT))

    def test_top_layer_robe_over_head_facing_away(self):
        self.assertGreater(z('robe', 2, 4), z('head', None, 4))


class LayerPriorityTest(unittest.TestCase):
    def test_band_and_rank(self):
        # 143 worn on top: the client draws it among the mids, ranked by 43
        self.assertEqual(z('acc_upper', 2517, 0), 18 * S + 43)
        self.assertGreater(z('acc_upper', 2517, 0), z('acc_mid', 1, 0))
        self.assertLess(z('acc_upper', 2517, 0), z('acc_upper', 1, 0))
        self.assertEqual(z('acc_lower', 446, 0), 17 * S + 3)

    def test_layer_priority_override(self):
        # Every Direction table in the client's tb_layer_priority.lub is empty (measured), so
        # the override path is exercised by putting one into the client's own table and calling
        # the client's GetLayerPriority through z_for.
        L = zorder.lua()
        L.execute('TB_Layer_Priority.Items_List[2517].Direction[4] = 304')
        try:
            self.assertEqual(z('acc_upper', 2517, 4), 22 * S + 4)
            self.assertEqual(z('acc_upper', 2517, 3), 23 * S + 43)
        finally:
            L.execute('TB_Layer_Priority.Items_List[2517].Direction[4] = nil')
        self.assertEqual(z('acc_upper', 2517, 4), 23 * S + 43)


class ImfTest(unittest.TestCase):
    def test_imf_head_behind(self):
        for f in range(3):
            self.assertLess(z('head', None, 32, f), z('body', None, 32, f))
            self.assertEqual(z('head', None, 32, f), z('body', None, 32, f) - S)
        self.assertGreater(z('head', None, 0), z('body', None, 0))
        self.assertLess(z('head', None, 50, 0, job=KNIGHT), z('body', None, 50, 0, job=KNIGHT))
        # the female Novice's imf does not put the head behind at action 32
        self.assertGreater(z('head', None, 32, 0, sex='f'), z('body', None, 32, 0, sex='f'))


class HeadgearFollowsHeadTest(unittest.TestCase):
    def test_headgear_moves_behind_body_with_the_head(self):
        # 초보자_남 action 32 frame 0: the imf puts the head behind the body. Every headgear
        # (slot defaults and TB_Layer_Priority ranks alike) stays above the head, below the body.
        for f in range(3):
            head, body = z('head', None, 32, f), z('body', None, 32, f)
            zs = [z('acc_lower', 446, 32, f), z('acc_mid', 1, 32, f), z('acc_upper', 2517, 32, f),
                  z('acc_upper', 1, 32, f), z('acc_lower', 1, 32, f)]
            for v in zs:
                self.assertGreater(v, head)
                self.assertLess(v, body)
            # relative order between headgear is kept: lower < mid < 143-ranked < upper
            self.assertLess(z('acc_lower', 1, 32, f), z('acc_mid', 1, 32, f))
            self.assertLess(z('acc_mid', 1, 32, f), z('acc_upper', 2517, 32, f))
            self.assertLess(z('acc_upper', 2517, 32, f), z('acc_upper', 1, 32, f))
        # same rule for the Knight's hurt frame
        self.assertLess(z('acc_upper', 1, 50, 0, job=KNIGHT), z('body', None, 50, 0, job=KNIGHT))
        self.assertGreater(z('acc_upper', 1, 50, 0, job=KNIGHT), z('head', None, 50, 0, job=KNIGHT))

    def test_headgear_unchanged_when_head_in_front(self):
        self.assertEqual(z('acc_upper', 1, 0), 19 * S)
        self.assertEqual(z('acc_upper', 2517, 0), 18 * S + 43)
        self.assertGreater(z('acc_upper', 1, 32, 0, sex='f'), z('body', None, 32, 0, sex='f'))


class PartZTest(unittest.TestCase):
    def test_part_frame_maps_onto_body_frame(self):
        z_of = zorder.part_z_of('robe', 61, NOVICE, 'm')
        # angel wing (61, RobeTopLayer) at stand d 0: frame 16 of the robe is body frame 16 % 3
        self.assertEqual(z_of(0, 16), z('robe', 61, 0, 16 % 3))
        self.assertLess(z_of(0, 16), z('body', None, 0))


if __name__ == '__main__':
    unittest.main()
