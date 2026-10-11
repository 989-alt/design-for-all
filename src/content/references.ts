import type { RefCard, RefKind } from './types';

// 교과분석 ⑮ 조사 4갈래 × 3. usableFor = 이 카드를 연결해도 맞는 불편 카드
export const REF_KINDS: Record<RefKind, string> = {
  popular: '최근 인기 디자인',
  original: '독창적인 가구',
  mobility: '이동이 편리한 제품',
  tech: '첨단 기술',
};

export const REFERENCES: RefCard[] = [
  { id: 'ref-01', kind: 'popular', title: '의자 일체형 책상', desc: '책상과 의자가 붙어 있어 한 번에 옮겨요.', usableFor: ['C06'], assetId: 'ref-01' },
  { id: 'ref-02', kind: 'popular', title: '오래 앉아도 안 피로한 의자', desc: '높이를 맞추고 발 받침이 있어 몸이 편해요.', usableFor: ['C04', 'C14'], assetId: 'ref-02' },
  { id: 'ref-03', kind: 'popular', title: '접이식 벽 선반', desc: '벽에 붙은 선반을 펴서 물건을 올려 둬요.', usableFor: ['C17'], assetId: 'ref-03' },
  { id: 'ref-04', kind: 'original', title: '쿠션 두 개를 붙인 의자', desc: '닿는 곳이 푹신해서 손과 몸이 덜 아파요.', usableFor: ['C15'], assetId: 'ref-04' },
  { id: 'ref-05', kind: 'original', title: '퍼즐 책상', desc: '조각을 떼거나 붙여서 모양을 바꿔 써요.', usableFor: ['C01', 'C17'], assetId: 'ref-05' },
  { id: 'ref-06', kind: 'original', title: '거꾸로 매단 수납 그물', desc: '책상 아래에 그물을 매달아 가방을 넣어요.', usableFor: ['C17'], assetId: 'ref-06' },
  { id: 'ref-07', kind: 'mobility', title: '바퀴 달린 책상', desc: '다리에 바퀴가 있어 밀기만 하면 움직여요.', usableFor: ['C06'], assetId: 'ref-07' },
  { id: 'ref-08', kind: 'mobility', title: '접는 책상', desc: '접으면 작고 가벼워져 들고 옮기기 쉬워요.', usableFor: ['C06', 'C01'], assetId: 'ref-08' },
  { id: 'ref-09', kind: 'mobility', title: '큰 손잡이 상자', desc: '손잡이가 커서 한 손으로도 쉽게 잡아요.', usableFor: ['C08', 'C07'], assetId: 'ref-09' },
  { id: 'ref-10', kind: 'tech', title: '화면 책상', desc: '윗면 화면이 밝게 빛나 책상 자리가 잘 보여요.', usableFor: ['C09'], assetId: 'ref-10' },
  { id: 'ref-11', kind: 'tech', title: '카드 사물함', desc: '카드를 대기만 하면 잠금이 풀려요.', usableFor: ['C08'], assetId: 'ref-11' },
  { id: 'ref-12', kind: 'tech', title: '자동문', desc: '사람이 다가가면 문이 저절로 열려요.', usableFor: ['C03', 'C12', 'C07', 'C15'], assetId: 'ref-12' },
];
