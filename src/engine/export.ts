// 결과 JSON(PRD §9) = GameState + 점수 6 + 판정식·등급 + 사례 첫 시도 정답 수. 개인정보 필드 없음
import { CASES } from '../content/cases';
import { score } from './score';
import type { GameState } from './types';
import { verdict } from './verdict';

// verdict S4 와 같은 셈: 사례마다 첫 시도가 주 요소인가
export const firstCorrectCount = (s: GameState) =>
  CASES.filter((c) => s.tags.find((t) => t.caseId === c.id)?.tried[0] === c.main).length;

export function exportResult(s: GameState) {
  const last = s.rounds[s.rounds.length - 1];
  return { ...s, scores: s.product && last ? score(s.product, last) : null, verdict: verdict(s), firstCorrect: firstCorrectCount(s) };
}
