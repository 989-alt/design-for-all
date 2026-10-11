import { describe, expect, it } from 'vitest';
import { CARDS, WORSE_LINE } from './cards';
import { CASES } from './cases';
import { ELEMENTS } from './elements';
import { COSMETIC_PREFIX, FEEDBACK } from './feedback';
import { HARMONY } from './harmony';
import { NPCS } from './npcs';
import { MATERIAL_NOTE, PRODUCTS } from './products';
import { REFERENCES, REF_KINDS } from './references';
import { SAMPLES } from './samples';
import type { CardId, Part, PartNo, ProductId, SlotId } from './types';

const PRODUCT_IDS: ProductId[] = ['desk', 'locker', 'door'];
const SLOTS: SlotId[] = ['form', 'funcA', 'funcB', 'material', 'color'];
const NOS: PartNo[] = [1, 2, 3, 4];
const ALL_PARTS = PRODUCT_IDS.flatMap((p) => SLOTS.flatMap((s) => PRODUCTS[p].parts[s]));

// 실제 kit 폴더의 파일 목록(vite 가 빌드 때 파일시스템을 읽는다)
const KIT = new Set(
  Object.keys(import.meta.glob('../../assets/img/kit/*.png')).map((k) => k.split('/').pop()!.replace('.png', '')),
);

