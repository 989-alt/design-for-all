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
const round = { slots: {}, links: {}, reactions: {}, lines: {}, satisfied: 5, worse: {} } as GameState['rounds'][number];
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
