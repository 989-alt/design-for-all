// 판정식 S1~S6·S8(PRD §7)과 등급(§4.6). S7 은 bypass.test.ts.
import { CASES } from '../content/cases';
import { CARDS } from '../content/cards';
import { ELEMENTS } from '../content/elements';
import { SAMPLES } from '../content/samples';
import { linkOk, npcsFor, partOf, SLOTS } from './judge';
import type { GameState } from './types';

export type Grade = 'master' | 'care' | 'apprentice';
export interface Verdict {
  S1: boolean; S2: boolean; S3: boolean; S4: boolean; S5: boolean; S6: boolean;
  S8: boolean; // 로그 카운터 상한: 화면 전환 ≤20 ∧ 대화 ≤12 (애니메이션 시간은 e2e)
  passed: number; // S1~S6 통과 수
  grade: Grade;
}

export function grade(passed: number): Grade {
  return passed === 6 ? 'master' : passed >= 4 ? 'care' : 'apprentice';
}

export function verdict(s: GameState): Verdict {
  const last = s.rounds[s.rounds.length - 1];
  const n = s.product ? npcsFor(s.product).length : 0;
  const S1 = !!last && last.satisfied >= n - 1;
  const S2 = !!last && SLOTS.filter((sl) => linkOk(partOf(last.slots[sl]), last.links[sl])).length >= 4;
  const S3 = s.rounds.length >= 2 && s.rounds.slice(1).every((r) => !!r.reason);
  const first = (id: string) => s.tags.find((t) => t.caseId === id)?.tried[0];
  // 저상 버스 사례 — content 에 버스 식별자가 없어 제목으로 찾는다
  const bus = CASES.find((c) => c.title.includes('버스'));
  const S4 = CASES.filter((c) => first(c.id) === c.main).length >= 5 && !!bus && first(bus.id) === bus.main;
  // 요소 이름은 UI 가 element id 로 붙인다 — 문장 텍스트가 아니라 id 로 판정
  const S5 = s.reflect.good.length >= 1 && s.reflect.fix.length >= 1
    && SAMPLES.every((sm) => s.reflect.praise.some((p) => p.sampleId === sm.id && ELEMENTS.some((e) => e.id === p.element)));
  const cards = CARDS.filter((c) => s.collected.includes(c.id));
  const S6 = new Set(cards.map((c) => c.npc)).size >= 3 && cards.filter((c) => c.product === s.product).length >= 3;
  const S8 = s.log.filter((l) => l.e === 'stage').length <= 20 && s.log.filter((l) => l.e === 'talk').length <= 12;
  const passed = [S1, S2, S3, S4, S5, S6].filter(Boolean).length;
  return { S1, S2, S3, S4, S5, S6, S8, passed, grade: grade(passed) };
}
