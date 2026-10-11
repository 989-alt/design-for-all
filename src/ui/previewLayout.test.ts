import { describe, expect, it } from 'vitest';
import { PRODUCTS } from '../content/products';
import type { PartNo, ProductId } from '../content/types';
import { anchorOf, ANCHORS, PART_ANCHOR, type Anchor } from './previewLayout';

// 형태·부품 그림을 data URL 로 받아 PNG 머리(IHDR)에서 원본 크기를 읽는다
const PNGS = import.meta.glob<string>('../../assets/img/kit/{desk,locker,door}-*.png', { query: '?inline', import: 'default', eager: true });
function size(id: string) {
  const b = atob(PNGS[`../../assets/img/kit/${id}.png`].split(',')[1]);
  const u32 = (o: number) => ((b.charCodeAt(o) << 24) | (b.charCodeAt(o + 1) << 16) | (b.charCodeAt(o + 2) << 8) | b.charCodeAt(o + 3)) >>> 0;
  return { w: u32(16), h: u32(20) };
}

// 정사각 상자(a)에 contain 으로 놓인 그림의 사각형. 형태는 영역 전체(1×1) 상자
function rect(id: string, a: Anchor = { x: 0.5, y: 0.5, s: 1 }) {
  const { w, h } = size(id);
  const k = a.s / Math.max(w, h);
  return { l: a.x - (w * k) / 2, t: a.y - (h * k) / 2, r: a.x + (w * k) / 2, b: a.y + (h * k) / 2 };
}

const IDS: ProductId[] = ['desk', 'locker', 'door'];
const FORMS: PartNo[] = [1, 2, 3, 4];

describe('미리보기 앵커', () => {
  it('3제품 × 4형태 × 2슬롯 = 24 기본 앵커, 기본·부품별 모두 0~1 안', () => {
    const base = IDS.flatMap((p) => FORMS.flatMap((f) => [ANCHORS[p][f].funcA, ANCHORS[p][f].funcB]));
    expect(base).toHaveLength(24);
    for (const a of [...base, ...Object.values(PART_ANCHOR)]) for (const v of [a!.x, a!.y, a!.s]) expect(v).toBeGreaterThan(0), expect(v).toBeLessThan(1);
  });

  it('부품별 오버라이드 키는 실제 기능 부품', () => {
    const ids = IDS.flatMap((p) => [...PRODUCTS[p].parts.funcA, ...PRODUCTS[p].parts.funcB].map((x) => x.id as string));
    for (const k of Object.keys(PART_ANCHOR)) expect(ids, k).toContain(k.split('@')[0]);
  });

  it('모든 형태 × 기능 부품: 부품 그림 사각형이 형태 그림 사각형 안', () => {
    let n = 0;
    for (const p of IDS)
      for (const f of FORMS) {
        const fr = rect(`${p}-form-${f}`);
        for (const slot of ['funcA', 'funcB'] as const)
          for (const part of PRODUCTS[p].parts[slot]) {
            if (!part.assetId) continue;
            const r = rect(part.assetId, anchorOf(p, f, slot, part.id));
            const at = `${p}-form-${f} ${part.id}`;
            expect(r.l, at).toBeGreaterThanOrEqual(fr.l);
            expect(r.t, at).toBeGreaterThanOrEqual(fr.t);
            expect(r.r, at).toBeLessThanOrEqual(fr.r);
            expect(r.b, at).toBeLessThanOrEqual(fr.b);
            n++;
          }
      }
    expect(n).toBe(3 * 4 * 8 - 4); // 문 표시 '없음' 은 그림 없음
  });
});
