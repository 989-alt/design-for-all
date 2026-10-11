import { describe, expect, it } from 'vitest';
import { CARDS } from '../content/cards';
import { CASES } from '../content/cases';
import { ELEMENTS } from '../content/elements';
import { PRODUCTS } from '../content/products';
import { SAMPLES } from '../content/samples';
import type { NpcId, ProductId } from '../content/types';
import { npcsFor, SLOTS } from './judge';
import { mulberry32 } from './rng';
import { initState, reduce } from './state';
import type { Action, GameState } from './types';
import { verdict } from './verdict';

// PRD §4.7·S7: 제품을 고정하고 무작위 슬롯·연결·태깅·돌아보기 10,000판씩. 리듀서 직접 호출.
const GAMES = 10_000;

function randomGame(seed: number, product: ProductId): GameState {
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
  act({ type: 'pickProduct', productId: product });
  act({ type: 'nextStage' });
  while (s.research.length < 2) act({ type: 'pickRef', refId: pick(s.refOrder) });
  for (const r of s.research) act({ type: 'linkRef', refId: r.refId, cardId: pick(s.collected) });
  act({ type: 'nextStage' });

  const own = s.collected.filter((c) => CARDS.find((x) => x.id === c)!.product === product);
  const design = (slots: readonly (typeof SLOTS)[number][]) => {
    for (const slotId of slots) act({ type: 'setPart', slotId, partId: pick(PRODUCTS[product].parts[slotId]).id });
    for (const slotId of SLOTS) act({ type: 'linkPart', slotId, cardId: pick([null, ...own]) });
  };
  design(SLOTS);
  act({ type: 'runTest' });
  const revisions = 1 + Math.floor(rand() * 2);
  for (let i = 0; i < revisions; i++) {
    // 이유 규칙: 직전 라운드 부분·불만 NPC 중 무작위, 전원 만족이면 아무나
    const last = s.rounds[s.rounds.length - 1].reactions;
    const tested = Object.keys(last) as NpcId[];
    const unmet = tested.filter((n) => last[n] !== 'happy');
    act({ type: 'revise', reason: pick(unmet.length ? unmet : tested) });
    while (s.stage === 'revise') {
      design([pick(SLOTS)]);
      act({ type: 'runTest' }); // 슬롯이 그대로면 no_change 로 거부 → 다시 무작위
    }
  }
  act({ type: 'nextStage' });
  // 무작위 element id + T02 까닭 조각 — S5 는 id 로 판정하므로 무작위 플레이어도 성립
  const praise = SAMPLES.map((sm) => ({ sampleId: sm.id, element: el(), line: sm.praise[el()] }));
  act({ type: 'reflect', good: [el()], fix: [el()], praise });
  act({ type: 'finish' });
  return s;
}

describe('우회 검사 — 제품별 무작위 10,000판 (seed 고정)', () => {
  for (const product of Object.keys(PRODUCTS) as ProductId[]) {
    it(`${product}: S1~S6 동시 통과 < 1% ∧ S1∧S2 < 1% ∧ 평균 satisfied ≤ n/2`, () => {
      const t0 = performance.now();
      let all = 0, design = 0, sat = 0, s5 = 0;
      for (let g = 0; g < GAMES; g++) {
        const s = randomGame(20261011 + g, product);
        expect(s.stage).toBe('result');
        const v = verdict(s);
        sat += s.rounds[s.rounds.length - 1].satisfied;
        if (v.passed === 6) all++;
        if (v.S1 && v.S2) design++;
        if (v.S5) s5++;
      }
      const ms = performance.now() - t0;
      const n = npcsFor(product).length;
      console.log(`${product}: ${GAMES}판 ${ms.toFixed(0)}ms, S1~S6 ${((all / GAMES) * 100).toFixed(2)}%, S1∧S2 ${((design / GAMES) * 100).toFixed(2)}%, `
        + `S5 ${((s5 / GAMES) * 100).toFixed(1)}%, 평균 만족 ${(sat / GAMES).toFixed(3)} / ${n} (여유 ${(n / 2 - sat / GAMES).toFixed(3)})`);
      if (ms > 2000) console.warn(`${product}: 2초 초과 ${ms.toFixed(0)}ms`);
      expect(all / GAMES).toBeLessThan(0.01);
      expect(design / GAMES).toBeLessThan(0.01);
      expect(s5 / GAMES).toBeGreaterThan(0.9); // S5 는 막는 조건이 아님 — 설계 쪽이 막아야 한다
      expect(sat / GAMES).toBeLessThanOrEqual(n / 2);
    }, 60_000);
  }
});
