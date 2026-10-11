import { describe, expect, it } from 'vitest';
import { HARMONY } from '../content/harmony';
import type { CardId, PartId, ProductId, SlotId } from '../content/types';
import { SLOTS } from './judge';
import { score } from './score';

const build = (product: ProductId, nos: number[], links: (CardId | null)[] = [null, null, null, null, null], satisfied = 0) => ({
  slots: Object.fromEntries(SLOTS.map((s, i) => [s, `${product}-${s}-${nos[i]}`])) as Record<SlotId, PartId>,
  links: Object.fromEntries(SLOTS.map((s, i) => [s, links[i]])) as Record<SlotId, CardId | null>,
  satisfied,
});

describe('점수 — 표값', () => {
  it('만족 n/n → 편리 100, 연결 4/5 맞음 → 목적 80', () => {
    const sc = score('desk', build('desk', [2, 3, 3, 3, 2], ['C09', 'C04', 'C17', 'C06', null], 6));
    expect(sc.access).toBe(100);
    expect(sc.purpose).toBe(80);
    expect(sc.function).toBe(100);
  });
  it('만족 3/5 → 편리 60', () => {
    expect(score('door', build('door', [1, 1, 1, 1, 1], undefined, 3)).access).toBe(60);
  });
  it('연결 틀림 — 효과표에 없는 카드는 목적 미인정, partial 카드는 인정', () => {
    expect(score('desk', build('desk', [2, 3, 3, 3, 2], ['C01', 'C09', 'C06', 'C17', 'C04'])).purpose).toBe(0);
    expect(score('locker', build('locker', [3, 1, 1, 1, 1], ['C02', null, null, null, null])).purpose).toBe(20);
  });
  it('환경 ♻ 100 · ♻절반 50 · 그 외 0', () => {
    expect(score('desk', build('desk', [1, 1, 1, 2, 1])).eco).toBe(100);
    expect(score('desk', build('desk', [1, 1, 1, 3, 1])).eco).toBe(50);
    expect(score('desk', build('desk', [1, 1, 1, 1, 1])).eco).toBe(0);
  });
  it('기능성 = full 해결 카드 / 제품 카드, ✗ 된 카드는 제외', () => {
    // 책상 카드 6: A3 가 C01·C04·C14 를 풀지만 F4 가 C01 을 ✗ → 2/6
    expect(score('desk', build('desk', [4, 3, 1, 1, 1])).function).toBe(33);
  });
  it('아름다움 = 조화표 (형태,색,소재)', () => {
    expect(score('desk', build('desk', [1, 4, 1, 4, 4])).beauty).toBe(HARMONY.desk['144']);
    expect(score('desk', build('desk', [1, 4, 1, 4, 4])).beauty).toBe(100);
  });
});

describe('최신성 참고 축 — ★ 없으면 null', () => {
  it('★ 없음 null, ★ 맞게 연결 100, 연결 없음·틀림 0', () => {
    expect(score('desk', build('desk', [1, 3, 1, 1, 1], [null, 'C01', null, null, null])).tech).toBeNull();
    expect(score('desk', build('desk', [1, 4, 1, 1, 1], [null, 'C01', null, null, null])).tech).toBe(100);
    expect(score('desk', build('desk', [1, 4, 1, 1, 1])).tech).toBe(0);
    expect(score('desk', build('desk', [1, 4, 1, 1, 1], [null, 'C09', null, null, null])).tech).toBe(0);
  });
});
