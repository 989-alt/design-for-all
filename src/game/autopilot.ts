// 테스트 전용 자동 조작 정책(T09). 상태를 받아 다음 액션 하나를 고른다. 앱 번들은 이 파일을 import 하지 않는다
// title(start) 은 부르는 쪽이 보내고, result 에선 null
import { CARDS } from '../content/cards';
import { CASES } from '../content/cases';
import { ELEMENTS } from '../content/elements';
import { SAMPLES } from '../content/samples';
import type { CardId, PartId, ProductId, SlotId } from '../content/types';
import { SLOTS } from '../engine/judge';
import { mulberry32 } from '../engine/rng';
import type { Action, GameState } from '../engine/types';

export type Policy = (s: GameState) => Action | null;

const talked = (s: GameState, npc: string) => s.log.some((l) => l.e === 'talk' && l.d === npc);
const unmet = (s: GameState) => {
  const r = s.rounds[s.rounds.length - 1].reactions;
  const tested = Object.keys(r) as (keyof typeof r)[];
  return tested.find((n) => r[n] !== 'happy') ?? tested[0];
};

// 조립대: 목표 부품·연결과 다른 슬롯부터 맞추고, 다 맞으면 테스트
function build(s: GameState, slots: Record<SlotId, PartId>, links: Partial<Record<SlotId, CardId>>): Action {
  for (const sl of SLOTS) {
    if (s.draft.slots[sl] !== slots[sl]) return { type: 'setPart', slotId: sl, partId: slots[sl] };
    if (links[sl] && s.draft.links[sl] !== links[sl]) return { type: 'linkPart', slotId: sl, cardId: links[sl]! };
  }
  return { type: 'runTest' };
}

// 책상 6명 전원 만족(F2·A3·B3·M3·K2), 부품마다 맞는 카드 연결. 수정 1회 = 높이를 전동(★)으로, 연결 C01 유지
const GOOD_SLOTS: Record<SlotId, PartId> = { form: 'desk-form-2', funcA: 'desk-funcA-3', funcB: 'desk-funcB-3', material: 'desk-material-3', color: 'desk-color-2' };
const GOOD_LINKS: Record<SlotId, CardId> = { form: 'C09', funcA: 'C01', funcB: 'C17', material: 'C06', color: 'C09' };
const GOOD_REFS: [string, CardId][] = [['ref-07', 'C06'], ['ref-02', 'C04']];

export const goodPolicy: Policy = (s) => {
  switch (s.stage) {
    case 'cases': {
      const c = CASES.find((x) => !s.tags.some((t) => t.caseId === x.id));
      return c ? { type: 'tagCase', caseId: c.id, elementId: c.main } : { type: 'nextStage' };
    }
    case 'classroom': {
      const c = CARDS.find((x) => x.product === 'desk' && !s.collected.includes(x.id));
      if (!c) return { type: 'nextStage' };
      return talked(s, c.npc) ? { type: 'takeCard', cardId: c.id } : { type: 'talk', npcId: c.npc };
    }
    case 'pick':
      return s.product ? { type: 'nextStage' } : { type: 'pickProduct', productId: 'desk' };
    case 'research': {
      for (const [refId, cardId] of GOOD_REFS) {
        const r = s.research.find((x) => x.refId === refId);
        if (!r) return { type: 'pickRef', refId };
        if (r.cardId !== cardId) return { type: 'linkRef', refId, cardId };
      }
      return { type: 'nextStage' };
    }
    case 'design':
      return build(s, GOOD_SLOTS, GOOD_LINKS);
    case 'revise':
      return build(s, { ...GOOD_SLOTS, funcA: 'desk-funcA-4' }, GOOD_LINKS);
    case 'test':
      return s.rounds.length < 2 ? { type: 'revise', reason: unmet(s) } : { type: 'nextStage' };
    case 'reflect':
      return s.reflect.good.length
        ? { type: 'finish' }
        : { type: 'reflect', good: ['access'], fix: ['eco'], praise: [
          { sampleId: SAMPLES[0].id, element: 'purpose', line: SAMPLES[0].praise.purpose },
          { sampleId: SAMPLES[1].id, element: 'access', line: SAMPLES[1].praise.access },
        ] };
    default:
      return null;
  }
};

// 나쁜 플레이: 부품 1번 위주(색 3)에 한 명만 푸는 부품 하나, 연결 없음 → 1차 만족 ≤1 로 bus
const BAD_ONE: Record<ProductId, [SlotId, PartId]> = {
  desk: ['funcB', 'desk-funcB-3'], // 할머니
  locker: ['funcB', 'locker-funcB-2'], // 지안
  door: ['funcB', 'door-funcB-4'], // 지안
};
const badSlots = (p: ProductId, color: 3 | 4) => {
  const slots = Object.fromEntries(SLOTS.map((sl) => [sl, `${p}-${sl}-${sl === 'color' ? color : 1}`])) as Record<SlotId, PartId>;
  slots[BAD_ONE[p][0]] = BAD_ONE[p][1];
  return slots;
};

export const badPolicy: Policy = (s) => {
  switch (s.stage) {
    case 'cases': {
      // 무작위 태그(시드 고정) — 사례마다 한 번만
      const c = CASES.find((x) => !s.tags.some((t) => t.caseId === x.id));
      if (!c) return { type: 'nextStage' };
      const e = ELEMENTS[Math.floor(mulberry32(s.seed * 31 + s.tags.length)() * ELEMENTS.length)];
      return { type: 'tagCase', caseId: c.id, elementId: e.id };
    }
    case 'classroom': {
      // 최소 조건: 등장 순 앞 4명에게서 1장씩
      if (s.collected.length >= 4) return { type: 'nextStage' };
      const npc = s.npcOrder[s.collected.length];
      return talked(s, npc) ? { type: 'takeCard', cardId: CARDS.find((c) => c.npc === npc)!.id } : { type: 'talk', npcId: npc };
    }
    case 'pick': {
      if (s.product) return { type: 'nextStage' };
      // 모은 카드가 가장 적은 제품
      const n = (p: ProductId) => CARDS.filter((c) => c.product === p && s.collected.includes(c.id)).length;
      const productId = (['desk', 'locker', 'door'] as const).reduce((a, b) => (n(b) < n(a) ? b : a));
      return { type: 'pickProduct', productId };
    }
    case 'research': {
      for (const refId of s.refOrder.slice(0, 2)) {
        const r = s.research.find((x) => x.refId === refId);
        if (!r) return { type: 'pickRef', refId };
        if (!r.cardId) return { type: 'linkRef', refId, cardId: s.collected[0] };
      }
      return { type: 'nextStage' };
    }
    case 'design':
      return build(s, badSlots(s.product!, 3), {});
    case 'revise':
      return build(s, badSlots(s.product!, 4), {}); // 색만 → cosmetic_only
    case 'test':
      return s.rounds.length < 2 ? { type: 'revise', reason: unmet(s) } : { type: 'nextStage' };
    case 'reflect':
      return s.reflect.good.length
        ? { type: 'finish' }
        : { type: 'reflect', good: ['beauty'], fix: ['beauty'], praise: SAMPLES.map((sm) => ({ sampleId: sm.id, element: 'beauty' as const, line: sm.praise.beauty })) };
    default:
      return null;
  }
};
