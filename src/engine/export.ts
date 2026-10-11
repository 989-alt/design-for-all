// 결과 JSON(PRD §9) = GameState + 점수 6 + 판정식·등급. scripts/check-result.mjs 가 읽는다. 개인정보 필드 없음
import { score } from './score';
import type { GameState } from './types';
import { verdict } from './verdict';

export function exportResult(s: GameState) {
  const last = s.rounds[s.rounds.length - 1];
  return { ...s, scores: s.product && last ? score(s.product, last) : null, verdict: verdict(s) };
}
