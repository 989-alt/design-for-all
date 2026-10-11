import { expect, test, type Locator, type Page } from '@playwright/test';
import { CARDS } from '../../src/content/cards';
import { CASES } from '../../src/content/cases';
import { ELEMENTS } from '../../src/content/elements';
import { NPCS } from '../../src/content/npcs';
import { PRODUCTS } from '../../src/content/products';
import { SAMPLES } from '../../src/content/samples';
import type { CardId, NpcId, SlotId } from '../../src/content/types';
import { act, getState, open, tagAllCases } from './helpers';

const DESK: [NpcId, CardId][] = [['seoyun', 'C01'], ['dohyun', 'C04'], ['hajun', 'C06'], ['jian', 'C09'], ['haeun', 'C14'], ['grandma', 'C17']];
const SLOT_IDS: SlotId[] = ['form', 'funcA', 'funcB', 'material', 'color'];
const stageOf = async (page: Page) => (await getState(page)).stage;

// 화면까지 엔진 액션으로 빠르게 간다(이 파일의 키보드 완주 테스트만 마우스·액션 없이 걷는다)
const STEPS = ['title', 'cases', 'classroom', 'pick', 'research', 'design', 'test', 'revise', 'reflect', 'result'] as const;
async function drive(page: Page, target: (typeof STEPS)[number]) {
  await open(page);
  const to = STEPS.indexOf(target);
  if (to < 1) return;
  await tagAllCases(page);
  if (to < 2) return;
  await act(page, { type: 'nextStage' });
  for (const [npcId, cardId] of DESK) {
    await act(page, { type: 'talk', npcId });
    await act(page, { type: 'takeCard', cardId });
  }
  if (to < 3) return;
  await act(page, { type: 'nextStage' });
  await act(page, { type: 'pickProduct', productId: 'desk' });
  if (to < 4) return;
  await act(page, { type: 'nextStage' });
  await act(page, { type: 'pickRef', refId: 'ref-07' });
  await act(page, { type: 'linkRef', refId: 'ref-07', cardId: 'C06' });
  await act(page, { type: 'pickRef', refId: 'ref-02' });
  await act(page, { type: 'linkRef', refId: 'ref-02', cardId: 'C04' });
  if (to < 5) return;
  await act(page, { type: 'nextStage' });
  if (to < 6) return;
  for (const s of SLOT_IDS) await act(page, { type: 'setPart', slotId: s, partId: `desk-${s}-1` as never });
  await act(page, { type: 'runTest' });
  if (to < 7) return;
  if (target === 'revise') return void (await act(page, { type: 'revise', reason: 'seoyun' }));
  // 돌아보기는 한 번 고친 뒤에만 열린다(result.spec 과 같은 길)
  await act(page, { type: 'revise', reason: 'seoyun' });
  await act(page, { type: 'setPart', slotId: 'material', partId: 'desk-material-2' });
  await act(page, { type: 'runTest' });
  await act(page, { type: 'nextStage' });
  if (to < 9) return;
  const praise = SAMPLES.map((sm, i) => {
    const element = ELEMENTS[i].id;
    return { sampleId: sm.id, element, line: `${sm.title} — ${ELEMENTS[i].name}: ${sm.praise[element]} 좋아요.` };
  });
  await act(page, { type: 'reflect', good: ['access'], fix: ['eco'], praise });
  await act(page, { type: 'finish' });
}

// 엔진 상태가 아니라 화면(DOM)이 바뀔 때까지 기다린다 — 검사는 DOM 을 본다
const MARK = { title: '.brief', cases: '.case-strip', classroom: '.npc-hit', pick: '.picks', research: '.refs', design: '.preview', test: '.test-strip', revise: '.reason', reflect: '.rbody', result: '.rcard' };
async function reach(page: Page, target: (typeof STEPS)[number]) {
  await drive(page, target);
  await expect(page.locator(`.stage ${MARK[target]}`).first()).toBeVisible();
}

// Tab 만 눌러 대상에 닿는다(마우스·focus() 없음). 한 바퀴 돌아도 못 닿으면 실패 = 키보드로 못 가는 조작
async function tabTo(page: Page, loc: Locator) {
  const el = await loc.first().elementHandle();
  if (!el) throw new Error(`없음: ${loc}`);
  for (let i = 0; i < 250; i++) {
    if (await el.evaluate((e) => e === document.activeElement)) return;
    await page.keyboard.press('Tab');
  }
  throw new Error(`Tab 으로 못 닿음: ${loc}`);
}
const press = async (page: Page, loc: Locator, key = 'Enter') => (await tabTo(page, loc), page.keyboard.press(key));
const named = (page: Page, role: 'button' | 'radio', name: string | RegExp) => page.getByRole(role, { name });

