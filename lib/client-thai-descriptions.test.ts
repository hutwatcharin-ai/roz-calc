import { describe, expect, it } from 'vitest';
import file from '@/data/item-descriptions-th.json';
import { CLIENT_THAI_COUNT, clientThaiDescription } from './client-thai-descriptions';

const data = file as { _meta: Record<string, unknown>; items: Record<string, string[]> };

describe('the client Thai descriptions', () => {
  it('carries a real batch', () => {
    expect(CLIENT_THAI_COUNT).toBeGreaterThan(150);
    expect(clientThaiDescription(501)?.[0]).toContain('HP');
    expect(clientThaiDescription(501)?.[0]).toContain('45');
    expect(clientThaiDescription(-1)).toBeNull();
  });

  it('publishes Thai prose and nothing else', () => {
    // Korean resource names read through TIS-620 land on Thai code points --
    // "น฿ภฺฑนภฬฦๅฦฎ" is one -- so a range check alone let them through. Real
    // prose has a vowel and an everyday word; that is what shipped this file.
    const vowel = /[ะัาำิีึืุูเแโใไ่้๊๋็์ํ]/;
    const words = /(ที่|ใช้|ได้|เป็น|ของ|สำหรับ|จาก|และ|ไม่|ให้|มี|ทำ|เพิ่ม|ฟื้น|หรือ|ตัว|คน|เมื่อ|ถ้า|กับ|ใน|นี้|ความ|อาการ|สามารถ|ชนิด|แบบ)/;
    for (const [id, lines] of Object.entries(data.items)) {
      expect(lines.length, id).toBeGreaterThan(0);
      for (const line of lines) {
        expect(vowel.test(line), `${id}: ${line}`).toBe(true);
        expect(words.test(line), `${id}: ${line}`).toBe(true);
      }
    }
  });

  it('never carries the weight line, which the page prints from our own column', () => {
    for (const [id, lines] of Object.entries(data.items)) {
      for (const line of lines) expect(line.startsWith('น้ำหนัก'), id).toBe(false);
    }
  });

  it('records the gate it was built with', () => {
    // The file has to travel with the reason it is trustworthy: it comes from
    // a different game's client, and only the rows whose numbers matched our
    // own English text are in it.
    expect(String(data._meta.gate)).toContain('number');
    expect(String(data._meta.caveat)).toContain('client');
    expect(Number(data._meta.published)).toBe(CLIENT_THAI_COUNT);
  });
});
