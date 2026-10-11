import type { PartId, PartNo, ProductId } from '../content/types';

// 미리보기 합성 영역(정사각, 0~1) 위 기능 부품 자리. x,y = 중심, s = 부품을 contain 으로 넣는 정사각 상자 한 변.
// 형태 그림도 같은 영역에 contain 으로 놓인다. 부품 그림이 형태 그림 바깥으로 나가지 않는지는 previewLayout.test.ts 가 잰다
export type Anchor = { x: number; y: number; s: number };

export const ANCHORS: Record<ProductId, Record<PartNo, { funcA: Anchor; funcB: Anchor }>> = {
  // 기능A = 레버 판이 오른쪽 다리에, 기능B = 발 네 개 줄이 다리 밑에
  desk: {
    1: { funcA: { x: 0.83, y: 0.6, s: 0.2 }, funcB: { x: 0.5, y: 0.735, s: 0.9 } },
    2: { funcA: { x: 0.83, y: 0.6, s: 0.2 }, funcB: { x: 0.5, y: 0.745, s: 0.9 } },
    3: { funcA: { x: 0.83, y: 0.65, s: 0.2 }, funcB: { x: 0.5, y: 0.78, s: 0.9 } },
    4: { funcA: { x: 0.8, y: 0.62, s: 0.2 }, funcB: { x: 0.5, y: 0.87, s: 0.9 } },
  },
  // 잠금 = 손잡이 쪽(경첩 반대) 문 하나 위
  locker: {
    1: { funcA: { x: 0.42, y: 0.33, s: 0.16 }, funcB: { x: 0.5, y: 0.2, s: 0.2 } },
    2: { funcA: { x: 0.42, y: 0.47, s: 0.16 }, funcB: { x: 0.5, y: 0.13, s: 0.2 } },
    3: { funcA: { x: 0.42, y: 0.55, s: 0.16 }, funcB: { x: 0.5, y: 0.3, s: 0.2 } },
    4: { funcA: { x: 0.5, y: 0.46, s: 0.16 }, funcB: { x: 0.5, y: 0.2, s: 0.2 } },
  },
  // 손잡이 = 형태 그림의 손잡이 위(자동문은 왼문 안쪽 끝)
  door: {
    1: { funcA: { x: 0.32, y: 0.55, s: 0.16 }, funcB: { x: 0.5, y: 0.18, s: 0.3 } },
    2: { funcA: { x: 0.39, y: 0.57, s: 0.16 }, funcB: { x: 0.5, y: 0.18, s: 0.3 } },
    3: { funcA: { x: 0.47, y: 0.55, s: 0.14 }, funcB: { x: 0.5, y: 0.3, s: 0.24 } },
    4: { funcA: { x: 0.3, y: 0.55, s: 0.14 }, funcB: { x: 0.5, y: 0.3, s: 0.24 } },
  },
};

// 부품 모양이 기본 자리와 맞지 않을 때. `부품@형태` 가 `부품` 보다, `부품` 이 기본보다 앞선다
export const PART_ANCHOR: Partial<Record<PartId | `${PartId}@${PartNo}`, Anchor>> = {
  // 다리 받침 = 오른쪽 다리 위(발 줄과 안 겹치게)
  'desk-funcA-1': { x: 0.885, y: 0.58, s: 0.12 },
  'desk-funcA-2': { x: 0.885, y: 0.58, s: 0.12 },
  'desk-funcA-1@4': { x: 0.89, y: 0.68, s: 0.12 },
  'desk-funcA-2@4': { x: 0.89, y: 0.68, s: 0.12 },
  // 바퀴 줄은 발보다 키가 커서 위로
  'desk-funcB-2@1': { x: 0.5, y: 0.67, s: 0.9 },
  'desk-funcB-2@2': { x: 0.5, y: 0.68, s: 0.9 },
  'desk-funcB-2@3': { x: 0.5, y: 0.72, s: 0.9 },
  'desk-funcB-2@4': { x: 0.5, y: 0.8, s: 0.9 },
  'desk-funcB-3': { x: 0.1, y: 0.42, s: 0.16 },
  'desk-funcB-4': { x: 0.5, y: 0.42, s: 0.6 },
  'door-funcB-4': { x: 0.5, y: 0.5, s: 0.9 }, // 색띠 틀. 0.95 는 좁은 문(폭 0.9)을 넘는다
};

export const anchorOf = (product: ProductId, form: PartNo, slot: 'funcA' | 'funcB', part: PartId) =>
  PART_ANCHOR[`${part}@${form}`] ?? PART_ANCHOR[part] ?? ANCHORS[product][form][slot];
