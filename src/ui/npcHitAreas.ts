import type { NpcId } from '../content/types';

export const CLASSROOM_ART = './assets/scene/classroom-npcs.png';

// 1280×800 무대 좌표, 그림 object-fit:cover · object-position:50% 20% 기준. 배열 순서(왼→오) = Tab 순서
export const NPC_HIT_AREAS: { id: NpcId; x: number; y: number; w: number; h: number }[] = [
  { id: 'seoyun', x: 40, y: 250, w: 228, h: 340 },
  { id: 'dohyun', x: 272, y: 100, w: 190, h: 490 },
  { id: 'hajun', x: 466, y: 120, w: 176, h: 470 },
  { id: 'jian', x: 650, y: 170, w: 164, h: 420 },
  { id: 'haeun', x: 822, y: 290, w: 166, h: 300 },
  { id: 'grandma', x: 1040, y: 196, w: 200, h: 394 },
];
