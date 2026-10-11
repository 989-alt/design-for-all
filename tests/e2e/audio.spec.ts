import { expect, test, type Page } from '@playwright/test';
import { act, getState, open, tagAllCases } from './helpers';

type Rec = { src: string; call: 'play' | 'pause' };
declare global { interface Window { __snd: Rec[] } }

// HTMLMediaElement.play/pause 를 스파이한다. reject=true 면 자동재생 차단처럼 play() 가 거부된다
const spy = (page: Page, reject = false) =>
  page.addInitScript((reject) => {
    window.__snd = [];
    const rec = (el: HTMLMediaElement, call: Rec['call']) => window.__snd.push({ src: el.src.split('/assets/')[1] ?? el.src, call });
    HTMLMediaElement.prototype.play = function () { rec(this, 'play'); return reject ? Promise.reject(new DOMException('blocked', 'NotAllowedError')) : Promise.resolve(); };
    HTMLMediaElement.prototype.pause = function () { rec(this, 'pause'); };
  }, reject);
const plays = (page: Page) => page.evaluate(() => window.__snd.filter((r) => r.call === 'play').map((r) => r.src));
const has = (page: Page, src: string) => expect.poll(async () => (await plays(page)).includes(src)).toBe(true);

test('첫 입력 전엔 BGM 없음, 입력 뒤 시작, play 거부돼도 진행', async ({ page }) => {
  await spy(page, true);
  await open(page);
  await act(page, { type: 'start', seed: 1 });
  await page.waitForTimeout(300);
  expect(await plays(page)).toEqual([]);
  await page.keyboard.press('Tab');
  await has(page, 'bgm/bgm-studio.mp3');
  expect((await getState(page)).stage).toBe('cases');
  await act(page, { type: 'tagCase', caseId: 'case-01', elementId: 'purpose' }); // 거부 사유는 있어도 앱이 살아 있다
  await expect(page.locator('.k-hud .title')).toBeVisible();
});

test('효과음 매핑·BGM 교체·소리 토글', async ({ page }) => {
  await spy(page);
  await open(page);
  await tagAllCases(page);
  await page.mouse.click(5, 5); // 첫 입력
  await has(page, 'bgm/bgm-studio.mp3');

  await act(page, { type: 'nextStage' });
  await act(page, { type: 'talk', npcId: 'seoyun' });
  await act(page, { type: 'takeCard', cardId: 'C01' });
  await has(page, 'sfx/sfx-card.mp3');

  // 소리 끔: BGM 일시정지, 효과음 무음
  const tool = page.getByRole('button', { name: '소리' });
  await expect(tool).toHaveAttribute('aria-pressed', 'true');
  await tool.click();
  await expect(tool).toHaveAttribute('aria-pressed', 'false');
  await expect.poll(() => page.evaluate(() => window.__snd.some((r) => r.call === 'pause' && r.src.startsWith('bgm/')))).toBe(true);
  const before = (await plays(page)).length;
  await act(page, { type: 'talk', npcId: 'dohyun' });
  await act(page, { type: 'takeCard', cardId: 'C04' });
  await page.waitForTimeout(300);
  expect((await plays(page)).length).toBe(before);
  // 다시 켬: BGM 재개
  await tool.click();
  await expect.poll(async () => (await plays(page)).length).toBeGreaterThan(before);

  for (const [npcId, cardId] of [['hajun', 'C06'], ['jian', 'C09'], ['haeun', 'C14'], ['grandma', 'C17']] as const) {
    await act(page, { type: 'talk', npcId });
    await act(page, { type: 'takeCard', cardId });
  }
  for (const a of [
    { type: 'nextStage' }, { type: 'pickProduct', productId: 'desk' }, { type: 'nextStage' },
    { type: 'pickRef', refId: 'ref-07' }, { type: 'linkRef', refId: 'ref-07', cardId: 'C06' },
  ] as const) await act(page, a);
  await has(page, 'sfx/sfx-link.mp3');
  for (const a of [
    { type: 'pickRef', refId: 'ref-02' }, { type: 'linkRef', refId: 'ref-02', cardId: 'C04' }, { type: 'nextStage' },
    { type: 'setPart', slotId: 'form', partId: 'desk-form-2' },
  ] as const) await act(page, a);
  await has(page, 'sfx/sfx-snap.mp3');
  for (const a of [
    { type: 'setPart', slotId: 'funcA', partId: 'desk-funcA-3' }, { type: 'setPart', slotId: 'funcB', partId: 'desk-funcB-3' },
    { type: 'setPart', slotId: 'material', partId: 'desk-material-3' }, { type: 'setPart', slotId: 'color', partId: 'desk-color-2' },
    { type: 'runTest' },
  ] as const) await act(page, a);
  // 테스트 반응 공개마다 반응 효과음
  await expect.poll(async () => (await plays(page)).filter((s) => /sfx-(happy|partial|unhappy)/.test(s)).length, { timeout: 8000 }).toBeGreaterThanOrEqual(1);
  await act(page, { type: 'revise', reason: 'seoyun' });
  await has(page, 'sfx/sfx-revise.mp3');
  await act(page, { type: 'setPart', slotId: 'material', partId: 'desk-material-2' });
  await act(page, { type: 'runTest' });
  await act(page, { type: 'nextStage' });
  await act(page, { type: 'reflect', good: ['access'], fix: ['eco'], praise: [
    { sampleId: 'sample-01', element: 'purpose', line: '좁은 교실에서도 자리를 덜 차지해서' },
    { sampleId: 'sample-02', element: 'access', line: '돌리면 내 칸이 앞으로 오니까' },
  ] });
  await act(page, { type: 'finish' });
  expect((await getState(page)).stage).toBe('result');
  await has(page, 'sfx/sfx-grade.mp3');
  await has(page, 'bgm/bgm-result.mp3');
});

test('줄인 움직임: 반응 효과음은 한 번만', async ({ page }) => {
  await spy(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page);
  await tagAllCases(page);
  await page.mouse.click(5, 5); // 첫 입력
  await act(page, { type: 'nextStage' });
  for (const [npcId, cardId] of [['seoyun', 'C01'], ['dohyun', 'C04'], ['hajun', 'C06'], ['jian', 'C09']] as const) {
    await act(page, { type: 'talk', npcId });
    await act(page, { type: 'takeCard', cardId });
  }
  for (const a of [
    { type: 'nextStage' }, { type: 'pickProduct', productId: 'desk' }, { type: 'nextStage' },
    { type: 'pickRef', refId: 'ref-07' }, { type: 'linkRef', refId: 'ref-07', cardId: 'C06' },
    { type: 'pickRef', refId: 'ref-02' }, { type: 'linkRef', refId: 'ref-02', cardId: 'C04' }, { type: 'nextStage' },
  ] as const) await act(page, a);
  for (const s of ['form', 'funcA', 'funcB', 'material', 'color'] as const) await act(page, { type: 'setPart', slotId: s, partId: `desk-${s}-1` });
  await act(page, { type: 'runTest' });
  const reacts = async () => (await plays(page)).filter((s) => /sfx-(happy|partial|unhappy)/.test(s));
  await expect.poll(async () => (await reacts()).length).toBe(1);
  await page.waitForTimeout(1500); // 차례 연출(0.5초 간격)이 있었다면 더 울렸을 시간
  expect(await reacts()).toHaveLength(1);
});