test('키보드만(Tab/Enter/Space/화살표)으로 타이틀 → 결과 완주', async ({ page }) => {
  test.setTimeout(180_000);
  await open(page);
  expect(await stageOf(page)).toBe('title');
  await press(page, named(page, 'button', '시작'));
  expect(await stageOf(page)).toBe('cases');

  // 사례 7장: 사례 버튼 Enter → 요소 버튼 Enter(정답)
  for (const [i, c] of CASES.entries()) {
    await press(page, named(page, 'button', new RegExp(`^${i + 1}번`)));
    await press(page, named(page, 'button', ELEMENTS.find((e) => e.id === c.main)!.name).first());
  }
  expect((await getState(page)).tags.filter((t) => t.correct)).toHaveLength(CASES.length);
  await press(page, named(page, 'button', '다음'));
  expect(await stageOf(page)).toBe('classroom');

  // 교실: 친구 6명 대화 → 불편 카드 전부 받기
  for (const n of NPCS) {
    await press(page, named(page, 'button', new RegExp(`^${n.name} ·`)));
    const take = named(page, 'button', '불편 카드 받기');
    while (await take.count()) await press(page, take);
  }
  expect((await getState(page)).collected.length).toBe(CARDS.length);
  await press(page, named(page, 'button', '다음'));
  expect(await stageOf(page)).toBe('pick');

  // 제품 고르기: 라디오는 Space
  await press(page, named(page, 'radio', /^책상/), ' ');
  expect((await getState(page)).product).toBe('desk');
  await press(page, named(page, 'button', '다음'));
  expect(await stageOf(page)).toBe('research');

  // 조사: 참고 카드 → 불편 카드
  for (const [ref, card] of [['ref-07', 'C06'], ['ref-02', 'C04']] as const) {
    await press(page, page.locator(`[data-ref=${ref}]`));
    await press(page, page.locator('.tlist .tcard', { hasText: CARDS.find((c) => c.id === card)!.what }));
  }
  await press(page, named(page, 'button', '다음'));
  expect(await stageOf(page)).toBe('design');

  // 설계: 슬롯마다 부품 → 연결 패널 첫 카드. 부품 사이는 화살표
  const desk = PRODUCTS.desk;
  for (const s of SLOT_IDS) {
    if (s !== 'form') await press(page, named(page, 'button', new RegExp(`^${desk.slotNames[s]} 슬롯`)));
    const [first, second] = desk.parts[s];
    await tabTo(page, named(page, 'radio', first.name));
    await page.keyboard.press('ArrowRight');
    await expect(named(page, 'radio', second.name)).toBeFocused();
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('Enter');
    await expect.poll(() => page.evaluate(() => !!document.activeElement?.closest('.tray .cards'))).toBe(true);
    await page.keyboard.press('Enter');
  }
  expect(Object.keys((await getState(page)).draft.slots)).toHaveLength(5);
  await press(page, page.locator('.tray .go'));
  if ((await stageOf(page)) === 'design') await page.keyboard.press('Enter'); // ★ 경고 한 번 뒤 진행
  expect(await stageOf(page)).toBe('test');

  // 테스트: 연출 끝 → 피드백 모달은 Enter 로 닫는다
  const dlg = page.getByRole('dialog');
  const closeModals = async () => {
    await expect(dlg.or(named(page, 'button', '수정하러 가기')).first()).toBeVisible({ timeout: 8000 });
    while (await dlg.count()) { await page.keyboard.press('Enter'); await page.waitForTimeout(50); }
  };
  await closeModals();

  // 돌아보기는 한 번 고친 뒤에만: 수정하러 가기 → 바꾼 이유(라디오) → 이 불편 고치기 → 부품 하나 바꾸기 → 다시 테스트
  await press(page, named(page, 'button', '수정하러 가기'));
  await press(page, named(page, 'radio', /^서윤/), ' ');
  await press(page, named(page, 'button', '이 불편 고치기'));
  expect(await stageOf(page)).toBe('revise');
  await press(page, named(page, 'button', new RegExp(`^${desk.slotNames.material} 슬롯`)));
  await press(page, named(page, 'radio', desk.parts.material[1].name));
  await expect.poll(() => page.evaluate(() => !!document.activeElement?.closest('.tray .cards'))).toBe(true);
  await page.keyboard.press('Escape');
  await press(page, page.locator('.tray .go'));
  if ((await stageOf(page)) === 'revise') await page.keyboard.press('Enter');
  expect(await stageOf(page)).toBe('test');
  await closeModals();
  await press(page, named(page, 'button', '돌아보기'));
  expect(await stageOf(page)).toBe('reflect');

  // 돌아보기: 태그 각 1 + 칭찬 2(요소 칩 → 까닭 버튼)
  await press(page, named(page, 'button', '잘한 점: 누구나 편리'));
  await press(page, named(page, 'button', '아쉬운 점: 환경 고려'));
  for (const sm of SAMPLES) {
    const box = page.getByRole('region', { name: sm.title });
    await press(page, box.getByRole('button', { name: '칭찬할 요소: 목적에 맞음' }), ' ');
    await press(page, box.getByRole('button', { name: new RegExp(sm.praise.purpose) }), ' ');
  }
  await press(page, named(page, 'button', '다 했어요'));
  expect(await stageOf(page)).toBe('result');
  await expect(named(page, 'button', '그림으로 저장')).toBeVisible();
  await press(page, named(page, 'button', '처음으로'));
  expect(await stageOf(page)).toBe('title');
});

