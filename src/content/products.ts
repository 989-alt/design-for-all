import type { CardId, ColorFill, Part, PartNo, Product, ProductId, SlotId } from './types';

// PRD §4.2 효과표·부품 이름 그대로. [C..] solves · (C..) partial · ✗C.. worse · ★ tech · ♻ eco
type Fx = { solves?: CardId[]; partial?: CardId[]; worse?: CardId[]; tech?: boolean; eco?: Part['eco'] };

const part = (product: ProductId, slot: SlotId, n: PartNo, name: string, asset: string | ColorFill | null, fx: Fx = {}): Part => ({
  id: `${product}-${slot}-${n}`,
  slot,
  name,
  assetId: typeof asset === 'object' && asset ? null : asset,
  ...(typeof asset === 'object' && asset ? { color: asset } : {}),
  solves: fx.solves ?? [],
  partial: fx.partial ?? [],
  worse: fx.worse ?? [],
  tech: fx.tech ?? false,
  eco: fx.eco ?? 'none',
});

const tile = (name: string): ColorFill => ({ kind: 'tile', assetId: `tile-color-${name}` });
const mat = (name: string) => `tile-material-${name}`;

export const MATERIAL_NOTE = '오래 쓰는 것도 환경을 생각하는 거예요.'; // 오개념 M5 한 줄

