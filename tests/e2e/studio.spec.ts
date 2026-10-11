import { expect, test, type Locator, type Page } from '@playwright/test';
import type { NpcId } from '../../src/content/types';
import { NPCS } from '../../src/content/npcs';
import { act, getState, toDesign } from './helpers';

// 키보드만: 포커스를 옮기고 Enter
const enter = async (page: Page, loc: Locator) => (await loc.focus(), page.keyboard.press('Enter'));
const focusedIn = (page: Page, sel: string) => page.evaluate((s) => !!document.activeElement?.closest(s), sel);
const stage = async (page: Page) => (await getState(page)).stage;
// 부품 고르기 → 연결 패널 첫 카드에 포커스가 올 때까지 기다린 뒤 Enter
const pickLink = async (page: Page, name: string) => {
  await enter(page, page.getByRole('radio', { name }));
  await expect.poll(() => focusedIn(page, '.tray .cards')).toBe(true);
  await page.keyboard.press('Enter');
};

test('키보드만으로 1라운드: 5슬롯·연결 → ★경고 → 테스트 → 피드백 → 수정 1회 → 재테스트', async ({ page }) => {
  await toDesign(page);
  const go = page.locator('.tray .go');
  const msg = page.locator('.studio-msg');
  await expect(go).toHaveAttribute('aria-disabled', 'true');
  await expect(msg).toHaveText('부품 5개를 모두 골라요');

  // 형태 → 연결 패널 자동 열림(이 제품 카드 6 + 없음), 첫 카드에 포커스
  await expect(page.locator('.pv-art > *')).toHaveCount(0);
  // 부품 버튼 사이 화살표 이동
  await page.getByRole('radio', { name: '네모 모서리' }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('radio', { name: '모서리 둥글고 고대비 테두리' })).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await expect(page.getByRole('radio', { name: '네모 모서리' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('.tray.open')).toBeVisible();
  await expect(page.locator('.tray.open .tcard')).toHaveCount(6);
  await expect(page.locator('.tray.open .none')).toHaveText('없음');
  await expect.poll(() => focusedIn(page, '.tray .cards')).toBe(true);
  await page.keyboard.press('Enter'); // 첫 카드 = 서윤
  await expect(page.locator('.tray.open')).toHaveCount(0);
  const formChip = page.getByRole('button', { name: '형태 연결: 서윤' });
  await expect(formChip).toBeVisible();

  // 연결 모드 취소: Escape · 닫기 · 다른 슬롯 열기. 취소는 연결을 바꾸지 않는다
  await enter(page, formChip);
  await expect.poll(() => focusedIn(page, '.tray .cards')).toBe(true);
  await page.keyboard.press('Escape');
  await expect(page.locator('.tray.open')).toHaveCount(0);
  await expect(formChip).toBeFocused();
  await enter(page, formChip);
  await enter(page, page.locator('.tray .shut'));
  await expect(page.locator('.tray.open')).toHaveCount(0);
  await enter(page, formChip);
  await enter(page, page.getByRole('button', { name: /^높이 슬롯/ }));
  await expect(page.locator('.tray.open')).toHaveCount(0);
  expect((await getState(page)).draft.links.form).toBe('C01');

  // ★ 전동 높이 조절 → 없음
  await enter(page, page.getByRole('radio', { name: '전동 높이 조절' }));
  await enter(page, page.locator('.tray .none'));
  await expect(page.getByRole('button', { name: '높이 연결: 없음' })).toBeVisible();
  // ✗ 아래 수납 선반(서윤 C01 을 더 나쁘게)
  await pickLink(page, '아래 수납 선반');
  await pickLink(page, '새 플라스틱');
  await pickLink(page, '벽과 같은 회색');

  // 미리보기 레이어 z-order = DOM 순서
  const layers = await page.locator('.pv-art > *').evaluateAll((els) => els.map((e) => e.className));
  expect(layers).toEqual(['pv-form', 'pv-mask material', 'pv-mask color', 'pv-part funcA', 'pv-part funcB']);
  const mix = await page.locator('.pv-mask').evaluateAll((els) => els.map((e) => [getComputedStyle(e).mixBlendMode, getComputedStyle(e).maskImage || getComputedStyle(e).webkitMaskImage]));
  for (const [blend, mask] of mix) expect(blend).toBe('multiply'), expect(mask).toContain('desk-form-1.png');

  // 글자 면 중심(≤3px): 부품 버튼·테스트 버튼
  await enter(page, page.getByRole('button', { name: /^색 슬롯/ }));
  await page.evaluate(() => document.fonts.ready);
  const off = await page.$$eval('.parts .k-btn, .tray .k-btn', (els) =>
    els.map((el) => {
      const b = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      const [t, r, bt, l] = [cs.borderTopWidth, cs.borderRightWidth, cs.borderBottomWidth, cs.borderLeftWidth].map(parseFloat);
      const s = el.querySelector('.lbl > span')!.getBoundingClientRect();
      return Math.max(Math.abs(s.left + s.width / 2 - (b.left + l + (b.width - l - r) / 2)), Math.abs(s.top + s.height / 2 - (b.top + t + (b.height - t - bt) / 2)));
    }),
  );
  expect(off).toHaveLength(5);
  for (const d of off) expect(d).toBeLessThanOrEqual(3);

  // ★ 연결 없음 → 첫 누름은 경고만, 둘째 누름에 테스트
  await expect(go).not.toHaveAttribute('aria-disabled', 'true');
  await enter(page, go);
  await expect(msg).toContainText('첨단 부품에 이은 불편 카드가 없어요');
  expect(await stage(page)).toBe('design');
  await page.keyboard.press('Enter');
  expect(await stage(page)).toBe('test');

  // 테스트: 6명 차례 등장, 반응 초상·얼굴 아이콘·글자
  await expect(page.locator('.tp:not(.wait)')).toHaveCount(6, { timeout: 6000 });
  const s1 = await getState(page);
  expect(s1.feedback).toEqual(['bus', 'tech']);
  expect(s1.rounds[0].reactions.seoyun).toBe('unhappy');
  await expect(page.locator('.tp', { hasText: '서윤' }).locator('img.npc')).toHaveAttribute('src', /npc-unhappy-seoyun/);
  await expect(page.locator('.tp', { hasText: '도현' }).locator('img.npc')).toHaveAttribute('src', /\/npc-dohyun/);
  await expect(page.locator('.tp', { hasText: '서윤' }).locator('img.face')).toHaveAttribute('src', /icon-face-unhappy/);

  // M1 저상 버스 → M3 첨단 카드 모달. 포커스는 닫기에 갇히고 뒤는 inert
  const dlg = page.getByRole('dialog');
  await expect(dlg).toContainText('계단을 없앤 낮은 버스');
  await expect(page.locator('.test-in')).toHaveAttribute('inert', '');
  await page.keyboard.press('Tab');
  expect(await focusedIn(page, '[role=dialog]')).toBe(true);
  await page.keyboard.press('Enter');
  await expect(dlg).toContainText('이건 누구를 위한 기술일까요?');
  await page.keyboard.press('Enter');
  await expect(dlg).toHaveCount(0);

  // 연출이 끝나면 큰 대사 패널 = 첫 부분·불만 NPC
  const firstUnmet = s1.npcOrder.find((n) => s1.rounds[0].reactions[n] && s1.rounds[0].reactions[n] !== 'happy')!;
  await expect(page.locator('.test-main .who')).toContainText(NPCS.find((n) => n.id === firstUnmet)!.name);

  // NPC 카드 Enter → 가운데 대사
  await enter(page, page.getByRole('button', { name: '서윤 불만' }));
  await expect(page.locator('.test-main')).toContainText('아래 수납 선반 때문에 더 불편해졌어요.');
  await expect(page.locator('.test-main')).toContainText('이동·수납 · 「아래 수납 선반」');
  await expect(page.locator('.test-num .big')).toHaveText(`${s1.rounds[0].satisfied} / 6`);
  await expect(page.getByRole('button', { name: '돌아보기' })).toHaveCount(0);

  // 수정: 바꾼 이유는 부분·불만 NPC 만, 고르기 전엔 진행 불가
  await enter(page, page.getByRole('button', { name: '수정하러 가기' }));
  const happy = page.getByRole('radio', { name: /도현/ });
  await expect(happy).toHaveAttribute('aria-disabled', 'true');
  await enter(page, happy);
  await expect(happy).toHaveAttribute('aria-checked', 'false');
  const ok = page.getByRole('button', { name: '이 불편 고치기' });
  await expect(ok).toHaveAttribute('aria-disabled', 'true');
  await enter(page, page.getByRole('radio', { name: /서윤/ }));
  await enter(page, ok);
  expect(await stage(page)).toBe('revise');
  await expect(page.locator('.reason')).toContainText('서윤');

  // 재테스트 게이트: 변경 0 → 비활성 + 안내, 눌러도 그대로
  await expect(go).toHaveText('다시 테스트');
  await expect(go).toHaveAttribute('aria-disabled', 'true');
  await expect(msg).toHaveText('부품을 하나 이상 바꿔요');
  await enter(page, go);
  expect(await stage(page)).toBe('revise');
  // 1차에 고른 '없음' 은 그대로 '없음'
  await expect(page.getByRole('button', { name: '높이 연결: 없음' })).toBeVisible();
  // ✗ 부품 표시
  await expect(page.locator('.srow', { hasText: '이동·수납' }).locator('.worse')).toHaveText(/서윤 불편/);

  // 같은 슬롯 다른 부품 → 연결 초기화 + 안내 → 다시 잇기
  await enter(page, page.getByRole('button', { name: /^이동·수납 슬롯/ }));
  await enter(page, page.getByRole('radio', { name: '잠금 바퀴' }));
  await expect(msg).toHaveText('부품을 바꿔서 연결을 지웠어요. 다시 이어 주세요');
  expect((await getState(page)).draft.links.funcB).toBeNull();
  // 교체로 지워진 연결은 '없음' 이 아니라 '+ 연결'
  await expect(page.getByRole('button', { name: '이동·수납 연결: + 연결' })).toBeVisible();
  await enter(page, page.locator('.tray .tcard', { hasText: '책상을 옮기기 힘들어' }));
  expect((await getState(page)).draft.links.funcB).toBe('C06');
  await expect(page.locator('.srow', { hasText: '이동·수납' }).locator('.worse')).toHaveCount(0);

  await expect(go).not.toHaveAttribute('aria-disabled', 'true');
  await enter(page, go);
  await page.keyboard.press('Enter'); // ★ 경고 1회 뒤 진행
  expect(await stage(page)).toBe('test');
  const s2 = await getState(page);
  expect(s2.rounds).toHaveLength(2);
  expect(s2.rounds[1].reason).toBe('seoyun');
  await expect(page.locator('.tp:not(.wait)')).toHaveCount(6, { timeout: 6000 });
  // M1 은 1차에만. M3 은 다시
  await expect(dlg).toContainText('이건 누구를 위한 기술일까요?');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: '돌아보기' })).toBeVisible();
  await expect(page.getByRole('button', { name: '수정하러 가기' })).toBeVisible();
});

