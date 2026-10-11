import { expect, test, type Page } from '@playwright/test';
import type { CardId, NpcId } from '../../src/content/types';
import { act, getState, open, tagAllCases } from './helpers';

// 책상: 카드 6·조사 2 → 1차 테스트 → 수정 1회(서윤) → 재테스트 → 돌아보기
async function toReflect(page: Page) {
  await open(page);
  await tagAllCases(page);
  await act(page, { type: 'nextStage' });
  const desk: [NpcId, CardId][] = [['seoyun', 'C01'], ['dohyun', 'C04'], ['hajun', 'C06'], ['jian', 'C09'], ['haeun', 'C14'], ['grandma', 'C17']];
  for (const [npcId, cardId] of desk) {
    await act(page, { type: 'talk', npcId });
    await act(page, { type: 'takeCard', cardId });
  }
  for (const a of [
    { type: 'nextStage' }, { type: 'pickProduct', productId: 'desk' }, { type: 'nextStage' },
    { type: 'pickRef', refId: 'ref-07' }, { type: 'linkRef', refId: 'ref-07', cardId: 'C06' },
    { type: 'pickRef', refId: 'ref-02' }, { type: 'linkRef', refId: 'ref-02', cardId: 'C04' }, { type: 'nextStage' },
    { type: 'setPart', slotId: 'form', partId: 'desk-form-2' }, { type: 'setPart', slotId: 'funcA', partId: 'desk-funcA-3' },
    { type: 'setPart', slotId: 'funcB', partId: 'desk-funcB-3' }, { type: 'setPart', slotId: 'material', partId: 'desk-material-3' },
    { type: 'setPart', slotId: 'color', partId: 'desk-color-2' }, { type: 'runTest' },
    { type: 'revise', reason: 'seoyun' }, { type: 'setPart', slotId: 'material', partId: 'desk-material-2' }, { type: 'runTest' },
    { type: 'nextStage' },
  ] as const) expect(await act(page, a), JSON.stringify(a)).toBeNull();
  expect((await getState(page)).stage).toBe('reflect');
}

const saved = (page: Page) => page.evaluate(() => localStorage.getItem('dfa.save.v1'));

test('돌아보기 태그·칭찬 조립 → 결과 → PNG 저장 → 처음으로', async ({ page }) => {
  await toReflect(page);
  const done = page.getByRole('button', { name: '다 했어요' });
  await expect(done).toHaveAttribute('aria-disabled', 'true');

  // 태그: 잘한 점만으로는 막힘
  await page.getByRole('button', { name: '잘한 점: 누구나 편리' }).click();
  await expect(page.getByRole('button', { name: '잘한 점: 누구나 편리' })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: '아쉬운 점: 환경 고려' }).click();
  await expect(done).toHaveAttribute('aria-disabled', 'true');
  // 저장은 액션마다 갱신
  expect(JSON.parse((await saved(page))!).state.reflect.good).toEqual(['access']);

  // 칭찬: 까닭만으로는 완성 안 됨 → 요소를 골라야 엔진에 들어간다
  const s1 = page.getByRole('region', { name: '접었다 펴는 벽 책상' });
  await s1.getByRole('button', { name: /자리를 덜 차지해서/ }).click();
  await expect(s1.locator('.sentence')).toContainText('요소 ?');
  expect((await getState(page)).reflect.praise).toHaveLength(0);
  await expect(done).toHaveAttribute('aria-disabled', 'true');
  await s1.getByRole('button', { name: '칭찬할 요소: 목적에 맞음' }).click();
  await expect(s1.locator('.sentence')).toHaveText('접었다 펴는 벽 책상 — 목적에 맞음: 좁은 교실에서도 자리를 덜 차지해서 좋아요.');

  const s2 = page.getByRole('region', { name: '그림 이름표 회전 사물함' });
  await s2.getByRole('button', { name: '칭찬할 요소: 누구나 편리' }).click();
  await expect(done).toHaveAttribute('aria-disabled', 'true');
  await s2.getByRole('button', { name: /내 칸이 앞으로 오니까/ }).click();
  await expect(done).not.toHaveAttribute('aria-disabled', 'true');
  expect((await getState(page)).reflect.praise.map((p) => p.element)).toEqual(['purpose', 'access']);

  // 아쉬운 점을 빼면 다시 막힘
  await page.getByRole('button', { name: '아쉬운 점: 환경 고려' }).click();
  await expect(done).toHaveAttribute('aria-disabled', 'true');
  await done.click({ force: true }); // aria-disabled 는 눌리지만 엔진이 거부
  expect((await getState(page)).stage).toBe('reflect');
  await page.getByRole('button', { name: '아쉬운 점: 환경 고려' }).click();
  await done.click();
  await expect.poll(async () => (await getState(page)).stage).toBe('result');

  // 결과 화면: 등급·만족·레이더 6(라벨+값)·확인하기 3·수정 이력 2
  const card = page.getByRole('region', { name: '디자인 카드' });
  await expect(card.locator('.grade')).toHaveText(/^(모두의|배려|견습) 디자이너$/);
  await expect(card.locator('.sat')).toHaveText(/^내 책상 · 만족 \d\/\d명$/);
  const axes = page.getByRole('list', { name: '요소 6 점수' }).locator('li');
  await expect(axes).toHaveCount(6);
  for (const name of ['목적에 맞음', '최신성', '기능성', '아름다움', '누구나 편리', '환경 고려']) await expect(axes.filter({ hasText: name })).toHaveCount(1);
  await expect(axes.filter({ hasText: '최신성' }).locator('.ev')).toHaveText(/^(참고 \d+|해당 없음)$/);
  await expect(page.locator('.checks li')).toHaveCount(3);
  await expect(page.locator('.history li')).toHaveCount(2);
  await expect(page.locator('.history li').nth(1)).toContainText('서윤의 말을 듣고 고침');

  // 결과 JSON 내보내기(e2e)
  const r = await page.evaluate(() => (window as unknown as { __dfa: { exportResult: () => { verdict: { grade: string }; scores: object } } }).__dfa.exportResult());
  expect(['master', 'care', 'apprentice']).toContain(r.verdict.grade);
  expect(Object.keys(r.scores)).toHaveLength(6);

  // PNG 저장: 다운로드 이벤트, 파일 이름 = seed
  const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: '그림으로 저장' }).click()]);
  expect(dl.suggestedFilename()).toBe('design-card-1.png');
  const png = await dl.createReadStream().then(async (s) => {
    const chunks: Buffer[] = [];
    for await (const c of s) chunks.push(c as Buffer);
    return Buffer.concat(chunks);
  });
  expect(png.subarray(1, 4).toString()).toBe('PNG');

  // 완주 저장본 → 새로고침해도 이어하기로 결과 복원
  await page.reload();
  await page.getByRole('button', { name: '이어하기' }).click();
  await expect(page.getByRole('region', { name: '디자인 카드' })).toBeVisible();
  expect((await getState(page)).stage).toBe('result');

  // 처음으로: 저장본 삭제 후 타이틀, 이어하기 없음
  await page.getByRole('button', { name: '처음으로' }).click();
  await expect(page.getByRole('button', { name: '시작' })).toBeVisible();
  expect(await saved(page)).toBeNull();
  await expect(page.getByRole('button', { name: '이어하기' })).toHaveCount(0);
});