export const PRODUCTS: Record<ProductId, Product> = {
  desk: {
    id: 'desk',
    name: '책상',
    icon: 'icon-desk',
    slotNames: { form: '형태', funcA: '높이', funcB: '이동·수납', material: '소재', color: '색' },
    parts: {
      form: [
        part('desk', 'form', 1, '네모 모서리', 'desk-form-1'),
        part('desk', 'form', 2, '모서리 둥글고 고대비 테두리', 'desk-form-2', { solves: ['C09'] }),
        part('desk', 'form', 3, 'ㄷ자 벽면 책상', 'desk-form-3'),
        part('desk', 'form', 4, '책상+의자 일체형', 'desk-form-4', { worse: ['C01'] }),
      ],
      funcA: [
        part('desk', 'funcA', 1, '고정 보통', 'desk-height-1'),
        part('desk', 'funcA', 2, '고정 높게', 'desk-height-2', { solves: ['C04'], worse: ['C14'] }),
        part('desk', 'funcA', 3, '수동 높이 조절 레버', 'desk-height-3', { solves: ['C01', 'C04', 'C14'] }),
        part('desk', 'funcA', 4, '전동 높이 조절', 'desk-height-4', { solves: ['C01', 'C04', 'C14'], tech: true }),
      ],
      funcB: [
        part('desk', 'funcB', 1, '고정 다리', 'desk-move-1'),
        part('desk', 'funcB', 2, '잠금 바퀴', 'desk-move-2', { solves: ['C06'] }),
        part('desk', 'funcB', 3, '옆 가방·지팡이 걸이', 'desk-move-3', { solves: ['C17'] }),
        part('desk', 'funcB', 4, '아래 수납 선반', 'desk-move-4', { worse: ['C01'] }),
      ],
      material: [
        part('desk', 'material', 1, '새 플라스틱', mat('plastic')),
        part('desk', 'material', 2, '재활용 플라스틱', mat('recycled'), { eco: 'full' }),
        part('desk', 'material', 3, '가벼운 알루미늄', mat('aluminum'), { solves: ['C06'], eco: 'half' }),
        part('desk', 'material', 4, '재생 나무', mat('wood'), { eco: 'full' }),
      ],
      color: [
        part('desk', 'color', 1, '벽과 같은 회색', { kind: 'solid', token: 'muted' }),
        part('desk', 'color', 2, '밝은 상판+진한 테두리', { kind: 'solid', token: 'secondary' }, { solves: ['C09'] }),
        part('desk', 'color', 3, '알록달록 패턴', tile('pattern')),
        part('desk', 'color', 4, '나무색', tile('woodgrain')),
      ],
    },
  },
  locker: {
    id: 'locker',
    name: '사물함',
    icon: 'icon-locker',
    slotNames: { form: '형태', funcA: '잠금', funcB: '표시', material: '소재', color: '색' },
    parts: {
      form: [
        part('locker', 'form', 1, '위아래 2단 똑같이', 'locker-form-1'),
        part('locker', 'form', 2, '허리 높이 칸이 많은 섞인 배치', 'locker-form-2', { solves: ['C02', 'C05', 'C13'] }),
        part('locker', 'form', 3, '회전식 원형', 'locker-form-3', { partial: ['C02', 'C13'] }),
        part('locker', 'form', 4, '긴 세로 1칸', 'locker-form-4', { partial: ['C05'] }),
      ],
      funcA: [
        part('locker', 'funcA', 1, '열쇠 자물쇠', 'locker-lock-1'),
        part('locker', 'funcA', 2, '번호 다이얼', 'locker-lock-2', { worse: ['C08'] }),
        part('locker', 'funcA', 3, '큰 고리 손잡이+간단 걸쇠', 'locker-lock-3', { solves: ['C08'] }),
        part('locker', 'funcA', 4, '카드 터치', 'locker-lock-4', { solves: ['C08'], tech: true }),
      ],
      funcB: [
        part('locker', 'funcB', 1, '작은 번호표', 'locker-label-1'),
        part('locker', 'funcB', 2, '큰 번호 고대비', 'locker-label-2', { solves: ['C10'] }),
        part('locker', 'funcB', 3, '큰 번호+볼록 번호', 'locker-label-3', { solves: ['C10'] }),
        part('locker', 'funcB', 4, '그림 이름표', 'locker-label-4', { partial: ['C10'] }),
      ],
      material: [
        part('locker', 'material', 1, '철', mat('steel')),
        part('locker', 'material', 2, '재활용 플라스틱', mat('recycled'), { eco: 'full' }),
        part('locker', 'material', 3, '재생 나무', mat('wood'), { eco: 'full' }),
        part('locker', 'material', 4, '새 플라스틱', mat('plastic')),
      ],
      color: [
        part('locker', 'color', 1, '회색', { kind: 'solid', token: 'muted' }),
        part('locker', 'color', 2, '칸마다 다른 색', tile('multi'), { partial: ['C10'] }),
        part('locker', 'color', 3, '고대비', tile('stripe')),
        part('locker', 'color', 4, '파스텔', tile('pastel')),
      ],
    },
  },
  door: {
    id: 'door',
    name: '교실 문',
    icon: 'icon-door',
    slotNames: { form: '열림', funcA: '손잡이', funcB: '표시', material: '소재', color: '색' },
    parts: {
      form: [
        part('door', 'form', 1, '무거운 여닫이', 'door-form-1'),
        part('door', 'form', 2, '가벼운 경첩 여닫이', 'door-form-2', { solves: ['C03', 'C12'] }),
        part('door', 'form', 3, '미닫이', 'door-form-3', { solves: ['C03', 'C12'], partial: ['C07', 'C15'] }),
        part('door', 'form', 4, '자동문 센서', 'door-form-4', { solves: ['C03', 'C12', 'C07', 'C15'], tech: true }),
      ],
      funcA: [
        part('door', 'funcA', 1, '둥근 손잡이', 'door-handle-1'),
        part('door', 'funcA', 2, '레버 손잡이', 'door-handle-2', { solves: ['C07', 'C15'] }),
        part('door', 'funcA', 3, '세로 긴 막대 손잡이', 'door-handle-3', { solves: ['C07', 'C15'], partial: ['C03', 'C12'] }),
        part('door', 'funcA', 4, '열림 버튼', 'door-handle-4', { solves: ['C07', 'C15'], tech: true }),
      ],
      funcB: [
        part('door', 'funcB', 1, '없음', null),
        part('door', 'funcB', 2, '큰 글씨 교실 이름', 'door-label-2', { solves: ['C16'] }),
        part('door', 'funcB', 3, '큰 글씨+점자+그림', 'door-label-3', { solves: ['C16'], partial: ['C11'] }),
        part('door', 'funcB', 4, '고대비 색띠 테두리', 'door-label-4', { solves: ['C11'] }),
      ],
      material: [
        part('door', 'material', 1, '철', mat('steel')),
        part('door', 'material', 2, '재활용 플라스틱', mat('recycled'), { eco: 'full' }),
        part('door', 'material', 3, '재생 나무', mat('wood'), { eco: 'full' }),
        part('door', 'material', 4, '새 플라스틱', mat('plastic')),
      ],
      color: [
        part('door', 'color', 1, '벽과 같은 색', { kind: 'solid', token: 'surface-classroom' }, { worse: ['C11'] }),
        part('door', 'color', 2, '벽과 다른 뚜렷한 색', { kind: 'solid', token: 'primary' }, { solves: ['C11'] }),
        part('door', 'color', 3, '패턴', tile('pattern')),
        part('door', 'color', 4, '나무색', tile('woodgrain')),
      ],
    },
  },
};
