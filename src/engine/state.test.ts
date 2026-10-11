import { describe, expect, it } from 'vitest';
import { CASES } from '../content/cases';
import { COSMETIC_LINE } from '../content/feedback';
import type { CardId, NpcId, PartId, SlotId } from '../content/types';
import { SLOTS } from './judge';
import { initState, reduce } from './state';
import type { Action, GameState } from './types';

const play = (s: GameState, ...acts: Action[]) =>
  acts.reduce((st, a) => {
    const r = reduce(st, a);
    expect(r.rejected, JSON.stringify(a)).toBeUndefined();
    return r.state;
  }, s);

const toClassroom = (seed = 42) =>
  play(initState(), { type: 'start', seed }, ...CASES.map((c): Action => ({ type: 'tagCase', caseId: c.id, elementId: c.main })), { type: 'nextStage' });

const collect = (s: GameState, cards: [NpcId, CardId][]) =>
  play(s, ...cards.flatMap(([npc, card]): Action[] => [{ type: 'talk', npcId: npc }, { type: 'takeCard', cardId: card }]));

const DESK: [NpcId, CardId][] = [['seoyun', 'C01'], ['dohyun', 'C04'], ['hajun', 'C06'], ['jian', 'C09'], ['haeun', 'C14'], ['grandma', 'C17']];

const toDesign = () =>
  play(collect(toClassroom(), DESK),
    { type: 'nextStage' }, { type: 'pickProduct', productId: 'desk' }, { type: 'nextStage' },
    { type: 'pickRef', refId: 'ref-07' }, { type: 'linkRef', refId: 'ref-07', cardId: 'C06' },
    { type: 'pickRef', refId: 'ref-02' }, { type: 'linkRef', refId: 'ref-02', cardId: 'C04' },
    { type: 'nextStage' });

const parts = (nos: [number, number, number, number, number]): Action[] =>
  SLOTS.map((slotId, i) => ({ type: 'setPart', slotId, partId: `desk-${slotId}-${nos[i]}` as PartId }));

describe('같은 seed → 같은 NPC 등장 순서·참고 카드 순서', () => {
  it('seed 42 두 번 deep-equal, 다른 seed 는 다름', () => {
    const a = reduce(initState(), { type: 'start', seed: 42 }).state;
    const b = reduce(initState(), { type: 'start', seed: 42 }).state;
    expect(a).toEqual(b);
    expect(a.npcOrder).toHaveLength(6);
    expect(a.refOrder).toHaveLength(12);
    const c = reduce(initState(), { type: 'start', seed: 7 }).state;
    expect([c.npcOrder, c.refOrder]).not.toEqual([a.npcOrder, a.refOrder]);
  });
});

describe('단계 기계', () => {
  it('title→cases→classroom→pick→research→design→test→revise→test→reflect→result 순서', () => {
    let s = toDesign();
    s = play(s, ...parts([2, 3, 3, 3, 2]), { type: 'runTest' }, { type: 'revise', reason: 'seoyun' },
      { type: 'setPart', slotId: 'material', partId: 'desk-material-2' }, { type: 'runTest' }, { type: 'nextStage' },
      { type: 'reflect', good: ['access'], fix: ['eco'], praise: [
        { sampleId: 'sample-01', element: 'beauty', line: '아름다움' }, { sampleId: 'sample-02', element: 'eco', line: '환경 고려' }] },
      { type: 'finish' });
    expect(s.log.filter((l) => l.e === 'stage').map((l) => l.d)).toEqual(
      ['cases', 'classroom', 'pick', 'research', 'design', 'test', 'revise', 'test', 'reflect', 'result']);
  });

  it('사례 7장 다 태깅 전에는 classroom 거부, 정답 카드 재태깅 거부', () => {
    const s = play(initState(), { type: 'start', seed: 1 }, { type: 'tagCase', caseId: 'case-01', elementId: 'tech' });
    expect(reduce(s, { type: 'nextStage' }).rejected).toBe('cases_incomplete');
    expect(reduce(s, { type: 'tagCase', caseId: 'case-01', elementId: 'eco' }).rejected).toBe('already_correct');
  });

  it('대화 안 한 NPC 카드는 못 가져감', () => {
    expect(reduce(toClassroom(), { type: 'takeCard', cardId: 'C01' }).rejected).toBe('not_talked');
  });
});