test('2회 수정 뒤: 수정 버튼 없이 돌아보기만', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await toDesign(page);
  for (const [slotId, n] of [['form', 2], ['funcA', 3], ['funcB', 2], ['material', 3], ['color', 2]] as const) await act(page, { type: 'setPart', slotId, partId: `desk-${slotId}-${n}` });
  expect(await act(page, { type: 'runTest' })).toBeNull();
  for (const color of ['desk-color-1', 'desk-color-3'] as const) {
    const last = (await getState(page)).rounds.at(-1)!;
    const reason = (Object.keys(last.reactions) as NpcId[]).find((n) => last.reactions[n] !== 'happy') ?? 'seoyun';
    expect(await act(page, { type: 'revise', reason })).toBeNull();
    await act(page, { type: 'setPart', slotId: 'color', partId: color });
    expect(await act(page, { type: 'runTest' })).toBeNull();
  }
  expect((await getState(page)).rounds).toHaveLength(3);
  const dlg = page.getByRole('dialog');
  while (await dlg.count()) await dlg.getByRole('button').press('Enter');
  await expect(page.getByRole('button', { name: '수정하러 가기' })).toHaveCount(0);
  await enter(page, page.getByRole('button', { name: '돌아보기' }));
  expect(await stage(page)).toBe('reflect');
});