describe('효과표', () => {
  it('제품 3 × 슬롯 5 × 부품 4 = 60, 모든 필드 존재', () => {
    expect(ALL_PARTS).toHaveLength(60);
    for (const p of ALL_PARTS) {
      expect(Array.isArray(p.solves) && Array.isArray(p.partial) && Array.isArray(p.worse)).toBe(true);
      expect(typeof p.tech).toBe('boolean');
      expect(['full', 'half', 'none']).toContain(p.eco);
    }
    for (const prod of PRODUCT_IDS)
      for (const s of SLOTS)
        PRODUCTS[prod].parts[s].forEach((p, i) => {
          expect(p.id).toBe(`${prod}-${s}-${i + 1}`);
          expect(p.slot).toBe(s);
        });
  });

  it('부품이 가리키는 카드는 그 제품의 카드뿐', () => {
    for (const prod of PRODUCT_IDS) {
      const own = new Set(CARDS.filter((c) => c.product === prod).map((c) => c.id));
      for (const s of SLOTS)
        for (const p of PRODUCTS[prod].parts[s]) for (const c of [...p.solves, ...p.partial, ...p.worse]) expect(own.has(c)).toBe(true);
    }
  });

  it('달성 가능성 — 1024 조합 중 해당 NPC 전원 만족이 있다', () => {
    const want = { desk: 6, locker: 5, door: 5 };
    for (const prod of PRODUCT_IDS) {
      const cards = CARDS.filter((c) => c.product === prod);
      const npcs = [...new Set(cards.map((c) => c.npc))];
      expect(npcs).toHaveLength(want[prod]);
      let best = 0;
      for (let i = 0; i < 1024; i++) {
        const chosen: Part[] = SLOTS.map((s, k) => PRODUCTS[prod].parts[s][(i >> (2 * k)) & 3]);
        const full = new Set(chosen.flatMap((p) => p.solves));
        const worse = new Set(chosen.flatMap((p) => p.worse));
        const happy = npcs.filter((n) => cards.filter((c) => c.npc === n).every((c) => full.has(c.id) && !worse.has(c.id)));
        best = Math.max(best, happy.length);
      }
      expect(best, prod).toBe(want[prod]);
    }
  });

  it('무작위 기대 만족 — 2,000판 평균이 NPC 수의 절반 이하 (PRD §4.7)', () => {
    // mulberry32: 시드 고정 난수
    let seed = 20261011;
    const rand = () => {
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    for (const prod of PRODUCT_IDS) {
      const cards = CARDS.filter((c) => c.product === prod);
      const npcs = [...new Set(cards.map((c) => c.npc))];
      let sum = 0;
      for (let g = 0; g < 2000; g++) {
        const chosen: Part[] = SLOTS.map((s) => PRODUCTS[prod].parts[s][Math.floor(rand() * 4)]);
        const full = new Set(chosen.flatMap((p) => p.solves));
        const worse = new Set(chosen.flatMap((p) => p.worse));
        sum += npcs.filter((n) => cards.filter((c) => c.npc === n).every((c) => full.has(c.id) && !worse.has(c.id))).length;
      }
      const avg = sum / 2000;
      console.log(`기대 만족 ${prod}: ${avg.toFixed(3)} / ${npcs.length}`);
      expect(avg, prod).toBeLessThanOrEqual(npcs.length / 2);
    }
  });

  it('저상 버스 구조 — C02·C13, C03·C12, C07·C15 는 같은 부품이 푼다', () => {
    const pairs: [CardId, CardId][] = [['C02', 'C13'], ['C03', 'C12'], ['C07', 'C15']];
    for (const [a, b] of pairs) {
      expect(ALL_PARTS.some((p) => p.solves.includes(a))).toBe(true);
      for (const p of ALL_PARTS) {
        expect(p.solves.includes(a), `${p.id} ${a}/${b}`).toBe(p.solves.includes(b));
        expect(p.partial.includes(a), `${p.id} ${a}/${b}`).toBe(p.partial.includes(b));
        expect(p.worse.includes(a), `${p.id} ${a}/${b}`).toBe(p.worse.includes(b));
      }
    }
  });

  it('부딪힘 — C04·C14 를 함께 푸는 부품은 높이 조절 2개뿐', () => {
    const both = ALL_PARTS.filter((p) => p.solves.includes('C04') && p.solves.includes('C14')).map((p) => p.id);
    expect(both.sort()).toEqual(['desk-funcA-3', 'desk-funcA-4']);
  });
});

describe('조화표', () => {
  it('제품별 64 조합 전부 0|50|100', () => {
    for (const prod of PRODUCT_IDS) {
      const keys = Object.keys(HARMONY[prod]);
      expect(keys).toHaveLength(64);
      for (const f of NOS) for (const c of NOS) for (const m of NOS) expect([0, 50, 100]).toContain(HARMONY[prod][`${f}${c}${m}`]);
    }
  });
});

describe('카드', () => {
  it('NPC 6, 불편 카드 17', () => {
    expect(NPCS.map((n) => n.id)).toEqual(['seoyun', 'dohyun', 'hajun', 'jian', 'haeun', 'grandma']);
    expect(CARDS.map((c) => c.id)).toEqual(Array.from({ length: 17 }, (_, i) => `C${String(i + 1).padStart(2, '0')}`));
  });

  it('참고 카드 12 — 갈래별 3장, usableFor 1개 이상', () => {
    expect(REFERENCES.map((r) => r.id)).toEqual(Array.from({ length: 12 }, (_, i) => `ref-${String(i + 1).padStart(2, '0')}`));
    for (const k of Object.keys(REF_KINDS)) expect(REFERENCES.filter((r) => r.kind === k)).toHaveLength(3);
    const ids = new Set(CARDS.map((c) => c.id));
    for (const r of REFERENCES) {
      expect(r.usableFor.length).toBeGreaterThan(0);
      for (const c of r.usableFor) expect(ids.has(c)).toBe(true);
    }
  });

  it('사례 카드 7 — 저상 버스 포함, 중점 1 + 보조 0~2, 뒷면 40자 이상', () => {
    expect(CASES.map((c) => c.id)).toEqual(['case-01', 'case-02', 'case-03', 'case-04', 'case-05', 'case-06', 'case-07']);
    expect(CASES.some((c) => c.title.includes('버스'))).toBe(true);
    const els = ELEMENTS.map((e) => e.id);
    for (const c of CASES) {
      expect(els).toContain(c.main);
      expect(c.sub.length).toBeLessThanOrEqual(2);
      expect(c.sub).not.toContain(c.main);
      for (const s of c.sub) expect(els).toContain(s);
      expect(c.back.length).toBeGreaterThanOrEqual(40);
    }
    expect(CASES.filter((c) => c.bus).map((c) => c.id)).toEqual(['case-07']);
  });

  it('샘플 2, 피드백 2, 요소 6', () => {
    expect(SAMPLES.map((s) => s.id)).toEqual(['sample-01', 'sample-02']);
    expect(FEEDBACK.map((f) => f.id)).toEqual(['fb-bus', 'fb-tech']);
    expect(ELEMENTS.map((e) => e.id)).toEqual(['purpose', 'tech', 'function', 'beauty', 'access', 'eco']);
  });

  it('샘플 칭찬 — 요소 6줄, 까닭 조각(~서/~니까, 30자 이하)', () => {
    for (const s of SAMPLES) {
      expect(Object.keys(s.praise)).toEqual(ELEMENTS.map((e) => e.id));
      for (const l of Object.values(s.praise)) {
        expect(l, l).toMatch(/(서|니까)$/); // 아서·어서·해서·와서
        expect(l.length, l).toBeLessThanOrEqual(30);
      }
    }
  });
});

describe('문장', () => {
  const lines = [
    ...CARDS.flatMap((c) => [c.where, c.what, ...Object.values(c.reactions)]),
    WORSE_LINE,
    MATERIAL_NOTE,
    ...CARDS.map((c) => COSMETIC_PREFIX + c.reactions.unhappy),
    ...CASES.flatMap((c) => [c.title, ...c.back.split('. ')]),
    ...REFERENCES.flatMap((r) => [r.title, r.desc]),
    ...SAMPLES.flatMap((s) => [s.title, s.desc, ...Object.values(s.praise)]),
    ...FEEDBACK.flatMap((f) => [f.title, ...f.lines]),
    ...ELEMENTS.flatMap((e) => [e.name, e.desc]),
    ...ALL_PARTS.map((p) => p.name),
  ];

  it('전부 60자 이하, "실패"·"틀렸다" 없음', () => {
    for (const l of lines) {
      expect(l.length, l).toBeLessThanOrEqual(60);
      expect(l).not.toMatch(/실패|틀렸다/);
    }
  });

  it('만족·✗ 문장에 {part} 자리', () => {
    for (const c of CARDS) expect(c.reactions.happy).toContain('{part}');
    expect(WORSE_LINE).toContain('{part}');
  });
  // 고유명사 금지는 계약 verification grep 이 맡는다(여기 적으면 grep 에 걸림)
});

describe('에셋 id', () => {
  it('kit 폴더에 실제 파일이 있다 (door-label B1 은 null)', () => {
    expect(KIT.size).toBeGreaterThan(100);
    const ids: string[] = [
      ...NPCS.flatMap((n) => Object.values(n.portrait)),
      ...PRODUCT_IDS.map((p) => PRODUCTS[p].icon),
      ...CASES.map((c) => c.assetId),
      ...REFERENCES.map((r) => r.assetId),
      ...SAMPLES.map((s) => s.assetId),
      ...FEEDBACK.map((f) => f.assetId),
      ...ELEMENTS.map((e) => e.icon),
    ];
    for (const p of ALL_PARTS) {
      if (p.slot === 'color') {
        expect(p.assetId).toBeNull();
        expect(p.color).toBeDefined();
        if (p.color!.kind === 'tile') ids.push(p.color!.assetId);
      } else if (p.id === 'door-funcB-1') expect(p.assetId).toBeNull();
      else ids.push(p.assetId!);
    }
    for (const id of ids) expect(KIT.has(id), id).toBe(true);
  });

  it('색 슬롯 — 단색은 토큰 이름, 무늬는 tile-color', () => {
    const tokens = ['muted', 'secondary', 'primary', 'surface-classroom'];
    for (const p of ALL_PARTS.filter((p) => p.slot === 'color')) {
      const c = p.color!;
      if (c.kind === 'solid') expect(tokens).toContain(c.token);
      else expect(c.assetId).toMatch(/^tile-color-/);
    }
    expect(ALL_PARTS.filter((p) => p.color && p.slot !== 'color')).toHaveLength(0);
  });
});
