import { beforeEach, describe, expect, it } from 'vitest';
import { clear, load, save, SAVE_KEY } from './save';
import { initState, reduce } from './state';
import type { GameState } from './types';

// vitest 는 node 환경 — localStorage 를 메모리로 대신한다
const mem = new Map<string, string>();
Object.assign(globalThis, {
  localStorage: {
    getItem: (k: string) => mem.get(k) ?? null,
    setItem: (k: string, v: string) => void mem.set(k, v),
    removeItem: (k: string) => void mem.delete(k),
  },
});

const started = () => reduce(initState(), { type: 'start', seed: 7 }, 1).state;
const slots = { form: 'desk-form-1', funcA: 'desk-funcA-1', funcB: 'desk-funcB-1', material: 'desk-material-1', color: 'desk-color-1' } as const;
const round = { slots, links: {}, reactions: {}, lines: {}, satisfied: 5, worse: {} } as GameState['rounds'][number];
const finished = (): GameState => ({ ...started(), stage: 'result', product: 'desk', rounds: [round] });

describe('save', () => {
  beforeEach(() => mem.clear());

  it('저장본이 없으면 null', () => expect(load()).toBeNull());

  it('저장한 상태를 그대로 돌려준다', () => {
    const s = started();
    save(s);
    expect(JSON.parse(mem.get(SAVE_KEY)!).v).toBe(1);
    expect(load()).toEqual(s);
  });

  it('완주 저장본(stage result)도 돌려준다', () => {
    save(finished());
    expect(load()?.stage).toBe('result');
  });

  it('돌아보기·결과 저장본은 그 화면이 읽는 필드가 없으면 null', () => {
    for (const bad of [
      { ...finished(), product: null },
      { ...finished(), product: 'boss' },
      { ...finished(), rounds: [] },
      { ...finished(), stage: 'reflect', rounds: [] },
      { ...finished(), rounds: [{ ...round, worse: undefined }] },
      { ...finished(), reflect: { good: [], fix: [] } },
      { ...finished(), tags: undefined },
    ]) {
      mem.set(SAVE_KEY, JSON.stringify({ v: 1, state: bad }));
      expect(load(), JSON.stringify(bad).slice(0, 80)).toBeNull();
    }
    save({ ...finished(), stage: 'reflect' });
    expect(load()?.stage).toBe('reflect');
  });

  it('모든 단계: 공통 필드가 빠지면 null, 조사부터 제품·테스트부터 라운드 필요', () => {
    for (const stage of ['cases', 'classroom', 'pick', 'research', 'design', 'test', 'revise', 'reflect', 'result'] as const) {
      const ok = { ...finished(), stage };
      save(ok);
      expect(load()?.stage, stage).toBe(stage);
      for (const bad of [
        { ...ok, collected: null },
        { ...ok, npcOrder: undefined },
        { ...ok, research: {} },
        { ...ok, draft: { slots: {} } },
        { ...ok, rounds: [{ ...round, reactions: undefined }] },
        { ...ok, reflect: undefined },
      ]) {
        mem.set(SAVE_KEY, JSON.stringify({ v: 1, state: bad }));
        expect(load(), `${stage} ${JSON.stringify(bad).slice(0, 60)}`).toBeNull();
      }
    }
    for (const stage of ['research', 'design'] as const) {
      mem.set(SAVE_KEY, JSON.stringify({ v: 1, state: { ...started(), stage, product: 'toString' } }));
      expect(load(), stage).toBeNull();
    }
    for (const stage of ['test', 'revise'] as const) {
      mem.set(SAVE_KEY, JSON.stringify({ v: 1, state: { ...started(), stage, product: 'desk' } }));
      expect(load(), stage).toBeNull();
    }
    save({ ...started(), stage: 'pick' });
    expect(load()?.stage).toBe('pick');
  });

  it('콘텐츠 표에 없는 id·깨진 원소는 null (QA r1 #1 세 사례 + 그 밖)', () => {
    for (const bad of [
      { ...finished(), rounds: [{ ...round, slots: { ...slots, form: 'desk-form-99' } }] },
      { ...finished(), tags: [null] },
      { ...finished(), stage: 'research', refOrder: ['missing'] },
      { ...finished(), rounds: [{ ...round, slots: { ...slots, form: 'locker-form-1' } }] },
      { ...finished(), rounds: [{ ...round, slots: { ...slots, color: undefined } }] },
      { ...finished(), collected: ['C99'] },
      { ...finished(), npcOrder: ['boss'] },
      { ...finished(), research: [{ refId: 'ref-01', cardId: 'C99' }] },
      { ...finished(), rounds: [{ ...round, reactions: { seoyun: 'angry' } }] },
      { ...finished(), reflect: { good: [], fix: [], praise: [{ sampleId: 'nope', element: 'purpose', line: '' }] } },
      { ...finished(), log: [null] },
    ]) {
      mem.set(SAVE_KEY, JSON.stringify({ v: 1, state: bad }));
      expect(load(), JSON.stringify(bad).slice(0, 120)).toBeNull();
    }
  });

  // QA r2 #1: 순서 배열이 비거나 겹치면 고를 NPC·참고 카드가 사라져 진행이 막힌다
  const rejects = (bad: object) => {
    mem.set(SAVE_KEY, JSON.stringify({ v: 1, state: bad }));
    expect(load(), JSON.stringify(bad).slice(0, 120)).toBeNull();
  };
  const ok = (): GameState => ({ ...finished(), stage: 'research' });

  it('refOrder 가 빈 배열·중복·일부만이면 null', () => {
    const ids = ok().refOrder;
    for (const refOrder of [[], [ids[0], ids[0]], ids.slice(1), [...ids.slice(1), ids[1]]]) rejects({ ...ok(), refOrder });
  });

  it('npcOrder 가 빈 배열·중복·일부만이면 null', () => {
    const ids = ok().npcOrder;
    for (const npcOrder of [[], [ids[0], ids[0]], ids.slice(1), [...ids.slice(1), ids[1]]]) rejects({ ...ok(), npcOrder });
  });

  it('collected 중복이면 null', () => rejects({ ...ok(), collected: ['C01', 'C01'] }));

  it('research 같은 참고 카드 중복·3장 이상이면 null', () => {
    const [a, b, c] = ok().refOrder;
    rejects({ ...ok(), research: [{ refId: a, cardId: null }, { refId: a, cardId: null }] });
    rejects({ ...ok(), research: [a, b, c].map((refId) => ({ refId, cardId: null })) });
  });

  it('순서 배열이 다른 순열이어도 정상 저장본은 돌려준다', () => {
    const s: GameState = { ...ok(), npcOrder: ok().npcOrder.slice().reverse(), refOrder: ok().refOrder.slice().reverse(), collected: ['C01', 'C04'], research: [{ refId: ok().refOrder[0], cardId: 'C01' }] };
    save(s);
    expect(load()).toEqual(s);
  });

  it('저장소가 막혀도 clear 는 던지지 않는다', () => {
    const rm = localStorage.removeItem;
    localStorage.removeItem = () => { throw new DOMException('blocked', 'SecurityError'); };
    expect(() => clear()).not.toThrow();
    localStorage.removeItem = rm;
  });

  it('저장이 막혀도(용량 초과) 던지지 않는다', () => {
    const set = localStorage.setItem;
    localStorage.setItem = () => { throw new Error('QuotaExceededError'); };
    expect(() => save(started())).not.toThrow();
    localStorage.setItem = set;
  });

  it('손상 저장본은 무시: JSON 파싱 실패·v 불일치·stage 이상', () => {
    for (const bad of [
      '{not json',
      JSON.stringify({ v: 2, state: started() }),
      JSON.stringify({ v: 1, state: { ...started(), v: 2 } }),
      JSON.stringify({ v: 1, state: { ...started(), stage: 'boss' } }),
      JSON.stringify({ v: 1, state: { ...started(), stage: 'title' } }),
      JSON.stringify({ v: 1 }),
      'null',
    ]) {
      mem.set(SAVE_KEY, bad);
      expect(load(), bad).toBeNull();
    }
  });

  it('clear 뒤엔 null', () => {
    save(started());
    clear();
    expect(load()).toBeNull();
  });
});
