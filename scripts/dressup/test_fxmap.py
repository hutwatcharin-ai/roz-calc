import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from dressup import fxmap  # noqa: E402

HAT_IDS = {'HAT_EF_C_Swirling_Flame': 164, 'HAT_EF_Magiccircle': 56, 'HAT_EF_ANGEL_STAIR': 400}
HAT_TABLE = {
    164: {'resourceFileName': 'swirl\\flame.str', 'hatEffectPos': -10},
    56: {'resourceFileName': 'efst_magiccircle\\mc.str', 'hatEffectPos': -11, 'isRenderBeforeCharacter': True},
    400: {'resourceFileName': 'stair\\stair.str', 'hatEffectPosX': 3},
}


def costume(name='x'):
    return {'name': name, 'costume': True, 'desc': []}


def run(game, info, rathena=None, manual=None, **kw):
    return fxmap.effect_items(game, info, HAT_IDS, HAT_TABLE, rathena or {}, manual or {}, **kw)


class EffectItems(unittest.TestCase):
    def test_resource_name_matches_hat_effect_name(self):
        m, un = run({'31000': costume()}, {31000: {'ClassNum': 0, 'identifiedResourceName': 'C_Swirling_Flame'}})
        self.assertEqual(m[31000], fxmap.FxRef(164, 'swirl/flame.str', 0, -10, False, 'name'))
        self.assertEqual(un, [])

    def test_rathena_wins_over_name(self):
        m, _ = run({'31000': costume()}, {31000: {'ClassNum': 0, 'identifiedResourceName': 'C_Swirling_Flame'}},
                   rathena={31000: 'HAT_EF_Magiccircle'})
        self.assertEqual((m[31000].ef_id, m[31000].how, m[31000].before), (56, 'rathena', True))

    def test_rathena_name_case_does_not_matter(self):
        m, _ = run({'31000': costume()}, {31000: {'ClassNum': 0, 'identifiedResourceName': '?'}},
                   rathena={31000: 'HAT_EF_MAGICCIRCLE'})
        self.assertEqual((m[31000].ef_id, m[31000].how), (56, 'rathena'))

    def test_bound_twin_takes_the_effect_of_its_twin(self):
        game = {'20062': costume('Angel Stairs'), '401101': costume('Angel Stairs (Bound)')}
        info = {20062: {'ClassNum': 0, 'identifiedResourceName': '천사의계단'},
                401101: {'ClassNum': 0, 'identifiedResourceName': '천사의계단'}}
        m, un = run(game, info, manual={20062: 'HAT_EF_ANGEL_STAIR'})
        self.assertEqual((m[20062].how, m[401101].how), ('manual', 'twin'))
        self.assertEqual((m[401101].ef_id, m[401101].pos_x), (400, 3))
        self.assertEqual(un, [])

    def test_excluded_items_never_appear(self):
        game = {'24966': costume('Taming Ring'), '1270260': costume('Guild shield')}
        info = {24966: {'ClassNum': 0, 'identifiedResourceName': 'C_Swirling_Flame'},
                1270260: {'ClassNum': 0, 'identifiedResourceName': 'C_Swirling_Flame'}}
        m, un = run(game, info, hat_items=[24966, 1270260])
        self.assertEqual((m, un), ({}, []))

    def test_unmatched_item_is_reported_with_a_reason(self):
        m, un = run({'31001': costume()}, {31001: {'ClassNum': 0, 'identifiedResourceName': 'C_Nothing_Like_It'}})
        self.assertEqual(m, {})
        self.assertEqual(len(un), 1)
        self.assertEqual(un[0][0], 31001)
        self.assertIn('C_Nothing_Like_It', un[0][1])

    def test_items_with_a_sprite_come_in_only_through_the_hat_item_table(self):
        game = {'5000': costume(), '5001': costume()}
        info = {5000: {'ClassNum': 12, 'identifiedResourceName': 'C_Swirling_Flame'},
                5001: {'ClassNum': 13, 'identifiedResourceName': 'C_Swirling_Flame'}}
        m, _ = run(game, info, hat_items=[5001])
        self.assertEqual(list(m), [5001])

    def test_effect_without_a_str_file_is_unmatched(self):
        m, un = run({'31000': costume()}, {31000: {'ClassNum': 0, 'identifiedResourceName': 'C_Swirling_Flame'}},
                    str_exists=lambda rel: False)
        self.assertEqual(m, {})
        self.assertEqual(un, [(31000, 'no .str: swirl/flame.str')])

    def test_items_not_in_the_game_are_skipped(self):
        m, un = run({}, {31000: {'ClassNum': 0, 'identifiedResourceName': 'C_Swirling_Flame'}}, hat_items=[31000])
        self.assertEqual((m, un), ({}, []))


class RathenaParse(unittest.TestCase):
    def test_reads_hateffect_lines_under_their_item(self):
        yml = ('  - Id: 5000\n    AegisName: A\n    Script: |\n      bonus bStr,1;\n'
               '  - Id: 31000\n    Script: |\n      hateffect(HAT_EF_C_Swirling_Flame,true);\n'
               '  - Id: 31001\n    OnEquip_Script: |\n      hateffect HAT_EF_Magiccircle,true;\n')
        self.assertEqual(fxmap.parse_rathena(yml), {31000: 'HAT_EF_C_Swirling_Flame', 31001: 'HAT_EF_Magiccircle'})


if __name__ == '__main__':
    unittest.main()
