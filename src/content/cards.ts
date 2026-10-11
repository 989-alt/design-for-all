import type { TroubleCard } from './types';

// PRD §4.1. what 은 PRD 문장 그대로. 반응은 카드별 만족·부분·불만, {part} = 부품 이름
export const CARDS: TroubleCard[] = [
  {
    id: 'C01', npc: 'seoyun', product: 'desk', where: '교실 책상', what: '책상 밑에 휠체어가 안 들어가',
    reactions: {
      happy: '{part} 덕분에 휠체어가 책상 밑에 쏙 들어가요!',
      partial: '조금 나아졌지만 아직 무릎이 책상에 닿아요.',
      unhappy: '책상 밑에 휠체어가 아직 안 들어가요.',
    },
  },
  {
    id: 'C02', npc: 'seoyun', product: 'locker', where: '복도 사물함', what: '위 칸은 손이 안 닿아',
    reactions: {
      happy: '{part} 덕분에 내 칸에 손이 닿아요!',
      partial: '손이 조금 닿지만 아직 팔을 쭉 뻗어야 해요.',
      unhappy: '위 칸은 휠체어에서 아직 손이 안 닿아요.',
    },
  },
  {
    id: 'C03', npc: 'seoyun', product: 'door', where: '교실 문', what: '문이 무거워 혼자 열기 힘들어',
    reactions: {
      happy: '{part} 덕분에 혼자서도 문을 열어요!',
      partial: '조금 가벼워졌지만 혼자 열기는 아직 힘들어요.',
      unhappy: '문이 무거워서 혼자 열기가 아직 힘들어요.',
    },
  },
  {
    id: 'C04', npc: 'dohyun', product: 'desk', where: '교실 책상', what: '책상이 낮아 무릎이 부딪혀',
    reactions: {
      happy: '{part} 덕분에 무릎이 안 부딪혀요!',
      partial: '조금 나아졌지만 아직 무릎이 닿아요.',
      unhappy: '책상이 낮아서 아직 무릎이 부딪혀요.',
    },
  },
  {
    id: 'C05', npc: 'dohyun', product: 'locker', where: '복도 사물함', what: '아래 칸은 허리를 많이 숙여야 해',
    reactions: {
      happy: '{part} 덕분에 허리를 안 숙여도 돼요!',
      partial: '조금 덜 숙여도 되지만 아직 허리가 아파요.',
      unhappy: '아래 칸이라 아직 허리를 많이 숙여야 해요.',
    },
  },
  {
    id: 'C06', npc: 'hajun', product: 'desk', where: '교실 책상', what: '책상을 옮기기 힘들어',
    reactions: {
      happy: '{part} 덕분에 한 손으로도 책상을 옮겨요!',
      partial: '조금 가벼워졌지만 한 손으로는 아직 힘들어요.',
      unhappy: '깁스한 팔로는 책상 옮기기가 아직 힘들어요.',
    },
  },
  {
    id: 'C07', npc: 'hajun', product: 'door', where: '교실 문', what: '둥근 손잡이를 돌리기 힘들어',
    reactions: {
      happy: '{part} 덕분에 깁스한 팔로도 문을 열어요!',
      partial: '조금 쉬워졌지만 아직 손목을 돌려야 해요.',
      unhappy: '둥근 손잡이는 아직 돌리기 힘들어요.',
    },
  },
  {
    id: 'C08', npc: 'hajun', product: 'locker', where: '복도 사물함', what: '자물쇠 열기가 힘들어',
    reactions: {
      happy: '{part} 덕분에 한 손으로 쉽게 열어요!',
      partial: '조금 쉬워졌지만 아직 두 손이 필요해요.',
      unhappy: '한 손으로는 잠금을 열기가 아직 힘들어요.',
    },
  },
  {
    id: 'C09', npc: 'jian', product: 'desk', where: '교실 책상', what: '책상 모서리가 어디인지 잘 안 보여',
    reactions: {
      happy: '{part} 덕분에 책상 모서리가 잘 보여요!',
      partial: '모서리가 조금 보이지만 아직 헷갈려요.',
      unhappy: '책상 모서리가 어디인지 아직 잘 안 보여요.',
    },
  },
  {
    id: 'C10', npc: 'jian', product: 'locker', where: '복도 사물함', what: '번호가 작아 내 칸을 못 찾아',
    reactions: {
      happy: '{part} 덕분에 내 칸을 바로 찾아요!',
      partial: '가까이 가면 보이지만 아직 한참 찾아요.',
      unhappy: '번호가 작아서 내 칸을 아직 못 찾겠어요.',
    },
  },
  {
    id: 'C11', npc: 'jian', product: 'door', where: '교실 문', what: '문이 벽이랑 색이 같아 잘 안 보여',
    reactions: {
      happy: '{part} 덕분에 문이 어디인지 잘 보여요!',
      partial: '문이 조금 보이지만 아직 벽이랑 헷갈려요.',
      unhappy: '문이 벽이랑 비슷해서 아직 잘 안 보여요.',
    },
  },
  {
    id: 'C12', npc: 'haeun', product: 'door', where: '교실 문', what: '문이 무거워서 못 열어',
    reactions: {
      happy: '{part} 덕분에 나도 문을 열 수 있어요!',
      partial: '힘껏 밀면 열리지만 아직 무거워요.',
      unhappy: '문이 무거워서 아직 못 열겠어요.',
    },
  },
  {
    id: 'C13', npc: 'haeun', product: 'locker', where: '복도 사물함', what: '위 칸에 손이 안 닿아',
    reactions: {
      happy: '{part} 덕분에 키가 작아도 손이 닿아요!',
      partial: '까치발을 하면 닿지만 아직 힘들어요.',
      unhappy: '위 칸은 아직 손이 안 닿아요.',
    },
  },
  {
    id: 'C14', npc: 'haeun', product: 'desk', where: '교실 책상', what: '책상이 높아 발이 안 닿아',
    reactions: {
      happy: '{part} 덕분에 발이 바닥에 닿아요!',
      partial: '조금 낮아졌지만 아직 발이 붕 떠요.',
      unhappy: '책상이 높아서 아직 발이 안 닿아요.',
    },
  },
  {
    id: 'C15', npc: 'grandma', product: 'door', where: '교실 문', what: '손잡이 돌리면 손목이 아파',
    reactions: {
      happy: '{part} 덕분에 손목이 안 아프구나.',
      partial: '조금 낫지만 아직 손목이 시큰하구나.',
      unhappy: '손잡이를 돌리면 아직 손목이 아프구나.',
    },
  },
  {
    id: 'C16', npc: 'grandma', product: 'door', where: '교실 문', what: '글씨가 작아 교실 이름을 못 읽어',
    reactions: {
      happy: '{part} 덕분에 교실 이름이 잘 보이는구나.',
      partial: '가까이 가면 읽히지만 아직 글씨가 작구나.',
      unhappy: '글씨가 작아서 교실 이름을 아직 못 읽겠구나.',
    },
  },
  {
    id: 'C17', npc: 'grandma', product: 'desk', where: '교실 책상', what: '가방·지팡이 둘 곳이 없어',
    reactions: {
      happy: '{part} 덕분에 가방이랑 지팡이를 걸었구나.',
      partial: '가방은 놓았는데 지팡이 둘 곳이 아직 없구나.',
      unhappy: '가방이랑 지팡이 둘 곳이 아직 없구나.',
    },
  },
];

// ✗ 부품이 그 카드를 더 나쁘게 했을 때 (PRD §4.3 "이유에 그 부품을 지목")
export const WORSE_LINE = '{part} 때문에 더 불편해졌어요.';
