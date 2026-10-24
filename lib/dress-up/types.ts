/** [x, y, ax, ay, aw, ah, mirror, sx, sy, rot, r, g, b, a] */
export type Layer = [
  number, number, number, number, number, number, number,
  number, number, number, number, number, number, number,
];

/** [layers, anchor | null, z] */
export type FrameData = [Layer[], [number, number] | null, number];

export interface PartData {
  v: number;
  w: number;
  h: number;
  acts: Record<string, FrameData[]>;
  delay: Record<string, number>;
}

export type Atlas = { w: number; h: number; data: Uint8ClampedArray };

export type Placed = { part: PartData; atlas: Atlas; anchored: boolean; frame: number };
