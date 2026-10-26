"""The merchant cart as a dress-up part.

The client's cart act (sprite/이팩트/손수레N.act) has one action per direction, drawn at the
character's feet; the exe moves it behind the character and picks its draw order. Here both are
baked into an act laid out like a body's (pose type x 8 + direction), so the page draws the cart
like any other part: placed at the feet, not on the head anchor.

Offsets and order follow roBrowser (src/Renderer/Entity/EntityRender.js): facing the viewer the
cart is drawn first, under the robe and the body; facing away it is drawn after the headgear.
Standing still the wheels do not turn, so only walking keeps the act's frames.
"""
from . import zorder
from .part import KEPT_TYPES

# Direction -> (x, y) from the feet, in sprite pixels.
OFFSET = {0: (0, -30), 1: (30, -10), 2: (40, 0), 3: (30, 10), 4: (0, 20), 5: (-30, 10), 6: (-40, 0), 7: (-30, -10)}
WALK = 1
UNDER = 1 * zorder.SCALE  # under the robe (5) and the body (10)
OVER = 26 * zorder.SCALE  # over the headgear (22..24 facing away), under the weapon (28)
# 손수레 is the first cart, then 손수레1..8.
NAMES = ['손수레'] + [f'손수레{n}' for n in range(1, 9)]


class _Act:
    def __init__(self, actions, delays):
        self.actions = actions
        self.delays = delays


def act_for(cart):
    """An act with every kept pose type: action t * 8 + d is the cart's direction d, moved off the
    feet, one frame unless walking."""
    n = (max(KEPT_TYPES) + 1) * 8
    actions, delays = [[] for _ in range(n)], [4.0] * n
    for t in KEPT_TYPES:
        for d in range(8):
            ox, oy = OFFSET[d]
            frames = cart.actions[d] if t == WALK else cart.actions[d][:1]
            actions[t * 8 + d] = [dict(f, layers=[dict(l, x=l['x'] + ox, y=l['y'] + oy) for l in f['layers']],
                                       anchors=[]) for f in frames]
            delays[t * 8 + d] = cart.delays[d] if d < len(cart.delays) else 4.0
    return _Act(actions, delays)


def z_of(action, frame):
    return OVER if zorder.facing_away(action) else UNDER
