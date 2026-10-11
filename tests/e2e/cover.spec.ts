import { expect, test, type Page } from '@playwright/test';
import { PRODUCTS } from '../../src/content/products';
import type { NpcId, ProductId } from '../../src/content/types';
import { SLOTS } from '../../src/engine/judge';
import { act, getState, toDesign } from './helpers';

// QA r2 #0 회귀: 조립대·수정에서 슬롯을 열 때마다, 보이는 버튼·부품·칩 중심을 누르면 그 자신이 맞아야 한다(트레이·안내 줄에 가리지 않음)
const VIEWS = [[1280, 800], [1024, 640], [960, 600]] as const;
const PRODS: ProductId[] = ['desk', 'locker', 'door'];

// .parts 안에서 스크롤로 밀려난 것은 안 보이는 것으로 친다. 열린 슬롯 줄은 스크롤 없이 보여야 한다
const covered = (page: Page) =>
  page.evaluate(() => {
    const bad: string[] = [];
    for (const el of document.querySelectorAll<HTMLElement>('.stage button, .stage [role=radio]')) {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) continue;
      const x = r.x + r.width / 2, y = r.y + r.height / 2;
      const box = el.closest<HTMLElement>('.parts');
      if (box && !el.closest('.srow.now')) {
        // client* 는 무대 축소 전 px — 화면 px 로 바꾼다
        const b = box.getBoundingClientRect(), k = b.height / box.offsetHeight, top = b.top + box.clientTop * k;
        if (y < top || y > top + box.clientHeight * k) continue;
      }
      const hit = document.elementFromPoint(x, y);
      if (!hit || !el.contains(hit)) bad.push(`${el.getAttribute('aria-label') ?? el.textContent?.trim()} ← ${hit?.className}`);
    }
    return bad;
  });

for (const [w, h] of VIEWS)
  for (const large of [false, true])
    test(`가림 없음 ${w}×${h}${large ? ' 가 크게' : ''}: 제품 3 × 조립대·수정 × 슬롯 5`, async ({ page }) => {
      test.setTimeout(120_000);
      await page.addInitScript((large) => localStorage.setItem('dfa.pref', JSON.stringify({ sound: 'off', ...(large ? { text: 'large' } : {}) })), large);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      for (const product of PRODS) {
        await toDesign(page, product);
        await page.setViewportSize({ width: w, height: h });
        for (const stage of ['design', 'revise'] as const) {
          if (stage === 'revise') {
            for (const s of SLOTS) await act(page, { type: 'setPart', slotId: s, partId: PRODUCTS[product].parts[s][0].id });
            await act(page, { type: 'runTest' });
            const last = (await getState(page)).rounds[0].reactions;
            const reason = (Object.keys(last) as NpcId[]).find((n) => last[n] !== 'happy') ?? (Object.keys(last)[0] as NpcId);
            expect(await act(page, { type: 'revise', reason })).toBeNull();
          }
          await expect(page.locator(stage === 'revise' ? '.studio.revising' : '.studio .parts')).toBeVisible();
          for (let i = 0; i < SLOTS.length; i++) {
            const name = page.locator('.srow .sname').nth(i);
            await name.focus();
            await page.keyboard.press('Enter');
            await expect(name).toHaveAttribute('aria-expanded', 'true');
            await expect.poll(() => covered(page), { message: `${product} ${stage} 슬롯 ${SLOTS[i]}`, timeout: 2000 }).toEqual([]);
          }
        }
      }
    });
