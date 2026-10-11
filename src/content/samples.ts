import type { Sample } from './types';

// 돌아보기 샘플 작품 2 — 교과서 작품이 아닌 가상 작품
export const SAMPLES: Sample[] = [
  {
    id: 'sample-01', title: '접었다 펴는 벽 책상', desc: '벽에 붙어 있다가 펴면 책상이 돼요.', assetId: 'sample-01',
    praise: {
      purpose: '좁은 교실에서 쓰기 좋아 목적에 맞아요.',
      tech: '접는 장치가 부드럽게 움직여 새로워요.',
      function: '펴면 책상, 접으면 벽이라 기능성이 좋아요.',
      beauty: '접었을 때 벽과 잘 어울려 아름다워요.',
      access: '앉아서도 서서도 쓸 수 있어 누구나 편리해요.',
      eco: '재생 나무로 만들어 환경을 생각했어요.',
    },
  },
  {
    id: 'sample-02', title: '그림 이름표 회전 사물함', desc: '빙글 돌리면 내 칸이 앞으로 와요.', assetId: 'sample-02',
    praise: {
      purpose: '교실 물건을 정리하기에 목적에 맞아요.',
      tech: '버튼 하나로 돌아가서 새로워요.',
      function: '칸이 많아 물건이 많이 들어가 기능성이 좋아요.',
      beauty: '둥근 모양과 그림이 어울려 아름다워요.',
      access: '돌리면 내 칸이 앞으로 와서 누구나 편리해요.',
      eco: '재활용 플라스틱으로 만들어 환경을 생각했어요.',
    },
  },
];
