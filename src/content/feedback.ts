import type { Feedback } from './types';

// PRD §6 오개념 피드백: M1 저상 버스, M3 첨단 연결
export const FEEDBACK: Feedback[] = [
  {
    id: 'fb-bus', title: '계단을 없앤 낮은 버스', assetId: 'fb-bus',
    lines: [
      '계단을 없앤 버스는 휠체어를 탄 사람도, 무릎 아픈 어르신도 모두 편해요.',
      '서윤이만 편한가요, 하은이도 편한가요?',
    ],
  },
  {
    id: 'fb-tech', title: '이건 누구를 위한 기술일까요?', assetId: 'fb-tech',
    lines: [
      '이건 누구의 어떤 불편을 푸나요?',
      '새 기술은 누군가의 불편을 풀 때 쓸모가 있어요.',
      '부품과 불편 카드를 다시 이어 보세요.',
    ],
  },
];
