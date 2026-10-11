import { describe, expect, it } from 'vitest';
import { CASES } from '../content/cases';
import type { CardId, NpcId, PartId } from '../content/types';
import { exportResult, firstCorrectCount } from './export';
import { SLOTS } from './judge';
import { initState, reduce } from './state';
import type { Action } from './types';

const DESK: [NpcId, CardId][] = [['seoyun', 'C01'], ['dohyun', 'C04'], ['hajun', 'C06'], ['jian', 'C09'], ['haeun', 'C14'], ['grandma', 'C17']];
const acts: Action[] = [
  { type: 'start', seed: 42 },
  ...CASES.map((c): Action => ({ type: 'tagCase', caseId: c.id, elementId: c.main })),
  { type: 'nextStage' },
  ...DESK.flatMap(([npcId, cardId]): Action[] => [{ type: 'talk', npcId }, { type: 'takeCard', cardId }]),
  { type: 'nextStage' }, { type: 'pickProduct', productId: 'desk' }, { type: 'nextStage' },
  { type: 'pickRef', refId: 'ref-07' }, { type: 'linkRef', refId: 'ref-07', cardId: 'C06' },
  { type: 'pickRef', refId: 'ref-02' }, { type: 'linkRef', refId: 'ref-02', cardId: 'C04' },
  { type: 'nextStage' },
  ...SLOTS.map((slotId, i): Action => ({ type: 'setPart', slotId, partId: `desk-${slotId}-${[2, 3, 3, 3, 2][i]}` as PartId })),
  { type: 'runTest' }, { type: 'revise', reason: 'seoyun' },
  { type: 'setPart', slotId: 'material', partId: 'desk-material-2' }, { type: 'runTest' }, { type: 'nextStage' },
  { type: 'reflect', good: ['access'], fix: ['eco'], praise: [
    { sampleId: 'sample-01', element: 'beauty', line: '아름다움' }, { sampleId: 'sample-02', element: 'eco', line: '환경 고려' }] },
  { type: 'finish' },
];
const done = acts.reduce((s, a) => reduce(s, a, 1).state, initState());

describe('exportResult', () => {
  it('완주 판의 키 목록 = GameState + scores + verdict, 개인정보 필드 없음', () => {
    expect(done.stage).toBe('result');
    const r = exportResult(done);
    expect(Object.keys(r).sort()).toEqual([
      'collected', 'draft', 'feedback', 'log', 'npcOrder', 'product', 'reflect', 'refOrder', 'research',
      'rounds', 'scores', 'seed', 'stage', 'startedAt', 'tags', 'v', 'verdict', 'firstCorrect',
    ].sort());
    expect(Object.keys(r.scores!).sort()).toEqual(['access', 'beauty', 'eco', 'function', 'purpose', 'tech']);
    expect(Object.keys(r.verdict).sort()).toEqual(['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S8', 'grade', 'passed']);
    expect(JSON.stringify(r)).not.toMatch(/"(name|studentName|email|phone|number|school|class)"\s*:/);
  });

  it('JSON 왕복 뒤에도 같은 값', () => {
    const r = exportResult(done);
    expect(JSON.parse(JSON.stringify(r))).toEqual(r);
  });

  it('사례 첫 시도 정답 수 — 결과 화면과 같은 helper, verdict S4 와 같은 셈', () => {
    expect(firstCorrectCount(done)).toBe(CASES.length);
    expect(exportResult(done).firstCorrect).toBe(CASES.length);
    const wrongFirst = CASES.reduce((s, c) => reduce(s, { type: 'tagCase', caseId: c.id, elementId: c.main === 'eco' ? 'beauty' : 'eco' }, 1).state,
      reduce(initState(), { type: 'start', seed: 1 }, 1).state);
    expect(firstCorrectCount(wrongFirst)).toBe(0);
  });

  it('테스트 전이면 scores 는 null', () => {
    expect(exportResult(initState()).scores).toBeNull();
  });
});
