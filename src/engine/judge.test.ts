import { describe, expect, it } from 'vitest';
import { CARDS, WORSE_LINE } from '../content/cards';
import type { CardId, PartId, ProductId, SlotId } from '../content/types';
import { busTrigger, cosmeticOnly, npcsFor, react, SLOTS } from './judge';
import type { Round } from './types';

const build = (product: ProductId, nos: [number, number, number, number, number]) =>
  Object.fromEntries(SLOTS.map((s, i) => [s, `${product}-${s}-${nos[i]}`])) as Record<SlotId, PartId>;
const line = (id: string, k: 'happy' | 'partial' | 'unhappy') => CARDS.find((c) => c.id === id)!.reactions[k];

describe('반응 판정 — 그 제품 카드가 없는 NPC 는 제외', () => {
  it('책상 6·사물함 5·문 5', () => {
    expect(npcsFor('desk')).toHaveLength(6);
    expect(npcsFor('locker')).not.toContain('grandma');
    expect(npcsFor('locker')).toHaveLength(5);
    expect(npcsFor('door')).not.toContain('dohyun');
    expect(npcsFor('door')).toHaveLength(5);
    expect(Object.keys(react('door', build('door', [1, 1, 1, 1, 1])))).toHaveLength(5);
  });
});

describe('반응 판정 — full → happy, 일부·partial → partial, 없음·worse → unhappy', () => {
  it('책상 F4+A3 에서 N1 unhappy(F4) — A3 가 C01 을 풀어도 ✗ 가 이긴다', () => {
    const r = react('desk', build('desk', [4, 3, 1, 1, 1]));
    expect(r.seoyun).toEqual({ kind: 'unhappy', line: WORSE_LINE.replace('{part}', '책상+의자 일체형'), worse: 'desk-form-4', card: 'C01' });
    expect(r.dohyun!.kind).toBe('happy');
  });
  it('전원 만족 조합 — 책상 F2 A3 B3 M3 K2', () => {
    const r = react('desk', build('desk', [2, 3, 3, 3, 2]));
    expect(Object.values(r).every((x) => x.kind === 'happy')).toBe(true);
    expect(r.seoyun!.line).toBe(line('C01', 'happy').replace('{part}', '수동 높이 조절 레버'));
  });
  it('partial 효과만 → partial (사물함 회전식 원형 → 서윤 C02)', () => {
    const r = react('locker', build('locker', [3, 1, 1, 1, 1]));
    expect(r.seoyun).toEqual({ kind: 'partial', line: line('C02', 'partial'), card: 'C02' });
  });
  it('효과 없음 → unhappy, 문장은 unhappy', () => {
    const r = react('locker', build('locker', [1, 1, 1, 1, 1]));
    expect(r.seoyun).toEqual({ kind: 'unhappy', line: line('C02', 'unhappy'), card: 'C02' });
  });
  it('일부 full → partial, 대표 줄은 손대지 않은 카드의 unhappy 문장 (할머니 문: C15 full, C16 없음)', () => {
    const r = react('door', build('door', [1, 2, 1, 1, 3]));
    expect(r.grandma).toEqual({ kind: 'partial', line: line('C16', 'unhappy'), card: 'C16' });
  });
  it('full 이 partial 보다 우선 (문 B3 C11 partial + K2 C11 full → 지안 happy)', () => {
    expect(react('door', build('door', [1, 1, 3, 1, 2])).jian!.kind).toBe('happy');
  });
});

describe('M1 트리거 — 1차 만족 ≤1 ∨ 연결 카드가 전부 한 NPC 것', () => {
  const links = (cards: (CardId | null)[]) => Object.fromEntries(SLOTS.map((s, i) => [s, cards[i] ?? null])) as Round['links'];
  const two = { seoyun: 'happy', haeun: 'happy', jian: 'partial' } as const;
  const spread = links(['C01', 'C04', null, null, null]); // 서윤·도현
  it('만족 ≤1 이면 연결이 여러 NPC 에 걸쳐도 bus', () => {
    expect(busTrigger({ seoyun: 'happy', dohyun: 'unhappy', jian: 'partial' }, spread)).toBe(true);
    expect(busTrigger({ seoyun: 'unhappy', jian: 'partial' }, spread)).toBe(true);
  });
  it('만족 2 여도 null 아닌 연결이 전부 서윤 카드면 bus', () => {
    expect(busTrigger(two, links(['C01', null, 'C01', null, null]))).toBe(true);
  });
  it('부정례 — 만족 2 ∧ 연결이 두 NPC, 만족 2 ∧ 연결 0개', () => {
    expect(busTrigger(two, spread)).toBe(false);
    expect(busTrigger(two, links([]))).toBe(false);
  });
});

describe('M2 신호 — 색·형태만 바꾸고 satisfied 변동 0', () => {
  const prev = { slots: build('desk', [1, 1, 1, 1, 1]), satisfied: 0 } as Round;
  it('색·형태만 + 변동 0 → true, 기능 바꿈·만족 변동 → false', () => {
    expect(cosmeticOnly(prev, build('desk', [3, 1, 1, 1, 3]), 0)).toBe(true);
    expect(cosmeticOnly(prev, build('desk', [2, 1, 1, 1, 1]), 1)).toBe(false);
    expect(cosmeticOnly(prev, build('desk', [1, 1, 2, 1, 1]), 0)).toBe(false);
  });
});
