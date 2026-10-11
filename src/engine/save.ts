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

const arr = Array.isArray;
const obj = (o: unknown) => !!o && typeof o === 'object';
const at = (s: GameState, from: Stage) => STAGES.indexOf(s.stage) >= STAGES.indexOf(from);

// 어느 단계든 화면들이 읽는 필드가 다 있어야 그 단계로 복원한다. 조사부터는 제품, 테스트부터는 라운드 1개 이상
const shapeOk = (s: GameState) =>
  [s.tags, s.collected, s.log, s.npcOrder, s.refOrder, s.research, s.feedback, s.rounds].every(arr)
  && obj(s.draft) && obj(s.draft.slots) && obj(s.draft.links)
  && s.rounds.every((r) => obj(r) && obj(r.slots) && obj(r.links) && obj(r.reactions) && obj(r.lines) && obj(r.worse) && typeof r.satisfied === 'number')
  && ['good', 'fix', 'praise'].every((k) => arr(s.reflect?.[k as 'good']))
  && (!at(s, 'research') || (typeof s.product === 'string' && Object.prototype.hasOwnProperty.call(PRODUCTS, s.product)))
  && (!at(s, 'test') || s.rounds.length >= 1);

export function load(): GameState | null {
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY) ?? 'null');
    if (s?.v !== 1 || s.state?.v !== 1 || !STAGES.includes(s.state.stage)) return null;
    return shapeOk(s.state) ? s.state : null;
  } catch {
    return null;
  }
}

export const clear = () => localStorage.removeItem(SAVE_KEY);
