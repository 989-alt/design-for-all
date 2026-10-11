import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, type Locator, type Page } from '@playwright/test';
import type { GameState, Stage } from '../../src/engine/types';
import { badPolicy, goodPolicy, type Policy } from '../../src/game/autopilot';
import { act, getState, open } from './helpers';

// seeded 완주 두 경로. 화면은 클릭 대신 __dfa.dispatch 로 넘기되, 화면이 바뀔 때마다 그 화면의 핵심 요소가 보이는지 본다
const SEED = 20261011;
const KEY: Record<Exclude<Stage, 'title'>, (p: Page) => Locator> = {
  cases: (p) => p.locator('.stage #case-h'),
  classroom: (p) => p.locator('.stage .npc-hit').first(),
  pick: (p) => p.locator('.stage #pick-h'),
  research: (p) => p.locator('.stage .refs'),
  design: (p) => p.locator('.stage .tray .go'),
  test: (p) => p.locator('.stage .test-strip'),
  revise: (p) => p.locator('.stage .tray .go'),
  reflect: (p) => p.locator('.stage .tags'),
  result: (p) => p.getByRole('region', { name: '디자인 카드' }),
};

// 연출이 끝날 때까지: 테스트 반응 차례 등장 + 유한 CSS 애니메이션
const settle = (page: Page) =>
  page.evaluate(async () => {
    await new Promise(requestAnimationFrame);
    while (document.querySelector('.tp.wait')) await new Promise((r) => setTimeout(r, 50));
    await Promise.all(document.getAnimations().filter((a) => a.effect?.getComputedTiming().endTime !== Infinity).map((a) => a.finished.catch(() => {})));
  });

async function drive(page: Page, policy: Policy, restoreAtDesign = false) {
  await page.clock.setFixedTime(new Date('2026-10-11T09:00:00+09:00')); // 결과 JSON 의 시각을 고정
  await open(page, SEED);
  expect(await act(page, { type: 'start', seed: SEED })).toBeNull();
  let anim = 0;
  let seen: Stage = 'title';
  let restored = false;
  for (let i = 0; i < 200; i++) {
    let s = await getState(page);
    if (s.stage !== seen) await expect(KEY[(seen = s.stage) as Exclude<Stage, 'title'>](page), s.stage).toBeVisible();
    const t0 = Date.now();
    await settle(page);
    anim += Date.now() - t0;

    // 중단 복구: 조립 도중 새로고침 → 이어하기 → 같은 상태
    if (restoreAtDesign && !restored && s.stage === 'design' && Object.keys(s.draft.slots).length === 2) {
      await page.reload();
      await page.getByRole('button', { name: '이어하기' }).click();
      await expect(KEY.design(page)).toBeVisible();
      expect(await getState(page)).toEqual(s);
      restored = true;
      s = await getState(page);
    }

    const a = policy(s);
    if (!a) return { s, anim, restored };
    expect(await act(page, a), JSON.stringify(a)).toBeNull();
  }
  throw new Error('200 액션 안에 끝나지 않음');
}

// S8: 화면 전환 ≤20 · 대화 ≤12 · 연출 ≤2분
function expectS8(s: GameState, anim: number) {
  expect(s.log.filter((l) => l.e === 'stage').length).toBeLessThanOrEqual(20);
  expect(s.log.filter((l) => l.e === 'talk').length).toBeLessThanOrEqual(12);
  expect(anim).toBeLessThanOrEqual(120_000);
}

const exportResult = (page: Page) =>
  page.evaluate(() => (window as unknown as { __dfa: { exportResult: () => GameState & { verdict: { grade: string; S8: boolean } } } }).__dfa.exportResult());

test('좋은 플레이 완주 → master, 중단 복구, 결과 JSON 픽스처', async ({ page }, info) => {
  test.setTimeout(180_000);
  const { s, anim, restored } = await drive(page, goodPolicy, true);
  expect(restored).toBe(true);
  expect(s.stage).toBe('result');
  expectS8(s, anim);

  const r = await exportResult(page);
  expect(r.verdict).toMatchObject({ S1: true, S2: true, S3: true, S4: true, S5: true, S6: true, S8: true, grade: 'master' });
  expect(r.feedback).not.toContain('bus');
  // 개인정보 없음: 키는 상태·점수·판정뿐, 이름·연락처 같은 필드 없음
  expect(Object.keys(r).sort()).toEqual(['collected', 'draft', 'feedback', 'firstCorrect', 'log', 'npcOrder', 'product', 'reflect', 'refOrder', 'research', 'rounds', 'scores', 'seed', 'stage', 'startedAt', 'tags', 'v', 'verdict'].sort());
  expect(JSON.stringify(r)).not.toMatch(/"(name|email|student|user|ip)"/i);
  expect(r.seed).toBe(SEED);
  writeFileSync(join(info.project.testDir, 'fixtures/last-result.json'), JSON.stringify(r, null, 2) + '\n');
});

test('나쁜 플레이 완주 → apprentice, 저상 버스 피드백, 색만 수정', async ({ page }) => {
  test.setTimeout(180_000);
  const { s, anim } = await drive(page, badPolicy);
  expect(s.stage).toBe('result');
  expectS8(s, anim);
  const r = await exportResult(page);
  expect(r.verdict.grade).toBe('apprentice');
  expect(r.verdict.S8).toBe(true);
  expect(r.feedback).toContain('bus');
  expect(s.log.some((l) => l.e === 'cosmetic_only')).toBe(true);
  await expect(page.getByRole('region', { name: '디자인 카드' }).locator('.grade')).toHaveText('견습 디자이너');
});