test('라운드 2: 처음 → 지금, 색만 바꾸면 아름다움 이전→지금·누구나 편리 그대로, S1 뒤 돌아보기 coral', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await toDesign(page);
  for (const s of ['form', 'funcA', 'funcB', 'material', 'color'] as const) await act(page, { type: 'setPart', slotId: s, partId: `desk-${s}-1` });
  expect(await act(page, { type: 'runTest' })).toBeNull();
  const dlg = page.getByRole('dialog');
  const closeAll = async () => { while (await dlg.count()) await dlg.getByRole('button').press('Enter'); };
  await closeAll();
  await expect(page.locator('.test-num .since')).toHaveCount(0); // 1차엔 없음
  const r1 = (await getState(page)).rounds[0];
  // 색만 → M2: 줄인 움직임이면 바로 보인다
  expect(await act(page, { type: 'revise', reason: 'seoyun' })).toBeNull();
  await act(page, { type: 'setPart', slotId: 'color', partId: 'desk-color-3' });
  expect(await act(page, { type: 'runTest' })).toBeNull();
  await closeAll();
  const since = page.locator('.test-num .since');
  await expect(since).toContainText(`처음 ${r1.satisfied} → 지금 ${r1.satisfied}`);
  await expect(since).toContainText(/아름다움 \d+ → \d+/);
  await expect(since).toContainText('누구나 편리 그대로');
  await expect(since.locator('img')).toHaveCount(3);
  await expect(page.locator('.test-main p')).toContainText('색은 예쁜데 ');
  // S1 못 채움: 돌아보기는 보조(paper), 수정이 주(coral)
  await expect(page.getByRole('button', { name: '돌아보기' })).toHaveClass(/paper/);
  await expect(page.getByRole('button', { name: '수정하러 가기' })).toHaveClass(/coral/);
  // 기능을 바꿔 전원 만족(S1) → 아름다움 줄 없음, 돌아보기가 coral
  expect(await act(page, { type: 'revise', reason: 'seoyun' })).toBeNull();
  for (const [slotId, n] of [['form', 2], ['funcA', 3], ['funcB', 3], ['material', 3], ['color', 2]] as const) await act(page, { type: 'setPart', slotId, partId: `desk-${slotId}-${n}` });
  expect(await act(page, { type: 'runTest' })).toBeNull();
  await closeAll();
  await expect(since).toContainText(`처음 ${r1.satisfied} → 지금 6`);
  await expect(since).not.toContainText('아름다움');
  await expect(page.getByRole('button', { name: '돌아보기' })).toHaveClass(/coral/);
});

