import { expect, test, type Page } from '@playwright/test';
import { CASES } from '../../src/content/cases';
import { ELEMENTS } from '../../src/content/elements';
import { act, getState, open, tagAllCases } from './helpers';

const next = (page: Page) => page.locator('.next-bar .k-btn');
const msg = (page: Page) => page.locator('.next-bar .msg');

test('토글: html data 속성 즉시 반영 · dfa.pref 저장 · 새로고침 유지', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: '가 크게' }).click();
  await page.getByRole('button', { name: '고대비' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-text', 'large');
  await expect(page.locator('html')).toHaveAttribute('data-contrast', 'high');
  expect(JSON.parse((await page.evaluate(() => localStorage.getItem('dfa.pref')))!)).toEqual({ text: 'large', contrast: 'high' });
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-text', 'large');
  await expect(page.getByRole('button', { name: '고대비' })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: '가 크게' }).click();
  await expect(page.locator('html')).not.toHaveAttribute('data-text', 'large');
  expect(JSON.parse((await page.evaluate(() => localStorage.getItem('dfa.pref')))!)).toEqual({ contrast: 'high' });
  // 소리: 기본 켬, 끄면 저장
  const sound = page.getByRole('button', { name: '소리' });
  await expect(sound).toHaveAttribute('aria-pressed', 'true');
  await sound.click();
  await expect(sound).toHaveAttribute('aria-pressed', 'false');
  expect(JSON.parse((await page.evaluate(() => localStorage.getItem('dfa.pref')))!)).toEqual({ contrast: 'high', sound: 'off' });
  await page.reload();
  await expect(page.getByRole('button', { name: '소리' })).toHaveAttribute('aria-pressed', 'false');
});

test('자동 조작: ?e2e=1 에만 window.__dfa', async ({ page }) => {
  await page.goto('/');
  expect(await page.evaluate(() => 'dfa' in window || '__dfa' in window)).toBe(false);
  await open(page);
  expect((await getState(page)).stage).toBe('title');
});

test('글자 면 중심: .k-btn·.k-tool 라벨 중심 오차 ≤3px', async ({ page }) => {
  await open(page);
  await page.evaluate(() => document.fonts.ready);
  const check = () =>
    page.$$eval('.k-btn, .k-tool', (els) =>
      els.map((el) => {
        const b = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        const [t, r, bt, l] = [cs.borderTopWidth, cs.borderRightWidth, cs.borderBottomWidth, cs.borderLeftWidth].map(parseFloat);
        const s = el.querySelector('.lbl > span')!.getBoundingClientRect();
        const fx = b.left + l + (b.width - l - r) / 2;
        const fy = b.top + t + (b.height - t - bt) / 2;
        return Math.max(Math.abs(s.left + s.width / 2 - fx), Math.abs(s.top + s.height / 2 - fy));
      }),
    );
  for (const d of await check()) expect(d).toBeLessThanOrEqual(3);
  await page.getByRole('button', { name: '시작' }).click();
  await page.getByRole('button', { name: '최신성' }).click(); // 사례 화면 버튼도 잰다
  const ds = await check();
  expect(ds.length).toBeGreaterThan(6);
  for (const d of ds) expect(d).toBeLessThanOrEqual(3);
});

