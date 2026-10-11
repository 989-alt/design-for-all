// ?e2e=1 로 열고 window.__dfa 로 상태를 읽고 액션을 보낸다 (T09 재사용)
import { expect, type Page } from '@playwright/test';
import type { CardId, NpcId, ProductId } from '../../src/content/types';
import type { Action, GameState, Reject } from '../../src/engine/types';
import { CASES } from '../../src/content/cases';

type Dfa = { dispatch: (a: Action) => { rejected?: Reject }; getState: () => GameState };

export async function open(page: Page, seed = 1) {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(`/?e2e=1&seed=${seed}`);
}

export const getState = (page: Page) => page.evaluate(() => (window as unknown as { __dfa: Dfa }).__dfa.getState());

export const act = (page: Page, a: Action) =>
  page.evaluate((a) => (window as unknown as { __dfa: Dfa }).__dfa.dispatch(a).rejected ?? null, a);

// 타이틀 → 사례 7장 정답 태깅까지
export async function tagAllCases(page: Page, seed = 1) {
  await act(page, { type: 'start', seed });
  for (const c of CASES) await act(page, { type: 'tagCase', caseId: c.id, elementId: c.main });
}

// 책상 카드 6장을 다 모으고 조사 2장을 이어 조립대(design)까지
export async function toDesign(page: Page, productId: ProductId = 'desk') {
  await open(page);
  await tagAllCases(page);
  await act(page, { type: 'nextStage' });
  const desk: [NpcId, CardId][] = [['seoyun', 'C01'], ['dohyun', 'C04'], ['hajun', 'C06'], ['jian', 'C09'], ['haeun', 'C14'], ['grandma', 'C17']];
  for (const [npcId, cardId] of desk) {
    await act(page, { type: 'talk', npcId });
    await act(page, { type: 'takeCard', cardId });
  }
  // 고른 제품 카드가 없으면 pick 을 못 지나간다(판정 D1) — 서윤의 그 제품 카드 1장
  if (productId !== 'desk') await act(page, { type: 'takeCard', cardId: productId === 'door' ? 'C03' : 'C02' });
  await act(page, { type: 'nextStage' });
  await act(page, { type: 'pickProduct', productId });
  await act(page, { type: 'nextStage' });
  await act(page, { type: 'pickRef', refId: 'ref-07' });
  await act(page, { type: 'linkRef', refId: 'ref-07', cardId: 'C06' });
  await act(page, { type: 'pickRef', refId: 'ref-02' });
  await act(page, { type: 'linkRef', refId: 'ref-02', cardId: 'C04' });
  await act(page, { type: 'nextStage' });
  expect((await getState(page)).stage).toBe('design');
}
