import { describe, expect, it } from 'vitest';
import { initState, reduce } from '../engine/state';
import type { GameState } from '../engine/types';
import { verdict } from '../engine/verdict';
import { badPolicy, goodPolicy, type Policy } from './autopilot';

// 리듀서로 끝까지 — 정책이 고른 액션은 한 번도 거부되면 안 된다
function play(policy: Policy, seed: number): GameState {
  let s = reduce(initState(), { type: 'start', seed }).state;
  for (let i = 0; i < 200; i++) {
    const a = policy(s);
    if (!a) return s;
    const step = reduce(s, a);
    expect(step.rejected, JSON.stringify(a)).toBeUndefined();
    s = step.state;
  }
  throw new Error('200 액션 안에 끝나지 않음');
}

describe.each([1, 7, 42, 2026])('seed %i', (seed) => {
  it('좋은 플레이 → master, bus 없음, 전원 만족', () => {
    const s = play(goodPolicy, seed);
    const v = verdict(s);
    expect(s.stage).toBe('result');
    expect(v).toMatchObject({ S1: true, S2: true, S3: true, S4: true, S5: true, S6: true, S8: true, grade: 'master' });
    expect(s.feedback).not.toContain('bus');
    expect(s.rounds.map((r) => r.satisfied)).toEqual([6, 6]);
  });

  it('나쁜 플레이 → apprentice, feedback bus, 수정은 색만(cosmetic_only)', () => {
    const s = play(badPolicy, seed);
    const v = verdict(s);
    expect(s.stage).toBe('result');
    expect(v.grade).toBe('apprentice');
    expect(v).toMatchObject({ S1: false, S2: false, S6: false });
    expect(s.feedback).toContain('bus');
    expect(s.rounds[0].satisfied).toBe(1);
    expect(s.rounds).toHaveLength(2);
    expect(s.log.some((l) => l.e === 'cosmetic_only')).toBe(true);
  });
});
