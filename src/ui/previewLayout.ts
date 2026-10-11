import type { PartNo, ProductId } from '../content/types';

// 미리보기 합성 영역(정사각, 0~1) 위 기능 부품 자리. x,y = 중심, s = 부품을 contain 으로 넣는 정사각 상자 한 변.
// 형태 그림도 같은 영역에 contain 으로 놓인다. 상자가 형태 그림 바깥으로 나가지 않는지는 previewLayout.test.ts 가 잰다
export type Anchor = { x: number; y: number; s: number };

export const ANCHORS: Record<ProductId, Record<PartNo, { funcA: Anchor; funcB: Anchor }>> = {
  desk: {
    1: { funcA: { x: 0.78, y: 0.6, s: 0.2 }, funcB: { x: 0.5, y: 0.72, s: 0.24 } },
    2: { funcA: { x: 0.78, y: 0.6, s: 0.2 }, funcB: { x: 0.5, y: 0.72, s: 0.24 } },
    3: { funcA: { x: 0.78, y: 0.65, s: 0.2 }, funcB: { x: 0.5, y: 0.76, s: 0.24 } },
    4: { funcA: { x: 0.8, y: 0.62, s: 0.2 }, funcB: { x: 0.5, y: 0.82, s: 0.24 } },
  },
  locker: {
    1: { funcA: { x: 0.6, y: 0.4, s: 0.14 }, funcB: { x: 0.5, y: 0.2, s: 0.2 } },
    2: { funcA: { x: 0.6, y: 0.45, s: 0.14 }, funcB: { x: 0.5, y: 0.13, s: 0.2 } },
    3: { funcA: { x: 0.5, y: 0.55, s: 0.16 }, funcB: { x: 0.5, y: 0.3, s: 0.2 } },
    4: { funcA: { x: 0.62, y: 0.5, s: 0.14 }, funcB: { x: 0.5, y: 0.2, s: 0.2 } },
  },
  door: {
    1: { funcA: { x: 0.32, y: 0.55, s: 0.16 }, funcB: { x: 0.5, y: 0.18, s: 0.3 } },
    2: { funcA: { x: 0.38, y: 0.55, s: 0.16 }, funcB: { x: 0.5, y: 0.18, s: 0.3 } },
    3: { funcA: { x: 0.3, y: 0.6, s: 0.14 }, funcB: { x: 0.5, y: 0.3, s: 0.24 } },
    4: { funcA: { x: 0.5, y: 0.55, s: 0.14 }, funcB: { x: 0.5, y: 0.3, s: 0.24 } },
  },
};
