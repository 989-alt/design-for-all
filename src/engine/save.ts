// 중단 복구 저장본(PRD §9). 상태가 바뀔 때마다 통째로 쓴다. 손상·옛 판은 없는 것으로 본다
import type { GameState, Stage } from './types';

export const SAVE_KEY = 'dfa.save.v1';
const STAGES: Stage[] = ['cases', 'classroom', 'pick', 'research', 'design', 'test', 'revise', 'reflect', 'result'];

export function save(s: GameState) {
  localStorage.setItem(SAVE_KEY, JSON.stringify({ v: 1, state: s }));
}

export function load(): GameState | null {
  try {
    const o = JSON.parse(localStorage.getItem(SAVE_KEY) ?? 'null');
    return o?.v === 1 && o.state?.v === 1 && STAGES.includes(o.state.stage) ? o.state : null;
  } catch {
    return null;
  }
}

export const clear = () => localStorage.removeItem(SAVE_KEY);
