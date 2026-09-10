// Decoding an RO sprite (.spr) far enough to save a still picture of it.
//
// The format, in the order the bytes come:
//
//   "SP", uint16 version, uint16 indexed frame count,
//   and for version >= 0x200 a uint16 count of 32-bit frames.
//
//   Each indexed frame: uint16 width, uint16 height, then width*height bytes
//   of palette indices -- raw before version 0x201, run-length encoded from
//   0x201 on, where a zero byte is followed by a count of transparent pixels.
//
//   Each 32-bit frame: uint16 width, uint16 height, then width*height pixels
//   of four bytes, stored bottom row first.
//
//   The palette is the last 1,024 bytes of the file: 256 entries of RGBA, of
//   which index 0 is the transparent one.
//
// Only what a still picture needs is implemented: no .act, so no animation and
// no anchor points. The frame chosen is the biggest one, which for an NPC is
// the front-facing standing pose.

const MAGIC = 'SP';

export function decodeSpr(buffer) {
  if (buffer.subarray(0, 2).toString('latin1') !== MAGIC) throw new Error('not a .spr file');
  const version = buffer.readUInt16LE(2);
  let at = 4;
  const indexedCount = buffer.readUInt16LE(at);
  at += 2;
  let rgbaCount = 0;
  if (version >= 0x200) {
    rgbaCount = buffer.readUInt16LE(at);
    at += 2;
  }

  const palette = version >= 0x101 ? buffer.subarray(buffer.length - 1024) : null;
  const frames = [];

  for (let i = 0; i < indexedCount; i += 1) {
    const width = buffer.readUInt16LE(at);
    const height = buffer.readUInt16LE(at + 2);
    at += 4;
    const pixels = new Uint8Array(width * height);
    if (version >= 0x201) {
      const length = buffer.readUInt16LE(at);
      at += 2;
      const end = at + length;
      let out = 0;
      while (at < end && out < pixels.length) {
        const byte = buffer[at++];
        if (byte !== 0) {
          pixels[out++] = byte;
          continue;
        }
        // A zero introduces a run of transparent pixels; the count follows.
        const run = buffer[at++];
        out += run === 0 ? 1 : run;
      }
    } else {
      buffer.copy(pixels, 0, at, at + width * height);
      at += width * height;
    }
    frames.push({ width, height, kind: 'indexed', pixels });
  }

  for (let i = 0; i < rgbaCount; i += 1) {
    const width = buffer.readUInt16LE(at);
    const height = buffer.readUInt16LE(at + 2);
    at += 4;
    const raw = buffer.subarray(at, at + width * height * 4);
    at += width * height * 4;
    frames.push({ width, height, kind: 'rgba', pixels: raw });
  }

  return { version, palette, frames };
}

/** One frame as straight RGBA bytes, transparency included. */
export function frameToRgba(frame, palette) {
  const out = Buffer.alloc(frame.width * frame.height * 4);
  if (frame.kind === 'rgba') {
    // Stored bottom row first, and each pixel as A,B,G,R.
    for (let y = 0; y < frame.height; y += 1) {
      for (let x = 0; x < frame.width; x += 1) {
        const from = ((frame.height - 1 - y) * frame.width + x) * 4;
        const to = (y * frame.width + x) * 4;
        out[to] = frame.pixels[from + 3];
        out[to + 1] = frame.pixels[from + 2];
        out[to + 2] = frame.pixels[from + 1];
        out[to + 3] = frame.pixels[from];
      }
    }
    return out;
  }
  if (!palette) throw new Error('an indexed frame needs a palette');
  for (let i = 0; i < frame.pixels.length; i += 1) {
    const index = frame.pixels[i];
    const at = i * 4;
    if (index === 0) continue; // transparent, and the buffer is already zeroed
    out[at] = palette[index * 4];
    out[at + 1] = palette[index * 4 + 1];
    out[at + 2] = palette[index * 4 + 2];
    out[at + 3] = 255;
  }
  return out;
}

/** The frame worth showing: the largest one. */
export function biggestFrame(sprite) {
  return sprite.frames.reduce((best, frame) => (best && best.width * best.height >= frame.width * frame.height ? best : frame), null);
}