test('중간 저장본 이어하기 → 같은 단계, 손상 저장본은 무시', async ({ page }) => {
  await toReflect(page);
  await page.getByRole('button', { name: '잘한 점: 기능성' }).click();
  // 저장은 거부되지 않은 액션 직후 동기 — 바로 들어 있다
  expect(await saved(page)).toContain('"good":["function"]');
  await page.reload();
  await expect(page.getByRole('button', { name: '시작' })).toBeVisible();
  await page.getByRole('button', { name: '이어하기' }).click();
  await expect(page.getByRole('button', { name: '잘한 점: 기능성' })).toHaveAttribute('aria-pressed', 'true');
  expect((await getState(page)).stage).toBe('reflect');

  // 판이 살아 있으면 pagehide 가 그 상태를 다시 저장한다 — 손상본은 타이틀(저장 안 함)에서 넣는다
  await page.reload();
  await expect(page.getByRole('button', { name: '시작' })).toBeVisible();
  for (const bad of [
    '{broken', JSON.stringify({ v: 9, state: {} }), JSON.stringify({ v: 1, state: { v: 1, stage: 'nope' } }),
    JSON.stringify({ v: 1, state: { v: 1, stage: 'result', product: null, rounds: [] } }),
  ]) {
    await page.evaluate((b) => localStorage.setItem('dfa.save.v1', b), bad);
    await page.reload();
    await expect(page.getByRole('button', { name: '시작' })).toBeVisible();
    await expect(page.getByRole('button', { name: '이어하기' })).toHaveCount(0);
  }
});

test('교사 안내: 타이틀 링크·?teacher=1', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: '교사 안내' }).click();
  await expect(page.getByRole('heading', { name: '교사 안내' })).toBeVisible();
  await expect(page.locator('.tbody dt')).toHaveText(['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8']);
  await expect(page.locator('.tbody tbody tr')).toHaveCount(9);
  await page.getByRole('button', { name: '돌아가기' }).click();
  await expect(page.getByRole('button', { name: '시작' })).toBeVisible();
  await page.goto('/?teacher=1');
  await expect(page.getByRole('heading', { name: '교사 안내' })).toBeVisible();
});