// 접근 가능한 이름이 없는 상호작용 요소를 ariaSnapshot 에서 센다(브라우저가 계산한 진짜 이름)
const nameless = async (page: Page) => {
  const snap = await page.locator('body').ariaSnapshot();
  return snap.split('\n').filter((l) => /^\s*- (button|radio|link|checkbox|textbox)(\s*\[[^\]]*\])*\s*(:.*)?$/.test(l));
};

test('화면마다: 이름 없는 상호작용 요소 0 · img alt 전부 · 표정은 글자 병기', async ({ page }) => {
  test.setTimeout(120_000);
  for (const s of STEPS) {
    await reach(page, s);
    expect(await stageOf(page), s).toBe(s);
    if (s === 'test') await expect(page.locator('.tp:not(.wait)')).toHaveCount(6, { timeout: 8000 });
    expect(await nameless(page), `${s} 이름 없는 요소`).toEqual([]);
    const bad = await page.evaluate(() => [
      ...[...document.images].filter((i) => !i.hasAttribute('alt')).map((i) => `img ${i.getAttribute('src')}`),
      ...[...document.querySelectorAll('[tabindex],button,[role=button],[role=radio]')]
        .filter((e) => !(e.getAttribute('aria-label') || e.getAttribute('aria-labelledby') || (e as HTMLElement).innerText?.trim() || e.querySelector('img[alt]:not([alt=""])')))
        .map((e) => e.outerHTML.slice(0, 80)),
    ]);
    expect(bad, `${s} alt·이름`).toEqual([]);
    if (s === 'test') {
      // 표정 아이콘 옆에는 항상 만족/부분/불만 글자
      for (const tp of await page.locator('.tp:not(.wait)').all()) await expect(tp).toContainText(/만족|부분|불만/);
      await expect(page.locator('.test-main .who')).toContainText(/만족|부분|불만/);
    }
  }
  // 교사 안내(app 내부 상태)
  await page.goto('/?e2e=1&teacher=1');
  expect(await nameless(page), 'teacher').toEqual([]);
  // 교실 대화 패널·수정 입구(Revise)도 한 번씩
  await reach(page, 'classroom');
  await page.getByRole('button', { name: /^서윤 ·/ }).click();
  expect(await nameless(page), 'classroom 대화').toEqual([]);
  await reach(page, 'test');
  await expect(page.locator('.tp:not(.wait)')).toHaveCount(6, { timeout: 8000 });
  await page.getByRole('dialog').getByRole('button').press('Enter');
  await page.getByRole('button', { name: '수정하러 가기' }).click();
  expect(await nameless(page), 'revise 입구').toEqual([]);
  for (const tp of await page.locator('.rv').all()) await expect(tp).toContainText(/만족|부분|불만/);
});

