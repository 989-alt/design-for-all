import { describe, expect, it } from 'vitest';
import { CARDS } from '../content/cards';
import { CASES } from '../content/cases';
import { ELEMENTS } from '../content/elements';
import { PRODUCTS } from '../content/products';
import { SAMPLES } from '../content/samples';
import type { ProductId } from '../content/types';
import { npcsFor, SLOTS } from './judge';
import { mulberry32 } from './rng';
import { initState, reduce } from './state';
import type { Action, GameState } from './types';
import { verdict } from './verdict';

// PRD §4.7·S7: 무작위 슬롯·연결·태깅·돌아보기 10,000판. 리듀서 직접 호출.
const GAMES = 10_000;

function randomGame(seed: number): GameState {
  const rand = mulberry32(seed);
  const pick = <T,>(xs: readonly T[]): T => xs[Math.floor(rand() * xs.length)];
  let s = initState();
  const act = (a: Action) => {
    s = reduce(s, a).state;
  };
  const el = () => pick(ELEMENTS).id;

  act({ type: 'start', seed });
  for (const c of CASES) {
    // 첫 시도 무작위, 틀리면 맞을 때까지 다시
    while (!s.tags.find((t) => t.caseId === c.id)?.correct) act({ type: 'tagCase', caseId: c.id, elementId: el() });
  }
  act({ type: 'nextStage' });
  while (s.stage === 'classroom') {
    const npc = pick(s.npcOrder);
    act({ type: 'talk', npcId: npc });
    const left = CARDS.filter((c) => c.npc === npc && !s.collected.includes(c.id));
    if (left.length) act({ type: 'takeCard', cardId: pick(left).id });
    act({ type: 'nextStage' });
  }
  act({ type: 'pickProduct', productId: pick(Object.keys(PRODUCTS) as ProductId[]) });
  act({ type: 'nextStage' });
  while (s.research.length < 2) act({ type: 'pickRef', refId: pick(s.refOrder) });
  for (const r of s.research) act({ type: 'linkRef', refId: r.refId, cardId: pick(s.collected) });
  act({ type: 'nextStage' });

  const product = s.product!;
  const own = s.collected.filter((c) => CARDS.find((x) => x.id === c)!.product === product);
  const design = (slots: readonly (typeof SLOTS)[number][]) => {
    for (const slotId of slots) act({ type: 'setPart', slotId, partId: pick(PRODUCTS[product].parts[slotId]).id });
    for (const slotId of SLOTS) act({ type: 'linkPart', slotId, cardId: pick([null, ...own]) });
  };
  design(SLOTS);
  act({ type: 'runTest' });
  const revisions = 1 + Math.floor(rand() * 2);
  for (let i = 0; i < revisions; i++) {
    act({ type: 'revise', reason: pick(npcsFor(product)) });
    while (s.stage === 'revise') {
      design([pick(SLOTS)]);
      act({ type: 'runTest' }); // 슬롯이 그대로면 no_change 로 거부 → 다시 무작위
    }
  }
  act({ type: 'nextStage' });
  const praise = SAMPLES.map((sm) => {
    const element = el();
    // UI 조립 문장: 주어 · 요소 이름 · 까닭(무작위 조각)
    return { sampleId: sm.id, element, line: `${sm.title}은 ${ELEMENTS.find((e) => e.id === element)!.name}이 좋아요. ${sm.praise[el()]}` };
  });
  act({ type: 'reflect', good: [el()], fix: [el()], praise });
  act({ type: 'finish' });
  return s;
}

describe('우회 검사 — 무작위 10,000판 (seed 고정, 제품별)', () => {
  it('S1~S6 동시 통과 < 1% ∧ 평균 satisfied ≤ n/2', () => {
    const t0 = performance.now();
    const stat: Record<ProductId, { games: number; all: number; sat: number }> = {
      desk: { games: 0, all: 0, sat: 0 }, locker: { games: 0, all: 0, sat: 0 }, door: { games: 0, all: 0, sat: 0 },
    };
    for (let g = 0; g < GAMES; g++) {
      const s = randomGame(20261011 + g);
      expect(s.stage).toBe('result');
      const st = stat[s.product!];
      st.games++;
      st.sat += s.rounds[s.rounds.length - 1].satisfied;
      if (verdict(s).passed === 6) st.all++;
    }
    const ms = performance.now() - t0;
    console.log(`우회 검사 ${GAMES}판 ${ms.toFixed(0)}ms`);
    for (const p of Object.keys(stat) as ProductId[]) {
      const { games, all, sat } = stat[p];
      const n = npcsFor(p).length;
      console.log(`${p}: ${games}판, S1~S6 동시 통과 ${((all / games) * 100).toFixed(2)}%, 평균 만족 ${(sat / games).toFixed(3)} / ${n}`);
      expect(all / games, p).toBeLessThan(0.01);
      expect(sat / games, p).toBeLessThanOrEqual(n / 2);
    }
  });
});
