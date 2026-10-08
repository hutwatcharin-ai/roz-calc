import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import FooterSection from '@/components/FooterSection';

describe('compact UX shell', () => {
  it('keeps footer links in server-rendered HTML while starting collapsed on mobile', () => {
    const html = renderToStaticMarkup(
      <FooterSection title="Database"><a href="/database/monsters">Monsters</a></FooterSection>,
    );
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('href="/database/monsters"');
  });
});
