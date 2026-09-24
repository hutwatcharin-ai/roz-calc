import { describe, expect, it } from 'vitest';
import { isSpacerLine, segments, stripCodes, waypoints } from './color-codes';

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

// 147 item descriptions carry the client's waypoint markup (checked 24 Sep
// 2026). Printed raw it reads as "<NAVI>[Name]<INFO>map,x,y,0,100,0,0</INFO>
// </NAVI>", which is exactly how it reached a guide table unnoticed.
describe('client waypoints', () => {
  const LINE = 'Collect a certain amount and bring them to <NAVI>[Nagging Old Man]<INFO>prontera,272,260,0,100,0,0</INFO></NAVI> to activate the weapon.';

  it('reads the name, map and coordinates', () => {
    expect(waypoints(LINE)).toEqual([{ name: 'Nagging Old Man', map: 'prontera', x: 272, y: 260 }]);
  });

  it('turns the markup into readable text with a link to the map', () => {
    expect(segments(LINE)).toEqual([
      { text: 'Collect a certain amount and bring them to ', tone: 'default' },
      { text: 'Nagging Old Man (prontera 272,260)', tone: 'accent', href: '/database/maps/prontera' },
      { text: ' to activate the weapon.', tone: 'default' },
    ]);
  });

  it('leaves no angle bracket behind in plain text either', () => {
    const plain = stripCodes(LINE);
    expect(plain).not.toContain('<');
    expect(plain).toContain('Nagging Old Man (prontera 272,260)');
  });

  // The Thai text colours the NPC's name, so codes sit inside the markup.
  // Missing that left the Thai line printing raw while the English was clean.
  it('handles the colour codes the Thai text puts inside the markup', () => {
    const thai = 'นำไปให้ ^0000FF<NAVI>^000088[Nagging Old Man]^000000<INFO>prontera,272,260,0,100,0,0</INFO></NAVI>^000000 เพื่อปลุก';
    expect(segments(thai)).toEqual([
      { text: 'นำไปให้ ', tone: 'default' },
      { text: 'Nagging Old Man (prontera 272,260)', tone: 'accent', href: '/database/maps/prontera' },
      { text: ' เพื่อปลุก', tone: 'default' },
    ]);
    expect(stripCodes(thai)).not.toContain('<');
  });

  it('keeps the colour that was running before the waypoint', () => {
    expect(segments('^777777ไปหา <NAVI>[Stylist]<INFO>itemmall,19,71,0,100,0,0</INFO></NAVI> ได้เลย^000000')).toEqual([
      { text: 'ไปหา ', tone: 'muted' },
      { text: 'Stylist (itemmall 19,71)', tone: 'accent', href: '/database/maps/itemmall' },
      { text: ' ได้เลย', tone: 'muted' },
    ]);
  });
});
