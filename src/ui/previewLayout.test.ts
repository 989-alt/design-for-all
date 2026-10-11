import { describe, expect, it } from 'vitest';
import type { PartNo, ProductId } from '../content/types';
import { ANCHORS } from './previewLayout';

// 형태 그림 12장을 data URL 로 받아 PNG 머리(IHDR)에서 원본 크기를 읽는다
const PNGS = import.meta.glob<string>('../../assets/img/kit/*-form-*.png', { query: '?inline', import: 'default', eager: true });
function size(id: string) {
  const b = atob(PNGS[`../../assets/img/kit/${id}.png`].split(',')[1]);
  const u32 = (o: number) => ((b.charCodeAt(o) << 24) | (b.charCodeAt(o + 1) << 16) | (b.charCodeAt(o + 2) << 8) | b.charCodeAt(o + 3)) >>> 0;
  return { w: u32(16), h: u32(20) };
}

// 정사각 영역(1×1)에 contain 으로 놓인 형태 그림의 사각형
function formRect(id: string) {
  const { w, h } = size(id);
  const k = Math.min(1 / w, 1 / h);
  const [fw, fh] = [w * k, h * k];
  return { l: (1 - fw) / 2, t: (1 - fh) / 2, r: (1 + fw) / 2, b: (1 + fh) / 2 };
}

const PRODUCTS: ProductId[] = ['desk', 'locker', 'door'];
const FORMS: PartNo[] = [1, 2, 3, 4];

describe('미리보기 앵커', () => {
  it('3제품 × 4형태 × 2슬롯 = 24 앵커가 모두 있고 0~1 안', () => {
    let n = 0;
    for (const p of PRODUCTS)
      for (const f of FORMS)
        for (const a of [ANCHORS[p][f].funcA, ANCHORS[p][f].funcB]) {
          for (const v of [a.x, a.y, a.s]) expect(v).toBeGreaterThan(0), expect(v).toBeLessThan(1);
          n++;
        }
    expect(n).toBe(24);
  });

  it('부품 상자가 형태 그림 사각형 안에 있다', () => {
    for (const p of PRODUCTS)
      for (const f of FORMS) {
        const r = formRect(`${p}-form-${f}`);
        for (const [slot, a] of Object.entries(ANCHORS[p][f])) {
          const box = { l: a.x - a.s / 2, t: a.y - a.s / 2, r: a.x + a.s / 2, b: a.y + a.s / 2 };
          const at = `${p}-form-${f} ${slot}`;
          expect(box.l, at).toBeGreaterThanOrEqual(r.l);
          expect(box.t, at).toBeGreaterThanOrEqual(r.t);
          expect(box.r, at).toBeLessThanOrEqual(r.r);
          expect(box.b, at).toBeLessThanOrEqual(r.b);
        }
      }
  });
});
