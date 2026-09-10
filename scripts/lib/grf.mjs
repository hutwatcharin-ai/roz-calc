// A reader for GRF archives (the RO client's data files).
//
// Format, version 0x200, which is what every modern client ships:
//
//   0x00  "Master of Magic\0"
//   0x0F  15 bytes of key material, unused at this version
//   0x1E  uint32 offset of the file table, counted from 0x2E
//   0x22  uint32 seed, 0x26 uint32 fileCount + seed + 7, 0x2A uint32 version
//   then, at 0x2E + offset: uint32 compressed size, uint32 real size, and a
//   zlib stream holding the table.
//
//   Each table entry: the file name as NUL-terminated bytes, then 17 bytes --
//   compressed size, size on disk, real size, one flag byte, offset.
//
// Names are cp949 (Korean) bytes. They are kept as raw bytes here and only
// decoded when something needs to read them, because the paths this repo looks
// up -- item icons named after a Korean resource string -- match byte for byte
// and would not survive a round trip through a codepage.

import fs from 'node:fs';
import zlib from 'node:zlib';

const MAGIC = 'Master of Magic';
const HEADER = 0x2e;

export class Grf {
  /** @param {string} file */
  constructor(file) {
    this.path = file;
    this.fd = fs.openSync(file, 'r');
    const header = Buffer.alloc(HEADER);
    fs.readSync(this.fd, header, 0, HEADER, 0);
    if (header.subarray(0, MAGIC.length).toString('latin1') !== MAGIC) {
      throw new Error(`${file} is not a GRF (no "${MAGIC}" magic)`);
    }
    this.version = header.readUInt32LE(0x2a);
    if (this.version !== 0x200) throw new Error(`${file} is GRF version 0x${this.version.toString(16)}, only 0x200 is supported`);
    const tableOffset = header.readUInt32LE(0x1e);
    const seed = header.readUInt32LE(0x22);
    const count = header.readUInt32LE(0x26) - seed - 7;

    const sizes = Buffer.alloc(8);
    fs.readSync(this.fd, sizes, 0, 8, HEADER + tableOffset);
    const compressed = Buffer.alloc(sizes.readUInt32LE(0));
    fs.readSync(this.fd, compressed, 0, compressed.length, HEADER + tableOffset + 8);
    const table = zlib.inflateSync(compressed);

    /** @type {Map<string, {offset:number, packed:number, packedAligned:number, real:number, flags:number}>} */
    this.entries = new Map();
    let at = 0;
    for (let i = 0; i < count && at < table.length; i += 1) {
      const end = table.indexOf(0, at);
      if (end === -1) break;
      // latin1 keeps one byte per character, so the key is the original bytes.
      const name = table.subarray(at, end).toString('latin1');
      at = end + 1;
      const packed = table.readUInt32LE(at);
      const packedAligned = table.readUInt32LE(at + 4);
      const real = table.readUInt32LE(at + 8);
      const flags = table.readUInt8(at + 12);
      const offset = table.readUInt32LE(at + 13);
      at += 17;
      // flag bit 0 means "this is a file"; a directory entry has no data.
      if (flags & 1) this.entries.set(name, { offset, packed, packedAligned, real, flags });
    }
    fs.closeSync(this.fd);
    this.fd = null;
  }

  /** Every entry name, as raw-byte latin1 strings. */
  names() {
    return [...this.entries.keys()];
  }

  /** The contents of one entry, or null when the archive does not have it. */
  read(name) {
    const entry = this.entries.get(name);
    if (!entry) return null;
    // Bits 1 and 2 mark DES-encrypted entries. Client art is not encrypted in
    // any GRF this repo has needed to read; refusing is better than handing
    // back scrambled bytes that look like a corrupt file.
    if (entry.flags & 0x06) return null; // DES-encrypted; this reader does not do those
    // A patch archive marks a removed file by keeping the name with no data.
    // That is not an error, it is "ask the next archive".
    if (entry.packed === 0 || entry.real === 0) return null;
    const fd = fs.openSync(this.path, 'r');
    try {
      const buffer = Buffer.alloc(entry.packedAligned);
      fs.readSync(fd, buffer, 0, entry.packedAligned, HEADER + entry.offset);
      let out;
      try {
        out = zlib.inflateSync(buffer.subarray(0, entry.packed));
      } catch {
        // Some entries are stored, not deflated. The flag byte does not say
        // so, and the client simply tries both.
        out = buffer.subarray(0, entry.real);
      }
      return out.length === entry.real ? out : null;
    } finally {
      fs.closeSync(fd);
    }
  }
}

/** Open several GRFs in DATA.INI order; the first one holding a name wins. */
export class GrfSet {
  /** @param {string[]} files */
  constructor(files) {
    this.archives = files.map((file) => new Grf(file));
  }

  read(name) {
    for (const archive of this.archives) {
      const data = archive.entries.has(name) ? archive.read(name) : null;
      if (data) return data;
    }
    return null;
  }

  /** @param {(name: string) => boolean} predicate */
  find(predicate) {
    const seen = new Set();
    for (const archive of this.archives) {
      for (const name of archive.entries.keys()) if (!seen.has(name) && predicate(name)) seen.add(name);
    }
    return [...seen];
  }
}
