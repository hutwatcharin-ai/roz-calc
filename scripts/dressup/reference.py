"""Reference renderer: what the browser must draw, from the original Spr/Act.

Same as ro_sprite.render, except every part picks its own frame index, so a
part with fewer frames than the body keeps its own beat.
"""
import os
import sys

from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from ro_sprite import draw_layers  # noqa: E402


def _frame(act, action, index):
    frames = act.actions[action] if action < len(act.actions) else act.actions[0]
    return frames[index % len(frames)]


def render(parts, action, frames, size=(200, 200), origin=(100, 150)):
    """parts: list of (Spr, Act, anchored); frames[i] is part i's frame index.
    Drawn in list order. The first part is the body that anchors the others."""
    canvas = Image.new('RGBA', size)
    body_frame = _frame(parts[0][1], action, frames[0])
    for (spr, act, anchored), index in zip(parts, frames):
        frame = _frame(act, action, index)
        shift = (0, 0)
        if anchored and body_frame['anchors'] and frame['anchors']:
            bx, by = body_frame['anchors'][0]
            hx, hy = frame['anchors'][0]
            shift = (bx - hx, by - hy)
        draw_layers(canvas, origin, spr, frame, shift)
    return canvas