describe('진행 조건 — classroom→pick 은 카드 ≥4 ∧ NPC ≥3', () => {
  it("카드 3장(3명) 거부 'need_more_cards'", () => {
    const s = collect(toClassroom(), DESK.slice(0, 3));
    expect(reduce(s, { type: 'nextStage' }).rejected).toBe('need_more_cards');
  });
  it("카드 4장이지만 NPC 2명 거부 'need_more_cards'", () => {
    const s = collect(toClassroom(), [['seoyun', 'C01'], ['seoyun', 'C02'], ['dohyun', 'C04'], ['dohyun', 'C05']]);
    expect(reduce(s, { type: 'nextStage' }).rejected).toBe('need_more_cards');
  });
  it('카드 4장·NPC 3명 통과', () => {
    const s = collect(toClassroom(), [['seoyun', 'C01'], ['seoyun', 'C02'], ['dohyun', 'C04'], ['hajun', 'C06']]);
    expect(reduce(s, { type: 'nextStage' }).state.stage).toBe('pick');
  });
});

describe('제품 선택 후 해당 제품 카드 0장', () => {
  it("허용하되 로그 'no_cards_for_product'", () => {
    const s = play(collect(toClassroom(), DESK), { type: 'nextStage' });
    const r = reduce(s, { type: 'pickProduct', productId: 'door' });
    expect(r.rejected).toBeUndefined();
    expect(r.state.product).toBe('door');
    expect(r.effects!.map((e) => e.e)).toContain('no_cards_for_product');
    expect(reduce(s, { type: 'pickProduct', productId: 'desk' }).effects!.map((e) => e.e)).not.toContain('no_cards_for_product');
  });
});

describe('조사 — 2장 연결', () => {
  it('3장째 거부, 연결 안 하면 design 거부', () => {
    let s = play(collect(toClassroom(), DESK), { type: 'nextStage' }, { type: 'pickProduct', productId: 'desk' }, { type: 'nextStage' },
      { type: 'pickRef', refId: 'ref-01' }, { type: 'pickRef', refId: 'ref-02' });
    expect(reduce(s, { type: 'pickRef', refId: 'ref-03' }).rejected).toBe('two_refs_max');
    expect(reduce(s, { type: 'nextStage' }).rejected).toBe('need_two_refs');
    s = play(s, { type: 'linkRef', refId: 'ref-01', cardId: 'C06' });
    expect(reduce(s, { type: 'linkRef', refId: 'ref-02', cardId: 'C16' }).rejected).toBe('not_collected');
  });
});

describe('슬롯 미완', () => {
  it("5슬롯 안 차면 test 전이 거부 'slots_incomplete'", () => {
    const s = play(toDesign(), ...parts([2, 3, 3, 3, 2]).slice(0, 4));
    expect(reduce(s, { type: 'runTest' }).rejected).toBe('slots_incomplete');
  });
  it('남의 제품 부품 거부', () => {
    expect(reduce(toDesign(), { type: 'setPart', slotId: 'form', partId: 'door-form-1' }).rejected).toBe('bad_part');
  });
});

describe('연결 없음 — links[slot]=null 허용, ★ 부품이면 feedback tech', () => {
  it('★ 전동 높이 조절을 연결 없이 → tech, 연결 맞으면 tech 없음', () => {
    const s = play(toDesign(), ...parts([2, 4, 3, 3, 2]), { type: 'linkPart', slotId: 'form', cardId: null });
    const t = reduce(s, { type: 'runTest' }).state;
    expect(t.rounds[0].links).toEqual({ form: null, funcA: null, funcB: null, material: null, color: null });
    expect(t.feedback).toContain('tech');
    const ok = play(s, { type: 'linkPart', slotId: 'funcA', cardId: 'C04' }, { type: 'runTest' });
    expect(ok.feedback).not.toContain('tech');
  });
});