test('줄인 움직임: 반응이 한 번에 전부 / 기본: 차례로', async ({ page }) => {
  const shownNow = () => page.locator('.test-strip').evaluate((el) => el.querySelectorAll('.tp:not(.wait)').length);
  const run = async () => {
    await toDesign(page);
    for (const s of ['form', 'funcA', 'funcB', 'material', 'color'] as const) await act(page, { type: 'setPart', slotId: s, partId: `desk-${s}-1` });
    await act(page, { type: 'runTest' });
    await page.locator('.test-strip').waitFor();
  };
  await run();
  expect(await shownNow()).toBeLessThan(6);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await run();
  expect(await shownNow()).toBe(6);
});

// 마스크: 소재·색 레이어를 얹어도 형태 그림 바깥(알파 0, 2px 여유) 픽셀은 하나도 안 바뀐다(채널 합 차이 8 이하는 합성 잡음)
test('마스크: 형태 바깥 픽셀 변화 0', async ({ page }) => {
  await toDesign(page);
  await act(page, { type: 'setPart', slotId: 'form', partId: 'desk-form-2' });
  await act(page, { type: 'setPart', slotId: 'funcA', partId: 'desk-funcA-3' });
  const art = page.locator('.pv-art');
  await page.waitForFunction(() => Array.from(document.images).every((i) => i.complete));
  const before = (await art.screenshot()).toString('base64');
  await act(page, { type: 'setPart', slotId: 'material', partId: 'desk-material-4' });
  await act(page, { type: 'setPart', slotId: 'color', partId: 'desk-color-3' });
  await page.waitForTimeout(300); // 타일 그림 로드
  const after = (await art.screenshot()).toString('base64');
  const r = await page.evaluate(async ([a, b]) => {
    const load = (src: string) => new Promise<HTMLImageElement>((ok) => { const i = new Image(); i.onload = () => ok(i); i.src = src; });
    const [ia, ib, form] = await Promise.all([load(`data:image/png;base64,${a}`), load(`data:image/png;base64,${b}`), load('./assets/kit/desk-form-2.png')]);
    const W = ia.width, H = ia.height;
    const px = (img: HTMLImageElement, fit: boolean) => {
      const c = document.createElement('canvas');
      c.width = W; c.height = H;
      const g = c.getContext('2d')!;
      if (fit) {
        const k = Math.min(W / img.width, H / img.height);
        g.drawImage(img, (W - img.width * k) / 2, (H - img.height * k) / 2, img.width * k, img.height * k);
      } else g.drawImage(img, 0, 0);
      return g.getImageData(0, 0, W, H).data;
    };
    const [pa, pb, pf] = [px(ia, false), px(ib, false), px(form, true)];
    const near = (x: number, y: number) => {
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
        const X = x + dx, Y = y + dy;
        if (X >= 0 && Y >= 0 && X < W && Y < H && pf[(Y * W + X) * 4 + 3] > 0) return true;
      }
      return false;
    };
    let outside = 0, inside = 0;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      if (Math.abs(pa[i] - pb[i]) + Math.abs(pa[i + 1] - pb[i + 1]) + Math.abs(pa[i + 2] - pb[i + 2]) <= 8) continue; // 영역 둥근 모서리 합성 잡음 ±1 은 변화로 안 친다
      if (near(x, y)) inside++;
      else outside++;
    }
    return { outside, inside };
  }, [before, after]);
  expect(r.inside).toBeGreaterThan(1000); // 레이어가 실제로 칠해졌다
  expect(r.outside).toBe(0);
});

test('판 글자: 맨 위 레이어·판 안, 그림 판엔 글자 없음', async ({ page }) => {
  await toDesign(page, 'door');
  for (const [slotId, n] of [['form', 1], ['funcA', 2], ['funcB', 2], ['material', 1], ['color', 2]] as const) await act(page, { type: 'setPart', slotId, partId: `door-${slotId}-${n}` });
  const layers = await page.locator('.pv-art > *').evaluateAll((els) => els.map((e) => e.className));
  expect(layers).toEqual(['pv-form', 'pv-mask material', 'pv-mask color', 'pv-part funcA', 'pv-part funcB', 'pv-text door']);
  await expect(page.locator('.pv-text')).toHaveText('5학년 1반');
  await page.evaluate(() => document.fonts.ready);
  const t = (await page.locator('.pv-text span').boundingBox())!;
  const plate = (await page.locator('.pv-part.funcB img').boundingBox())!;
  expect(t.x).toBeGreaterThanOrEqual(plate.x);
  expect(t.x + t.width).toBeLessThanOrEqual(plate.x + plate.width);
  await act(page, { type: 'setPart', slotId: 'funcB', partId: 'door-funcB-3' }); // 책 그림 판
  await expect(page.locator('.pv-text')).toHaveCount(0);
});