test('포커스 링: 키보드로 닿은 요소에 --shadow-focus, 모달 트랩·닫으면 복귀', async ({ page }) => {
  test.setTimeout(120_000);
  const ringOk = async (n = 12) => {
    const probe = await page.evaluate(() => {
      const d = document.createElement('div');
      d.style.boxShadow = 'var(--shadow-focus)';
      document.body.append(d);
      const v = getComputedStyle(d).boxShadow;
      d.remove();
      return v;
    });
    expect(probe).not.toBe('none');
    for (let i = 0; i < n; i++) {
      await page.keyboard.press('Tab');
      const r = await page.evaluate(() => {
        const e = document.activeElement as HTMLElement;
        return e === document.body ? null : [e.tagName, getComputedStyle(e).boxShadow, getComputedStyle(e).outlineStyle, e.className] as const;
      });
      if (r) {
        expect(r[1], `포커스 링 없음: ${r[3]}`).toBe(probe);
      }
    }
  };
  for (const s of ['title', 'cases', 'classroom', 'pick', 'research', 'design'] as const) {
    await reach(page, s);
    await ringOk();
  }
  await reach(page, 'result');
  await ringOk();

  // 모달: 열리면 닫기 버튼, Tab/Shift+Tab 은 갇히고, Escape·Enter 로 닫으면 뒤 화면으로 복귀
  await reach(page, 'test');
  const dlg = page.getByRole('dialog');
  await expect(dlg).toBeVisible({ timeout: 8000 });
  const inDlg = () => page.evaluate(() => !!document.activeElement?.closest('[role=dialog]'));
  expect(await inDlg()).toBe(true);
  for (const k of ['Tab', 'Shift+Tab', 'Tab']) { await page.keyboard.press(k); expect(await inDlg()).toBe(true); }
  await expect(page.locator('.test-in')).toHaveAttribute('inert', '');
  await expect(dlg).toContainText('계단을 없앤 낮은 버스');
  // Escape 로 닫는다. 카드가 더 있으면(첨단) 다음 카드에서도 포커스가 갇혀 있다
  await page.keyboard.press('Escape');
  while (await dlg.count()) {
    expect(await inDlg()).toBe(true);
    await page.keyboard.press('Escape');
  }
  await expect.poll(() => page.evaluate(() => !!document.activeElement?.closest('.test-in')), { message: '모달을 닫으면 포커스가 뒤 화면으로 돌아와야 한다' }).toBe(true);
});

// 글자가 자기 틀(패널·버튼·칩, 스크롤 상자는 가로만)을 넘으면 그 문구를 돌려준다
async function overflowing(page: Page) {
  return page.evaluate(() => {
    const out: string[] = [];
    const stage = document.querySelector('.stage')!;
    const sr = stage.getBoundingClientRect();
    const frame = '.k-panel,.k-btn,.k-card,.k-chip,.k-step,.k-step-now,.k-tool,.k-hud';
    const walk = document.createTreeWalker(stage, NodeFilter.SHOW_TEXT);
    const range = document.createRange();
    for (let n = walk.nextNode(); n; n = walk.nextNode()) {
      const text = n.textContent!.trim();
      const p = n.parentElement!;
      if (!text || p.closest('[inert],[hidden]') || getComputedStyle(p).visibility === 'hidden') continue;
      range.selectNodeContents(n);
      const r = range.getBoundingClientRect();
      if (!r.width) continue;
      // 스크롤 상자 안의 글자는 세로로 밀려나는 게 정상이라 가로만 본다
      let scroller = false;
      for (let e: Element | null = p; e && e !== stage; e = e.parentElement) if (/auto|scroll/.test(getComputedStyle(e).overflowY)) { scroller = true; break; }
      const box = (p.closest(frame) ?? stage).getBoundingClientRect();
      const tol = 1.5;
      const side = r.left < box.left - tol || r.right > box.right + tol;
      const vert = !scroller && (r.top < box.top - tol || r.bottom > box.bottom + tol);
      const outStage = r.left < sr.left - tol || r.right > sr.right + tol || r.top < sr.top - tol || r.bottom > sr.bottom + tol;
      if (side || vert || (outStage && !scroller)) out.push(`${text.slice(0, 24)} [${Math.round(r.left)},${Math.round(r.top)},${Math.round(r.right)},${Math.round(r.bottom)}] in [${Math.round(box.left)},${Math.round(box.top)},${Math.round(box.right)},${Math.round(box.bottom)}]`);
    }
    const de = document.scrollingElement!;
    if (de.scrollWidth > innerWidth) out.push(`가로 스크롤 ${de.scrollWidth}>${innerWidth}`);
    return out;
  });
}

