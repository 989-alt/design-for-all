import { useEffect, useRef, useState } from 'preact/hooks';
import { NPCS } from '../content/npcs';
import type { NpcId, ReactionKind } from '../content/types';
import { useGame } from './store';

export const REACT: Record<ReactionKind, string> = { happy: '만족', partial: '부분', unhappy: '불만' };

// 화면 8 입구: 바꾼 이유 = 직전 테스트의 부분·불만 NPC 하나(전원 만족이면 아무나). 고르면 조립대로 돌아간다
export function Revise({ onCancel }: { onCancel: () => void }) {
  const { state, dispatch } = useGame();
  const [pick, setPick] = useState<NpcId | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => ref.current?.querySelector<HTMLButtonElement>('button:not([aria-disabled])')?.focus(), []);
  const last = state.rounds[state.rounds.length - 1];
  const tested = state.npcOrder.filter((n) => last.reactions[n]);
  const unmet = tested.filter((n) => last.reactions[n] !== 'happy');
  const ok = (n: NpcId) => (unmet.length ? unmet : tested).includes(n);
  return (
    <section class="k-panel revise" aria-labelledby="rv-h">
      <h2 id="rv-h" class="jua">누구의 불편부터 고칠까요?</h2>
      <div class="rv-list" role="radiogroup" aria-labelledby="rv-h" ref={ref}>
        {tested.map((id) => {
          const n = NPCS.find((x) => x.id === id)!;
          const k = last.reactions[id]!;
          return (
            <button class={`k-card thin rv${pick === id ? ' ring' : ''}`} role="radio" aria-checked={pick === id} aria-disabled={ok(id) ? undefined : 'true'} onClick={() => ok(id) && setPick(id)}>
              <img class="npc" src={`./assets/kit/${n.portrait[k]}.png`} width={48} height={48} alt="" />
              <b class="jua">{n.name}</b>
              <span class={`react ${k}`}><img class="face" src={`./assets/kit/icon-face-${k}.png`} alt="" /> {REACT[k]}</span>
              <span class="line">{last.lines[id]}</span>
            </button>
          );
        })}
      </div>
      <div class="rv-btns">
        <button class="k-btn paper" style="width:140px" onClick={onCancel}>
          <span class="lbl jua"><span>닫기</span></span>
        </button>
        <button class="k-btn coral" style="width:220px" aria-disabled={pick ? undefined : 'true'} onClick={() => pick && dispatch({ type: 'revise', reason: pick })}>
          <span class="lbl jua"><span>이 불편 고치기</span></span>
        </button>
      </div>
    </section>
  );
}
