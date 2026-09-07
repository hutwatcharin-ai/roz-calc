import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import FooterSection from '@/components/FooterSection';
import MonsterDamageCalculator, { type CalcMonster } from '@/components/MonsterDamageCalculator';

const monsters: CalcMonster[] = Array.from({ length: 12 }, (_, index) => ({
  id: index + 1,
  name_en: `Monster ${index + 1}`,
  level: index + 1,
  hp: 100,
  base_exp: 10,
  def: 0,
  vit: 1,
  size: 'Medium',
  element: 'Neutral',
  element_level: 1,
  hit_100: 180,
}));

describe('compact UX shell', () => {
  it('keeps footer links in server-rendered HTML while starting collapsed on mobile', () => {
    const html = renderToStaticMarkup(
      <FooterSection title="Database"><a href="/database/monsters">Monsters</a></FooterSection>,
    );
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('href="/database/monsters"');
  });

  it('does not render the first forty monsters before a player searches', () => {
    const html = renderToStaticMarkup(
      <MonsterDamageCalculator monsters={monsters} initialMonsterId={null} />,
    );
    expect(html).not.toContain('Monster 1');
    expect(html).toContain('เลือกมอนสเตอร์ที่จะคำนวณ');
  });

  it('keeps a deep-linked monster visible without rendering the suggestion wall', () => {
    const html = renderToStaticMarkup(
      <MonsterDamageCalculator monsters={monsters} initialMonsterId={3} />,
    );
    expect(html).toContain('เลือกอยู่:');
    expect(html).toContain('Monster 3');
    expect(html).not.toContain('Monster 4');
  });
});
