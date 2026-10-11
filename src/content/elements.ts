import type { DesignElement } from './types';

// 교과분석 ④ 제품 디자인의 요소 6
export const ELEMENTS: DesignElement[] = [
  { id: 'purpose', name: '목적에 맞음', desc: '쓰는 사람과 쓰는 곳에 알맞게 만들었나요?', icon: 'icon-purpose' },
  { id: 'tech', name: '최신성', desc: '새로운 기술로 더 좋게 만들었나요?', icon: 'icon-tech' },
  { id: 'function', name: '기능성', desc: '제품이 맡은 일을 잘 해내나요?', icon: 'icon-function' },
  { id: 'beauty', name: '아름다움', desc: '모양·색·소재가 보기 좋게 어울리나요?', icon: 'icon-beauty' },
  { id: 'access', name: '누구나 편리', desc: '누구나 쉽고 편하게 쓸 수 있나요?', icon: 'icon-access' },
  { id: 'eco', name: '환경 고려', desc: '자원을 아끼고 지구를 생각했나요?', icon: 'icon-eco' },
];
