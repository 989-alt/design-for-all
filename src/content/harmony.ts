import type { Harmony, HarmonyKey, PartNo, ProductId } from './types';

// 조화표(아름다움): 형태·색·소재 64조합. 아래 규칙에 먼저 걸리는 값, 없으면 50.
type Rule = { form?: PartNo; color?: PartNo; material?: PartNo; score: 0 | 100 };

const RULES: Record<ProductId, Rule[]> = {
  desk: [
    { color: 4, material: 4, score: 100 }, // 나무색+재생 나무: 재료와 색이 한 결
    { form: 2, color: 2, score: 100 }, // 고대비 테두리+밝은 상판: 형태와 색이 같은 생각
    { color: 3, material: 4, score: 0 }, // 알록달록 패턴+나무결: 무늬끼리 다툰다
    { color: 4, material: 3, score: 0 }, // 나무색+알루미늄: 재료와 색이 어긋난다
  ],
  locker: [
    { color: 3, material: 1, score: 100 }, // 고대비 띠+철: 단단한 느낌이 한 결
    { form: 3, color: 2, score: 100 }, // 회전 원형+칸마다 다른 색: 돌 때 색이 리듬을 만든다
    { color: 2, material: 1, score: 0 }, // 알록달록+철: 차가운 재료에 들뜬 색
    { color: 2, material: 3, score: 0 }, // 칸마다 다른 색+나무결: 무늬끼리 다툰다
  ],
  door: [
    { color: 4, material: 3, score: 100 }, // 나무색+재생 나무: 재료와 색이 한 결
    { form: 4, color: 2, score: 100 }, // 자동문+뚜렷한 색: 매끈한 판에 한 색
    { color: 3, material: 1, score: 0 }, // 알록달록 패턴+철: 차가운 재료에 들뜬 색
    { color: 4, material: 1, score: 0 }, // 나무색+철: 재료와 색이 어긋난다
  ],
};

const NOS: PartNo[] = [1, 2, 3, 4];

const build = (rules: Rule[]): Harmony => {
  const table = {} as Harmony;
  for (const form of NOS)
    for (const color of NOS)
      for (const material of NOS) {
        const hit = rules.find(
          (r) => (r.form ?? form) === form && (r.color ?? color) === color && (r.material ?? material) === material,
        );
        table[`${form}${color}${material}` as HarmonyKey] = hit ? hit.score : 50;
      }
  return table;
};

export const HARMONY: Record<ProductId, Harmony> = {
  desk: build(RULES.desk),
  locker: build(RULES.locker),
  door: build(RULES.door),
};
