// ?e2e=1 로 열고 window.__dfa 로 상태를 읽고 액션을 보낸다 (T09 재사용)
import type { Page } from '@playwright/test';
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