test('본 흐름: 연타·사례 오답 재시도·교실 수집·제품·조사 탭 2번', async ({ page }) => {
  await open(page, 7);

  // 연타: 시작 더블클릭 → 1단계만
  await page.getByRole('button', { name: '시작' }).dblclick();
  expect((await getState(page)).stage).toBe('cases');

  // 사례: 태깅 전 뒷면 없음 → 오답 → 뒷면·다시 → 정답. 첫 시도 정오만 남는다
  await expect(page.locator('.back')).toHaveCount(0);
  await expect(next(page)).toHaveAttribute('aria-disabled', 'true');
  await expect(msg(page)).toHaveText('사례 카드 7장을 모두 골라야 해요');
  await page.getByRole('button', { name: '아름다움' }).click();
  await expect(page.locator('.back')).toContainText('다시 골라 봐요');
  await expect(page.locator('.back')).toContainText('눈 모양 카메라');
  await page.getByRole('button', { name: '최신성' }).click();
  await expect(page.locator('.back')).toContainText('맞았어요');
  const t0 = (await getState(page)).tags[0];
  expect(t0).toEqual({ caseId: 'case-01', tried: ['beauty', 'tech'], correct: true });
  // 나머지 6장은 버튼으로
  for (let i = 1; i < CASES.length; i++) {
    await page.getByRole('button', { name: new RegExp(`^${i + 1}번`) }).click();
    await expect(page.locator('.back')).toHaveCount(0); // 둘째 사례부터도 태깅 전 뒷면 없음
    await page.getByRole('button', { name: ELEMENTS.find((e) => e.id === CASES[i].main)!.name }).click();
  }
  expect((await getState(page)).tags.every((t) => t.correct)).toBe(true);
  await expect(next(page)).not.toHaveAttribute('aria-disabled', 'true');
  await next(page).dblclick();
  expect((await getState(page)).stage).toBe('classroom');

  // 교실: 히트 영역 6개 ≥48px, Tab 순서 왼→오
  const boxes = await page.locator('.npc-hit').evaluateAll((els) => els.map((e) => e.getBoundingClientRect()));
  expect(boxes).toHaveLength(6);
  for (const b of boxes) expect(Math.min(b.width, b.height)).toBeGreaterThanOrEqual(48);
  for (let i = 1; i < 6; i++) expect(boxes[i].left).toBeGreaterThan(boxes[i - 1].left);
  await page.locator('.npc-hit').first().focus();
  const order = [await page.evaluate(() => document.activeElement!.getAttribute('aria-label'))];
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press('Tab');
    order.push(await page.evaluate(() => document.activeElement!.getAttribute('aria-label')));
  }
  expect(order).toEqual(['서윤 · 휠체어를 타요', '도현 · 키가 커요', '하준 · 팔에 깁스를 했어요', '지안 · 눈이 잘 안 보여요', '하은 · 도우미 활동을 온 1학년이에요', '할머니 · 손목과 무릎이 아픈 손님이에요']);

  const take = page.getByRole('button', { name: '불편 카드 받기' });
  await page.getByRole('button', { name: '서윤 · 휠체어를 타요' }).click();
  await expect(page.locator('.speech')).toContainText('책상 밑에 휠체어가 안 들어가');
  await take.dblclick(); // 연타: 카드 +1 만
  expect((await getState(page)).collected).toEqual(['C01']);
  for (let i = 0; i < 2; i++) await take.click();
  await expect(page.locator('.speech p')).toHaveText('고마워!');
  await expect(take).toHaveCount(0);
  await page.getByRole('button', { name: '도현 · 키가 커요' }).click();
  await take.click();
  // 4장이지만 2명 → 막힘
  await expect(next(page)).toHaveAttribute('aria-disabled', 'true');
  await expect(msg(page)).toHaveText('3명에게 4장을 받아야 해요');
  await next(page).click({ force: true });
  expect((await getState(page)).stage).toBe('classroom');
  // 같은 NPC 두 번째 대화: 남은 카드만
  await page.getByRole('button', { name: '서윤 · 휠체어를 타요' }).click();
  await expect(page.locator('.speech p')).toHaveText('고마워!');
  await page.getByRole('button', { name: '도현 · 키가 커요' }).click();
  await expect(page.locator('.speech')).toContainText('아래 칸은 허리를 많이 숙여야 해');
  await page.getByRole('button', { name: '하준 · 팔에 깁스를 했어요' }).click();
  await take.click();
  expect((await getState(page)).collected).toEqual(['C01', 'C02', 'C03', 'C04', 'C06']);
  await expect(page.locator('.counter')).toContainText('불편 카드 5 장 · 사용자 3 명');
  await expect(next(page)).not.toHaveAttribute('aria-disabled', 'true');
  await next(page).dblclick();
  expect((await getState(page)).stage).toBe('pick');

  // 제품 선택
  await expect(msg(page)).toHaveText('고칠 제품을 하나 골라야 해요');
  await page.getByRole('radio', { name: /책상/ }).click();
  await expect(page.locator('.pick-cards .tcard')).toHaveCount(3);
  await expect(page.locator('.warn')).toHaveCount(0);
  await next(page).dblclick();
  expect((await getState(page)).stage).toBe('research');

  // 조사: 클릭 탭 2번 + 키보드 Enter 탭 2번
  await expect(page.locator('.ref')).toHaveCount(12);
  await expect(msg(page)).toHaveText('참고 카드 2장을 불편 카드에 이어야 해요');
  // 연결 대상은 고른 제품(책상)의 불편 카드만
  await expect(page.locator('.targets .tcard')).toHaveText([/책상 밑에 휠체어가 안 들어가/, /책상이 낮아 무릎이 부딪혀/, /책상을 옮기기 힘들어/]);
  await page.locator('[data-ref=ref-07]').click();
  await page.locator('.tcard', { hasText: '책상을 옮기기 힘들어' }).click();
  await page.locator('[data-ref=ref-12]').focus();
  await page.keyboard.press('Enter');
  await page.locator('.tcard', { hasText: '책상이 낮아 무릎이 부딪혀' }).focus();
  await page.keyboard.press('Enter');
  expect((await getState(page)).research).toEqual([
    { refId: 'ref-07', cardId: 'C06' },
    { refId: 'ref-12', cardId: 'C04' },
  ]);
  await expect(page.locator('[data-ref=ref-07]')).toContainText('→ 하준');
  // 셋째 참고 카드: 거부 + 안내
  await page.locator('[data-ref=ref-01]').click();
  await expect(msg(page)).toHaveText('참고 카드는 2장까지 골라요');
  expect((await getState(page)).research).toHaveLength(2);
  await expect(next(page)).not.toHaveAttribute('aria-disabled', 'true');
  await next(page).dblclick();
  expect((await getState(page)).stage).toBe('design');
});

test('제품 카드 0장(사물함): 다음 막힘·안내, 다른 제품을 고르면 진행 (판정 D1)', async ({ page }) => {
  await open(page);
  await tagAllCases(page);
  await act(page, { type: 'nextStage' });
  for (const [npcId, cards] of [['dohyun', ['C04']], ['hajun', ['C06', 'C07']], ['jian', ['C09']]] as const) {
    await act(page, { type: 'talk', npcId });
    for (const cardId of cards) await act(page, { type: 'takeCard', cardId });
  }
  await act(page, { type: 'nextStage' });
  await expect(page.locator('.picks')).toBeVisible();
  await page.getByRole('radio', { name: /사물함/ }).click();
  await expect(page.locator('.warn')).toHaveText('모은 불편 카드 중에 사물함 카드가 없어요');
  await expect(next(page)).toHaveAttribute('aria-disabled', 'true');
  await expect(page.locator('.next-bar .msg')).toHaveText('고른 제품의 불편 카드가 있어야 해요');
  await next(page).click({ force: true });
  expect((await getState(page)).stage).toBe('pick');
  await page.getByRole('radio', { name: /책상/ }).click();
  await expect(next(page)).not.toHaveAttribute('aria-disabled', 'true');
  await next(page).click();
  expect((await getState(page)).stage).toBe('research');
});
