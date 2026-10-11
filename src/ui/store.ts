// 리듀서를 감싼 전역 상태 하나. 화면들은 useGame() 으로 읽고 dispatch 로만 바꾼다
import { useEffect, useState } from 'preact/hooks';
import { initState, reduce } from '../engine/state';
import type { Action, GameState, Reject, Stage, Step } from '../engine/types';

let state: GameState = initState();
let rejected: Reject | undefined;
const subs = new Set<() => void>();

export function dispatch(a: Action): Step {
  const step = reduce(state, a, Date.now());
  state = step.state;
  rejected = step.rejected;
  subs.forEach((f) => f());
  return step;
}

export const getState = () => state;

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
