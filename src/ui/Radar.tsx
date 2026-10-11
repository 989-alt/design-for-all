import { ELEMENTS } from '../content/elements';
import type { Scores } from '../engine/score';

// 꼭짓점 = 요소 아이콘 + 이름 + 값(색만으로 구분하지 않는다). 선은 clip-path 면 하나. 최신성은 참고 축 — 없으면 0 자리
const at = (i: number, r: number): [number, number] => {
  const a = -Math.PI / 2 + (i * Math.PI) / 3;
  return [0.5 + r * Math.cos(a), 0.5 + r * Math.sin(a)];
};
export const radarPoints = (sc: Scores) => ELEMENTS.map((e, i) => at(i, (0.3 * (sc[e.id] ?? 0)) / 100));

export function Radar({ sc }: { sc: Scores }) {
  const poly = radarPoints(sc).map(([x, y]) => `${x * 100}% ${y * 100}%`).join(',');
  return (
    <div class="radar">
      <div class="radar-area" style={{ clipPath: `polygon(${poly})` }} aria-hidden="true" />
      <ul aria-label="요소 6 점수">
        {ELEMENTS.map((e, i) => {
          const [x, y] = at(i, 0.4);
          const v = sc[e.id];
          return (
            <li style={{ left: `${x * 100}%`, top: `${y * 100}%` }}>
              <img class="icon" src={`./assets/kit/${e.icon}.png`} width={40} height={40} alt="" />
              <span class="en">{e.name}</span>
              <span class="ev">{e.id === 'tech' ? (v === null ? '해당 없음' : `참고 ${v}`) : v}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
