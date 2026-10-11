import type { CaseCard } from './types';

// 교과분석 ⑤ 사례 6 + ⑦ 저상 버스. 제품명·회사명 없이 서술. back 은 "어떤 상황에서 쓰나" 포함
export const CASES: CaseCard[] = [
  {
    id: 'case-01', title: '혼자 길을 다니며 물건을 나르는 작은 로봇', main: 'tech', sub: ['access'], assetId: 'case-01',
    back: '눈 모양 카메라로 길을 보며 혼자 다녀요. 새 기술로 물건 나르기를 편하게 했어요.',
  },
  {
    id: 'case-02', title: '얼굴을 알아보고 인사하는 로봇 친구', main: 'tech', sub: ['beauty'], assetId: 'case-02',
    back: '얼굴을 알아보고 먼저 말을 걸어요. 새 기술에 사람 닮은 모습을 더해 친구가 돼요.',
  },
  {
    id: 'case-03', title: '구슬을 만져 시간을 아는 시계', main: 'access', sub: ['function'], assetId: 'case-03',
    back: '눈으로 보지 않아도 구슬을 만지면 시간을 알아요. 누구나 쓸 수 있게 만들었어요.',
  },
  {
    id: 'case-04', title: '버려진 병뚜껑으로 만든 치약 짜개', main: 'eco', sub: ['function'], assetId: 'case-04',
    back: '버려지는 병뚜껑을 모아 녹여서 만들었어요. 쓰레기를 다시 살려 환경을 생각했어요.',
  },
  {
    id: 'case-05', title: '낡은 방수포로 만든 가방', main: 'eco', sub: ['function'], assetId: 'case-05',
    back: '버려진 방수포와 현수막으로 만들어 비에 강해요. 버릴 것을 살려 환경을 생각했어요.',
  },
  {
    id: 'case-06', title: '평범한 의자에 독특한 무늬를 입힌 의자', main: 'beauty', sub: [], assetId: 'case-06',
    back: '흔한 의자 모양에 알록달록 무늬를 입혔어요. 보는 즐거움, 아름다움에 힘을 줬어요.',
  },
  {
    id: 'case-07', title: '계단을 없앤 낮은 버스', main: 'access', sub: ['function'], assetId: 'case-07',
    back: '바닥을 낮추고 계단을 없앴어요. 휠체어를 탄 사람도 무릎 아픈 어르신도 모두 편해요.',
  },
];
