"""Reference renderer: what the browser must draw, from the original Spr/Act.

Same as ro_sprite.render, except every part picks its own frame index, so a
part with fewer frames than the body keeps its own beat, and parts are drawn
in z order (stable, so equal z keeps list order).
"""
import os
import sys

from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from ro_sprite import draw_layers  # noqa: E402


def _action(act, action):
    """The action actually used: a missing one falls back to 0 (as lib/dress-up does with acts["0"])."""
    return action if action < len(act.actions) else 0


def _frame(act, action, index):
    frames = act.actions[_action(act, action)]
    return frames[index % len(frames)]


def render(parts, action, frames, size=(200, 200), origin=(100, 150)):
    """parts: list of (Spr, Act, anchored) or (Spr, Act, anchored, z_of); z_of(action, frame) -> z
    (default 0), asked with the action and frame index actually drawn. frames[i] is part i's frame
    index. The first part is the body that anchors the others, wherever it lands in z order."""
    canvas = Image.new('RGBA', size)
    body_frame = _frame(parts[0][1], action, frames[0])
    placed = []
    for n, (p, index) in enumerate(zip(parts, frames)):
        spr, act, anchored = p[:3]
        z_of = p[3] if len(p) > 3 else None
        a = _action(act, action)
        f = index % len(act.actions[a])
        placed.append((z_of(a, f) if z_of else 0, n, spr, act.actions[a][f], anchored))
    placed.sort(key=lambda t: (t[0], t[1]))
    for _z, _n, spr, frame, anchored in placed:
        shift = (0, 0)
        if anchored and body_frame['anchors'] and frame['anchors']:
            bx, by = body_frame['anchors'][0]
            hx, hy = frame['anchors'][0]
            shift = (bx - hx, by - hy)
        draw_layers(canvas, origin, spr, frame, shift)
    return canvas
