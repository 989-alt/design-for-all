import { useState } from 'preact/hooks';
import { reduce } from '../engine/state';
import type { Reject, Stage } from '../engine/types';
import { applyPref } from '../app';
import { advance, useGame } from './store';

const STEPS = ['문제점 찾기', '조사하기', '설계하기', '테스트·수정', '돌아보기'];
const STEP_OF: Partial<Record<Stage, number>> = { classroom: 0, pick: 0, research: 1, design: 2, test: 3, revise: 3, reflect: 4, result: 5 };

// 엔진 거부 사유 → 안내 한 줄. 여기 없는 사유는 말하지 않는다
const MSG: Partial<Record<Reject, string>> = {
  cases_incomplete: '사례 카드 7장을 모두 골라야 해요',
  need_more_cards: '3명에게 4장을 받아야 해요',
  no_product: '고칠 제품을 하나 골라야 해요',
  need_two_refs: '참고 카드 2장을 불편 카드에 이어야 해요',
  two_refs_max: '참고 카드는 2장까지 골라요',
};

export function Hud() {
  const { state } = useGame();
  const [, re] = useState(0);
  const now = STEP_OF[state.stage] ?? -1;
  const pref = document.documentElement.dataset;
  const tools = [
    { label: '가 크게', on: !!pref.text, flip: () => applyPref({ text: pref.text ? undefined : 'large' }) },
    { label: '고대비', on: !!pref.contrast, flip: () => applyPref({ contrast: pref.contrast ? undefined : 'high' }) },
  ];
  return (
    <header class="hud k-hud" aria-label="진행">
      <div class="hud-in">
        <h1 class="jua title">모두의 교실 디자인 스튜디오</h1>
        <nav class="steps" aria-label="디자인 과정">
          {STEPS.map((name, i) =>
            i === now ? (
              <span class="k-step-now jua" style="width:136px" aria-current="step">
                <span class="lbl"><span>{i + 1} {name}</span></span>
              </span>
            ) : (
              <span class="k-step" style="width:126px">
                <span class="lbl sm">
                  <span>
                    {i < now ? <img class="icon" src="./assets/kit/icon-check.png" width={18} height={18} alt="완료" /> : `${i + 1} `}
                    {i < now && ' '}{name}
                  </span>
                </span>
              </span>
            ),
          )}
        </nav>
        <div class="tools">
          {tools.map((t) => (
            <button class={`k-tool${t.on ? ' on' : ''}`} aria-pressed={t.on} onClick={() => (t.flip(), re((n) => n + 1))}>
              <span class="lbl sm"><span>{t.label}</span></span>
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}

// 다음 단계 버튼. 막힘 여부는 엔진에 미리 물어본다(규칙을 UI 에 다시 쓰지 않는다)
export function Next({ cls = '' }: { cls?: string }) {
  const { state, rejected } = useGame();
  const block = reduce(state, { type: 'nextStage' }).rejected;
  const msg = (rejected && MSG[rejected]) || (block && MSG[block]) || '';
  return (
    <footer class={`k-panel thin next-bar ${cls}`}>
      <p class="msg" aria-live="polite">{msg}</p>
      <button class="k-btn coral" aria-disabled={block ? 'true' : undefined} onClick={() => advance(state.stage)}>
        <span class="lbl jua"><span>다음</span></span>
      </button>
    </footer>
  );
}
