// Just what lib/build-card.ts uses of omggif (no published types).
declare module 'omggif' {
  export class GifReader {
    constructor(buf: Uint8Array);
    width: number;
    height: number;
    decodeAndBlitFrameRGBA(frame: number, pixels: Uint8Array): void;
  }
}
