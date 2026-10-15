// Reads the Ragnarok Zero client archive (GRF 0x300, signature "Event Horizon")
// that GRF Editor 1.8's GrfCL cannot open (owner, 15 Oct 2026: extracting
// data.grf is allowed). Writes:
//   <out>/index.jsonl   one line per entry: name, size, compressed, flags, offset
//   <out>/files/...     the entries whose name matches --match, decompressed
// Entries with flag 4 (header DES) are decoded first (tools/grf-des.mjs),
// checked byte for byte against the 22 Sep 2026 extraction. Flag 2 (mixed
// cipher) entries are listed but not written; files the patch adds or
// changes have so far all been flag 1, and older ones are in that extraction.
//
//   node tools/grf-extract.mjs <data.grf> <outDir> [--match <regex>]
//
// Layout (public GRF 0x300 format): 46-byte header -- 16-byte signature,
// 14-byte key, u64 table offset, u32 file count, u32 version 0x300. At
// offset + 46: u32 (unused), u32 compressed table length, u32 table length,
// then the zlib table. Each entry: name (cp949, NUL-ended), u32 compressed,
// u32 aligned, u32 size, u8 flags, u64 offset (from byte 46).
import { openSync, readSync, mkdirSync, writeFileSync, createWriteStream } from 'node:fs';
import { dirname, join } from 'node:path';
import { inflateSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { grfDecode } from './grf-des.mjs';

const [grf, out, ...rest] = process.argv.slice(2);
if (!grf || !out) throw new Error('usage: grf-extract.mjs <data.grf> <outDir> [--match <regex>]');
const mi = rest.indexOf('--match');
const match = new RegExp(mi >= 0 ? rest[mi + 1] : '\\.(lub|lua|txt|csv|xml|bson|scp|json)$', 'i');

const fd = openSync(grf, 'r');
const read = (pos, len) => { const b = Buffer.alloc(len); readSync(fd, b, 0, len, pos); return b; };
const head = read(0, 46);
const sig = head.subarray(0, 15).toString('latin1');
const tableOffset = Number(head.readBigUInt64LE(30));
const version = head.readUInt32LE(42);
if (version !== 0x300) throw new Error(`not GRF 0x300 (got 0x${version.toString(16)}, signature ${sig})`);
const th = read(tableOffset + 46, 12);
const zlen = th.readUInt32LE(4);
const len = th.readUInt32LE(8);
const table = inflateSync(read(tableOffset + 46 + 12, zlen));
if (table.length !== len) throw new Error(`table length ${table.length} != ${len}`);

const cp949 = new TextDecoder('euc-kr');
mkdirSync(out, { recursive: true });
const index = createWriteStream(join(out, 'index.jsonl'));
let p = 0, entries = 0, written = 0, skippedCrypt = 0, failed = 0;
while (p < table.length) {
  const end = table.indexOf(0, p);
  const name = cp949.decode(table.subarray(p, end)).replace(/\\/g, '/');
  p = end + 1;
  const compressed = table.readUInt32LE(p);
  const aligned = table.readUInt32LE(p + 4);
  const size = table.readUInt32LE(p + 8);
  const flags = table.readUInt8(p + 12);
  const offset = Number(table.readBigUInt64LE(p + 13));
  p += 21;
  entries++;
  const row = { name, size, compressed, flags, offset };
  if ((flags & 1) && match.test(name)) {
    // Flag 2 (mixed cipher) does not decode correctly yet: skipped, listed.
    // Flag 4 (header only) matches the 22 Sep extraction byte for byte.
    if (flags & 2) { skippedCrypt++; index.write(JSON.stringify(row) + '\n'); continue; }
    {
      try {
        const raw = grfDecode(read(offset + 46, aligned), flags, compressed);
        const data = compressed === size && compressed === aligned ? raw : inflateSync(raw.subarray(0, compressed));
        const dest = join(out, 'files', name);
        mkdirSync(dirname(dest), { recursive: true });
        writeFileSync(dest, data);
        row.sha256 = createHash('sha256').update(data).digest('hex');
        written++;
      } catch (e) {
        row.error = String(e.message ?? e);
        failed++;
      }
    }
  }
  index.write(JSON.stringify(row) + '\n');
}
index.end();
console.log(JSON.stringify({ signature: sig, version: '0x300', entries, written, skippedCrypt, failed }));
