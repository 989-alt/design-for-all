// 리듀서를 감싼 전역 상태 하나. 화면들은 useGame() 으로 읽고 dispatch 로만 바꾼다
import { useEffect, useState } from 'preact/hooks';
import { save } from '../engine/save';
import { initState, reduce } from '../engine/state';
import type { Action, GameState, Reject, Stage, Step } from '../engine/types';

let state: GameState = initState();
let rejected: Reject | undefined;
const subs = new Set<() => void>();

// 타이틀(새 판)은 저장하지 않아 이어하기가 저장본 있을 때만 보인다
const persist = () => state.stage !== 'title' && save(state);

export function dispatch(a: Action): Step {
  const step = reduce(state, a, Date.now());
  state = step.state;
  rejected = step.rejected;
  if (!rejected) persist(); // 거부되지 않은 액션 직후 동기 저장 — 렌더를 기다리지 않는다
  subs.forEach((f) => f());
  return step;
}

// 이어하기·처음으로: 상태를 통째로 갈아끼운다
export function hydrate(s: GameState) {
  state = s;
  rejected = undefined;
  subs.forEach((f) => f());
}

export const getState = () => state;

addEventListener('pagehide', persist);

// 전이 버튼 연타 방지: 아직 그 단계일 때만 보낸다
export function advance(from: Stage, a: Action = { type: 'nextStage' }) {
  if (state.stage === from) dispatch(a);
}

export function useGame() {
  const [, tick] = useState(0);
  const seen = state;
  useEffect(() => {
    const f = () => tick((n) => n + 1);
    subs.add(f);
    if (state !== seen) f(); // 렌더와 구독 사이에 바뀐 것(예: 로드 직후 __dfa)을 따라잡는다
    return () => void subs.delete(f);
  }, []);
  return { state, dispatch, rejected };
}

if (new URLSearchParams(location.search).get('e2e') === '1') {
  (window as unknown as { __dfa: unknown }).__dfa = { dispatch, getState };
}
