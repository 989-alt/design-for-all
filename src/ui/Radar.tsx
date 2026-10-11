import { ELEMENTS } from '../content/elements';
import type { Scores } from '../engine/score';

// 다각형은 5축(최신성 제외 — 제품마다 없을 수 있는 참고 축이라 꼭짓점에서 뺀다). 꼭짓점 = 요소 아이콘 + 이름 + 값(색만으로 구분하지 않는다).
// 선은 clip-path 면 둘: 100점 외곽(눈금) + 내 점수. 0점이어도 면이 보이게 최소 반지름
const AXES = ELEMENTS.filter((e) => e.id !== 'tech');
const tech = ELEMENTS.find((e) => e.id === 'tech')!;
const R = 0.36;
const at = (i: number, r: number): [number, number] => {
  const a = -Math.PI / 2 + (i * 2 * Math.PI) / AXES.length;
  return [0.5 + r * Math.cos(a), 0.5 + r * Math.sin(a)];
};
export const radarOuter = AXES.map((_, i) => at(i, R));
export const radarPoints = (sc: Scores) => AXES.map((e, i) => at(i, Math.max(0.04, (R * (sc[e.id] ?? 0)) / 100)));
const clip = (pts: [number, number][]) => ({ clipPath: `polygon(${pts.map(([x, y]) => `${x * 100}% ${y * 100}%`).join(',')})` });

export function Radar({ sc }: { sc: Scores }) {
  return (
    <div class="radar">
      <div class="radar-grid" style={clip(radarOuter)} aria-hidden="true" />
      <div class="radar-area" style={clip(radarPoints(sc))} aria-hidden="true" />
      <ul aria-label="요소 6 점수">
        {AXES.map((e, i) => {
          const [x, y] = at(i, 0.46);
          return (
            <li style={{ left: `${x * 100}%`, top: `${y * 100}%` }}>
              <img class="icon" src={`./assets/kit/${e.icon}.png`} width={40} height={40} alt="" />
              <span class="en">{e.name}</span>
              <span class="ev">{sc[e.id]}</span>
            </li>
          );
        })}
        <li class="tech-ref">
          <img class="icon" src={`./assets/kit/${tech.icon}.png`} width={28} height={28} alt="" />
          <span class="en">{tech.name}</span>
          <span class="ev">{sc.tech === null ? '해당 없음' : `참고 ${sc.tech}`}</span>
        </li>
      </ul>
    </div>
  );
}
