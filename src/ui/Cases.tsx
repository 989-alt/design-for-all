import { useState } from 'preact/hooks';
import { CASES } from '../content/cases';
import { ELEMENTS } from '../content/elements';
import { Hud, Next } from './Progress';
import { useGame } from './store';

export function Cases() {
  const { state, dispatch } = useGame();
  const [cur, setCur] = useState(0);
  const c = CASES[cur];
  const tag = state.tags.find((t) => t.caseId === c.id);
  return (
    <div class="stage studio">
      <Hud />
      <nav class="case-strip" aria-label="사례 카드 7장">
        {CASES.map((x, i) => {
          const t = state.tags.find((tg) => tg.caseId === x.id);
          return (
            <button class={`k-panel thin case-thumb${i === cur ? ' ring' : ''}`} aria-pressed={i === cur} aria-label={`${i + 1}번 ${x.title}${t?.correct ? ' · 완료' : ''}`} onClick={() => setCur(i)}>
              <img src={`./assets/kit/${x.assetId}.png`} alt="" />
              <span class="sm">
                {t?.correct && <img class="icon" src="./assets/kit/icon-check.png" width={18} height={18} alt="" />} {i + 1}
              </span>
            </button>
          );
        })}
      </nav>
      <section class="k-panel thin case-main" aria-labelledby="case-h">
        <img class="case-art" src={`./assets/kit/${c.assetId}.png`} alt="" />
        <div class="case-body">
          <h2 id="case-h" class="jua">{c.title}</h2>
          <div class="els" role="group" aria-label="이 디자인이 가장 힘을 준 요소">
            {ELEMENTS.map((e) => (
              <button class="k-btn paper el" aria-disabled={tag?.correct ? 'true' : undefined} onClick={(ev) => ev.detail > 1 || dispatch({ type: 'tagCase', caseId: c.id, elementId: e.id })}>
                <span class="lbl"><span><img class="icon" src={`./assets/kit/${e.icon}.png`} width={24} height={24} alt="" /> {e.name}</span></span>
              </button>
            ))}
          </div>
          {/* 뒷면은 태깅 뒤에만 (S4) */}
          {tag && (
            <div class="k-card thin back" aria-live="polite">
              <b class="jua">{tag.correct ? '맞았어요' : '다시 골라 봐요'}</b>
              <p>{c.back}</p>
              {/* 판정 D2: 맞힌 뒤 그 요소의 뜻 한 줄 */}
              {tag.correct && (() => {
                const e = ELEMENTS.find((x) => x.id === c.main)!;
                return <p class="def"><img class="icon" src={`./assets/kit/${e.icon}.png`} width={24} height={24} alt="" /> <b>{e.name}</b> — {e.desc}</p>;
              })()}
            </div>
          )}
        </div>
      </section>
      <Next />
    </div>
  );
}
