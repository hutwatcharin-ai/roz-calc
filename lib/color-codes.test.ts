import { describe, expect, it } from 'vitest';
import { isSpacerLine, segments, stripCodes } from './color-codes';

describe('client colour codes', () => {
  it('splits a label line into default and muted parts', () => {
    expect(segments('น้ำหนัก : ^77777720^000000')).toEqual([
      { text: 'น้ำหนัก : ', tone: 'default' },
      { text: '20', tone: 'muted' },
    ]);
  });

  it('marks the client highlight colours as accent', () => {
    expect(segments('^000088ฟื้นฟู HP ประมาณ 45^000000')).toEqual([{ text: 'ฟื้นฟู HP ประมาณ 45', tone: 'accent' }]);
  });

  it('recognises the blank spacer line', () => {
    expect(isSpacerLine('^FFFFFF_^000000')).toBe(true);
    expect(isSpacerLine('^ffffff_^000000')).toBe(true);
    expect(isSpacerLine('น้ำหนัก : 20')).toBe(false);
  });

  it('strips codes for plain text', () => {
    expect(stripCodes('ประเภท : ^777777Footgear^000000')).toBe('ประเภท : Footgear');
  });
});
