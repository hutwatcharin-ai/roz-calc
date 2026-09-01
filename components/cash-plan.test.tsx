// Basket flow without a browser: add twice + another item, expect the bar to
// total the KP, price it in baht, and spell out the gnjoy packs to buy.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { CashPlanBar, CashPlanButton, CashPlanProvider } from './CashPlan';

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  localStorage.clear();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function clickPlus(name: string) {
  const btn = [...container.querySelectorAll('button')].find((b) => b.getAttribute('aria-label') === `เพิ่ม ${name} เข้าแผนเติมเงิน`)!;
  act(() => btn.dispatchEvent(new MouseEvent('click', { bubbles: true })));
}

describe('cash plan basket', () => {
  it('totals items and spells out the top-up packs', () => {
    act(() =>
      root.render(
        <CashPlanProvider>
          <CashPlanButton id={1} name="EXP Box" kp={5000} />
          <CashPlanButton id={2} name="Drop Box" kp={1300} />
          <CashPlanBar />
        </CashPlanProvider>,
      ),
    );
    clickPlus('EXP Box');
    clickPlus('EXP Box');
    clickPlus('Drop Box');
    const text = container.textContent ?? '';
    // 5,000*2 + 1,300 = 11,300 KP -> buy 12,000 (10,000 + 1,000x2) = ฿384
    expect(text).toContain('11,300');
    expect(text).toContain('10,000');
    expect(text).toContain('1,000×2');
    expect(text).toContain('฿384');
    expect(text).toContain('เหลือ 700 KP');
  });

  it('remove steps quantity down and the bar hides when empty', () => {
    act(() =>
      root.render(
        <CashPlanProvider>
          <CashPlanButton id={1} name="EXP Box" kp={5000} />
          <CashPlanBar />
        </CashPlanProvider>,
      ),
    );
    clickPlus('EXP Box');
    const minus = [...container.querySelectorAll('button')].find((b) => b.getAttribute('aria-label') === 'เอา EXP Box ออก 1 ชิ้น')!;
    act(() => minus.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    expect(container.querySelector('.cashplan__bar')).toBeNull();
  });
});