test('글자 크게: 본문 1.25배 · 화면마다 가로 스크롤 0 · 넘치는 글자 0 · 고대비 토글', async ({ page }) => {
  test.setTimeout(180_000);
  await reach(page, 'title');
  const base = await page.evaluate(() => parseFloat(getComputedStyle(document.body).fontSize));
  // 키보드로 토글
  await press(page, page.getByRole('button', { name: '가 크게' }));
  await expect(page.locator('html')).toHaveAttribute('data-text', 'large');
  const big = await page.evaluate(() => parseFloat(getComputedStyle(document.body).fontSize));
  expect(big / base).toBeCloseTo(1.25, 2);
  await press(page, page.getByRole('button', { name: '고대비' }));
  await expect(page.locator('html')).toHaveAttribute('data-contrast', 'high');
  expect(await page.evaluate(() => getComputedStyle(document.body).color)).toBe('rgb(0, 0, 0)');
  await press(page, page.getByRole('button', { name: '고대비' }));
  await expect(page.locator('html')).not.toHaveAttribute('data-contrast', 'high');

  const bad: Record<string, string[]> = {};
  for (const s of STEPS) {
    await reach(page, s);
    await page.evaluate(() => { document.documentElement.dataset.text = 'large'; });
    if (s === 'test') await expect(page.locator('.tp:not(.wait)')).toHaveCount(6, { timeout: 8000 });
    if (s === 'classroom') await page.getByRole('button', { name: /^서윤 ·/ }).click();
    if (s === 'test') await page.getByRole('dialog').getByRole('button').press('Enter');
    const o = await overflowing(page);
    if (o.length) bad[s] = o;
  }
  await page.goto('/?e2e=1&teacher=1');
  await page.evaluate(() => { document.documentElement.dataset.text = 'large'; });
  const t = await overflowing(page);
  if (t.length) bad.teacher = t;
  expect(bad).toEqual({});
});

test('reduced-motion: 애니메이션·전환 duration 0 · 반응 즉시 표시', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await reach(page, 'test');
  // 연출 타이머(500ms × 6)를 기다리지 않고 바로 6명
  expect(await page.locator('.tp:not(.wait)').count()).toBe(6);
  const long = await page.evaluate(() => {
    const zero = (v: string) => v.split(',').every((x) => parseFloat(x) === 0);
    return [...document.querySelectorAll('*')].flatMap((e) => {
      const cs = getComputedStyle(e);
      return (cs.animationName !== 'none' && !zero(cs.animationDuration)) || !zero(cs.transitionDuration) ? [`${e.tagName}.${e.className}`] : [];
    });
  });
  expect(long).toEqual([]);
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--motion-reaction').trim())).toBe('0ms');
});

test('터치 타깃: 모든 버튼·카드 44×44 이상(무대 스케일 1)', async ({ page }) => {
  test.setTimeout(120_000);
  const small: Record<string, string[]> = {};
  const scan = async (label: string) => {
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--stage-scale'))).toBe('1');
    const r = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>('button,[role=button],[role=radio],a[href],input,select,textarea,summary')]
        .filter((e) => !e.closest('[inert]') && getComputedStyle(e).visibility !== 'hidden')
        .map((e) => [e.getBoundingClientRect(), e] as const)
        .filter(([b]) => b.width > 0 && (b.width < 44 || b.height < 44))
        .map(([b, e]) => `${e.className || e.tagName} ${Math.round(b.width)}x${Math.round(b.height)} "${(e.getAttribute('aria-label') || e.innerText).slice(0, 16)}"`),
    );
    if (r.length) small[label] = r;
  };
  for (const s of STEPS) {
    await reach(page, s);
    if (s === 'test') await expect(page.locator('.tp:not(.wait)')).toHaveCount(6, { timeout: 8000 });
    if (s === 'classroom') { await page.getByRole('button', { name: /^서윤 ·/ }).click(); await scan('classroom 대화'); }
    if (s === 'test') { await page.getByRole('dialog').getByRole('button').press('Enter'); }
    if (s === 'design') {
      await page.getByRole('radio', { name: PRODUCTS.desk.parts.form[0].name }).click();
      await scan('design 연결 패널');
      await page.keyboard.press('Escape');
    }
    await scan(s);
  }
  await page.goto('/?e2e=1&teacher=1');
  await scan('teacher');
  // 글자 크게에서도
  await reach(page, 'reflect');
  await page.evaluate(() => { document.documentElement.dataset.text = 'large'; });
  await scan('reflect large');
  expect(small).toEqual({});
});
