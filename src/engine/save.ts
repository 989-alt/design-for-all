// 중단 복구 저장본(PRD §9). 상태가 바뀔 때마다 통째로 쓴다. 손상·옛 판은 없는 것으로 본다
import { PRODUCTS } from '../content/products';
import type { GameState, Stage } from './types';

export const SAVE_KEY = 'dfa.save.v1';
const STAGES: Stage[] = ['cases', 'classroom', 'pick', 'research', 'design', 'test', 'revise', 'reflect', 'result'];

export function save(s: GameState) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ v: 1, state: s }));
  } catch {
    /* 용량 초과·저장 막힘: 저장 없이 계속 논다 */
  }
}

// 돌아보기·결과 화면이 읽는 필드가 다 있어야 그 단계로 복원한다
const finishedOk = (s: GameState) =>
  !!s.product && s.product in PRODUCTS && Array.isArray(s.rounds) && s.rounds.length >= 1
  && s.rounds.every((r) => r?.slots && r.worse && typeof r.satisfied === 'number')
  && ['good', 'fix', 'praise'].every((k) => Array.isArray(s.reflect?.[k as 'good']))
  && Array.isArray(s.tags) && Array.isArray(s.collected) && Array.isArray(s.log);

export function load(): GameState | null {
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY) ?? 'null');
    if (s?.v !== 1 || s.state?.v !== 1 || !STAGES.includes(s.state.stage)) return null;
    return s.state.stage !== 'reflect' && s.state.stage !== 'result' || finishedOk(s.state) ? s.state : null;
  } catch {
    return null;
  }
}

export const clear = () => localStorage.removeItem(SAVE_KEY);
