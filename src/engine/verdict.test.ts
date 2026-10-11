import { describe, expect, it } from 'vitest';
import { CASES } from '../content/cases';
import type { CardId, ElementId, NpcId, PartId, SlotId } from '../content/types';
import { SLOTS } from './judge';
import { initState } from './state';
import type { GameState, Round } from './types';
import { grade, verdict } from './verdict';

const round = (satisfied: number, nos = [2, 3, 3, 3, 2], links: (CardId | null)[] = ['C09', 'C04', 'C17', 'C06', 'C09'], reason?: NpcId): Round => ({
  slots: Object.fromEntries(SLOTS.map((s, i) => [s, `desk-${s}-${nos[i]}`])) as Record<SlotId, PartId>,
  links: Object.fromEntries(SLOTS.map((s, i) => [s, links[i]])) as Record<SlotId, CardId | null>,
  reactions: {}, lines: {}, satisfied, ...(reason ? { reason } : {}),
});

// 6개 전부 통과하는 완주 상태(책상)
const full = (): GameState => ({
  ...initState(),
  stage: 'result',
  product: 'desk',
  tags: CASES.map((c) => ({ caseId: c.id, tried: [c.main], correct: true })),
  collected: ['C01', 'C04', 'C06', 'C09'],
  rounds: [round(2), round(6, undefined, undefined, 'seoyun')],
  reflect: { good: ['access'], fix: ['eco'], praise: [
    { sampleId: 'sample-01', element: 'beauty', line: '접는 벽 책상은 아름다움이 좋아요' },
    { sampleId: 'sample-02', element: 'access', line: '회전 사물함은 누구나 편리해요' }] },
});

const wrong = (main: ElementId): ElementId => (main === 'tech' ? 'eco' : 'tech');

describe('판정식 — 경계값', () => {
  it('완주 기본형은 S1~S6 전부 통과 → master', () => {
    const v = verdict(full());
    expect([v.S1, v.S2, v.S3, v.S4, v.S5, v.S6]).toEqual([true, true, true, true, true, true]);
    expect(v.grade).toBe('master');
  });
  it('S1 — 책상 n=6: 만족 5 통과, 4 실패', () => {
    expect(verdict({ ...full(), rounds: [round(2), round(5, undefined, undefined, 'seoyun')] }).S1).toBe(true);
    expect(verdict({ ...full(), rounds: [round(2), round(4, undefined, undefined, 'seoyun')] }).S1).toBe(false);
  });
  it('S2 — 맞는 연결 4 통과, 3 실패', () => {
    const r = (links: (CardId | null)[]) => verdict({ ...full(), rounds: [round(2), round(6, undefined, links, 'seoyun')] }).S2;
    expect(r(['C09', 'C04', 'C17', 'C06', null])).toBe(true);
    expect(r(['C09', 'C04', 'C17', null, null])).toBe(false);
  });
  it('S3 — 수정 1회 이상 ∧ 모든 수정에 reason', () => {
    expect(verdict({ ...full(), rounds: [round(6)] }).S3).toBe(false);
    expect(verdict({ ...full(), rounds: [round(2), round(6)] }).S3).toBe(false);
    expect(verdict({ ...full(), rounds: [round(2), round(5, undefined, undefined, 'jian'), round(6)] }).S3).toBe(false);
  });
  it('S4 — 첫 시도 정답 5 + 버스 정답 통과, 4 실패, 6 이어도 버스 오답이면 실패', () => {
    const tags = (bad: string[]) => CASES.map((c) => {
      const b = bad.includes(c.id);
      return { caseId: c.id, tried: b ? [wrong(c.main), c.main] : [c.main], correct: true };
    });
    expect(verdict({ ...full(), tags: tags(['case-01', 'case-02']) }).S4).toBe(true);
    expect(verdict({ ...full(), tags: tags(['case-01', 'case-02', 'case-03']) }).S4).toBe(false);
    expect(verdict({ ...full(), tags: tags(['case-07']) }).S4).toBe(false);
  });
  it('S5 — 칭찬 문장에 요소 이름 없으면 실패, 돌아보기 태그 빈 칸 실패', () => {
    const f = full();
    expect(verdict({ ...f, reflect: { ...f.reflect, praise: [f.reflect.praise[0], { sampleId: 'sample-02', element: 'eco', line: '좋아요' }] } }).S5).toBe(false);
    expect(verdict({ ...f, reflect: { ...f.reflect, fix: [] } }).S5).toBe(false);
  });
  it('S6 — NPC 3명 ∧ 제품 카드 3장', () => {
    expect(verdict({ ...full(), collected: ['C01', 'C04', 'C06'] }).S6).toBe(true);
    expect(verdict({ ...full(), collected: ['C01', 'C02', 'C04', 'C05'] }).S6).toBe(false);
    expect(verdict({ ...full(), collected: ['C01', 'C04', 'C10', 'C11'] }).S6).toBe(false);
  });
  it('등급 — 6 master, 4~5 care, ≤3 apprentice', () => {
    expect([6, 5, 4, 3, 0].map(grade)).toEqual(['master', 'care', 'care', 'apprentice', 'apprentice']);
    const v = verdict({ ...full(), rounds: [round(6)] }); // S3 하나 실패
    expect([v.passed, v.grade]).toEqual([5, 'care']);
  });
  it('S8 — 화면 전환 ≤20 ∧ 대화 ≤12 (로그 카운터)', () => {
    const log = (e: string, n: number) => Array.from({ length: n }, () => ({ t: 0, e }));
    expect(verdict({ ...full(), log: [...log('stage', 20), ...log('talk', 12)] }).S8).toBe(true);
    expect(verdict({ ...full(), log: log('stage', 21) }).S8).toBe(false);
    expect(verdict({ ...full(), log: log('talk', 13) }).S8).toBe(false);
  });
});