describe('수정 강제·상한·이유', () => {
  const tested = () => play(toDesign(), ...parts([1, 1, 1, 1, 1]), { type: 'runTest' });

  it("1차 뒤 바로 reflect 거부 'need_revise'", () => {
    expect(reduce(tested(), { type: 'nextStage' }).rejected).toBe('need_revise');
  });
  it("revise 에 reason 없으면 거부 'no_reason', 테스트에 없는 NPC 도 거부", () => {
    expect(reduce(tested(), { type: 'revise' }).rejected).toBe('no_reason');
  });
  it("슬롯 변경 0 이면 retest 거부 'no_change' (연결만 바꿔도 거부)", () => {
    const s = play(tested(), { type: 'revise', reason: 'jian' }, { type: 'linkPart', slotId: 'form', cardId: 'C09' });
    expect(reduce(s, { type: 'runTest' }).rejected).toBe('no_change');
    const t = play(s, { type: 'setPart', slotId: 'form', partId: 'desk-form-2' }, { type: 'runTest' });
    expect(t.rounds[1].reason).toBe('jian');
  });
  it("rounds 3 이면 revise 거부 'revise_limit', reflect 로만", () => {
    const s = play(tested(),
      { type: 'revise', reason: 'jian' }, { type: 'setPart', slotId: 'form', partId: 'desk-form-2' }, { type: 'runTest' },
      { type: 'revise', reason: 'hajun' }, { type: 'setPart', slotId: 'funcB', partId: 'desk-funcB-2' }, { type: 'runTest' });
    expect(s.rounds).toHaveLength(3);
    expect(reduce(s, { type: 'revise', reason: 'seoyun' }).rejected).toBe('revise_limit');
    expect(reduce(s, { type: 'nextStage' }).state.stage).toBe('reflect');
  });
});

describe('M2 신호 — 색·형태만 바꾸고 satisfied 변동 0', () => {
  it("log 'cosmetic_only' + 불만·부분 NPC 대표 줄 COSMETIC_LINE", () => {
    const s = play(toDesign(), ...parts([1, 1, 1, 1, 1]), { type: 'runTest' }, { type: 'revise', reason: 'seoyun' },
      { type: 'setPart', slotId: 'color', partId: 'desk-color-3' });
    const r = reduce(s, { type: 'runTest' });
    expect(r.effects!.map((e) => e.e)).toContain('cosmetic_only');
    expect(r.state.rounds[1].satisfied).toBe(r.state.rounds[0].satisfied);
    expect(r.state.rounds[1].lines.seoyun).toBe(COSMETIC_LINE);
  });
  it('기능 슬롯을 바꾸면 cosmetic_only 아님', () => {
    const s = play(toDesign(), ...parts([1, 1, 1, 1, 1]), { type: 'runTest' }, { type: 'revise', reason: 'hajun' },
      { type: 'setPart', slotId: 'funcB', partId: 'desk-funcB-3' });
    expect(reduce(s, { type: 'runTest' }).effects!.map((e) => e.e)).not.toContain('cosmetic_only');
  });
});

describe('완주 후 액션', () => {
  it("stage result 에서 모든 액션 거부 'finished'", () => {
    const s: GameState = { ...initState(), stage: 'result' };
    const all: Action[] = [
      { type: 'start', seed: 1 }, { type: 'tagCase', caseId: 'case-01', elementId: 'tech' }, { type: 'nextStage' },
      { type: 'talk', npcId: 'seoyun' }, { type: 'takeCard', cardId: 'C01' }, { type: 'pickProduct', productId: 'desk' },
      { type: 'pickRef', refId: 'ref-01' }, { type: 'linkRef', refId: 'ref-01', cardId: 'C01' },
      { type: 'setPart', slotId: 'form' as SlotId, partId: 'desk-form-1' }, { type: 'linkPart', slotId: 'form', cardId: null },
      { type: 'runTest' }, { type: 'revise', reason: 'seoyun' }, { type: 'reflect', good: [], fix: [], praise: [] }, { type: 'finish' },
    ];
    for (const a of all) {
      const r = reduce(s, a);
      expect(r.rejected, a.type).toBe('finished');
      expect(r.state).toBe(s);
    }
  });
  it('돌아보기 미완이면 finish 거부', () => {
    const s: GameState = { ...initState(), stage: 'reflect' };
    expect(reduce(s, { type: 'finish' }).rejected).toBe('reflect_incomplete');
  });
});
