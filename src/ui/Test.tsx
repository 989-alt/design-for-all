import { useEffect, useState } from 'preact/hooks';
import { CARDS } from '../content/cards';
import { NPCS } from '../content/npcs';
import { PRODUCTS } from '../content/products';
import type { NpcId, ReactionKind } from '../content/types';
import { partOf, SLOTS } from '../engine/judge';
import { reduce } from '../engine/state';
import { Feedback } from './Feedback';
import { Hud } from './Progress';
import { Revise } from './Revise';
import { advance, useGame } from './store';
import '../styles/studio.css';

export const REACT: Record<ReactionKind, string> = { happy: '만족', partial: '부분', unhappy: '불만' };
const STEP_MS = 500;
const kit = (id: string) => `./assets/kit/${id}.png`;

// 화면 7 테스트: NPC 가 차례로 반응(줄인 움직임이면 한 번에), 만족 수, 피드백 카드, 수정·돌아보기
export function Test() {
  const { state } = useGame();
  const r = state.rounds.length;
  const round = state.rounds[r - 1];
  const product = PRODUCTS[state.product!];
  const tested = state.npcOrder.filter((n) => round.reactions[n]);
  const instant = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [shown, setShown] = useState(instant ? tested.length : 0);
  const [sel, setSel] = useState<NpcId | null>(null);
  const [closed, setClosed] = useState(0);
  const [revising, setRevising] = useState(false);

  useEffect(() => {
    if (shown >= tested.length) return;
    const t = setTimeout(() => setShown(shown + 1), STEP_MS);
    return () => clearTimeout(t);
  }, [shown]);

  // 이번 테스트가 새로 낸 피드백 = 직전 'test' 로그와 이번 'test' 로그 사이의 'feedback'
  const tests = state.log.flatMap((l, i) => (l.e === 'test' ? [i] : []));
  const fbs = state.log.slice((tests[tests.length - 2] ?? -1) + 1, tests[tests.length - 1]).filter((l) => l.e === 'feedback').map((l) => l.d as 'bus' | 'tech');
  const done = shown >= tested.length;
  const modal = done && closed < fbs.length ? fbs[closed] : null;

  const vis = tested.slice(0, shown);
  const cur = sel ?? vis[vis.length - 1];
  const count = (k: ReactionKind) => vis.filter((n) => round.reactions[n] === k).length;
  const canReflect = !reduce(state, { type: 'nextStage' }).rejected;

  // 그 NPC 와 관련된 부품: ✗ 지목 부품, 없으면 그 NPC 카드를 (부분이라도) 푼 부품
  const related = (n: NpcId) => {
    const w = round.worse[n];
    const cards = CARDS.filter((c) => c.product === product.id && c.npc === n).map((c) => c.id);
    const ids = w ? [w] : SLOTS.map((s) => round.slots[s]).filter((id) => { const p = partOf(id); return [...p.solves, ...p.partial].some((c) => cards.includes(c)); });
    return ids.map((id) => `${product.slotNames[partOf(id).slot]} · 「${partOf(id).name}」`).join('  ');
  };

  return (
    <div class="stage studio">
      <div class="test-in" inert={!!modal}>
        <Hud />
        <section class="k-panel thin test-strip" aria-label={`사용자 ${tested.length}명 반응`}>
          {tested.map((id, i) => {
            const n = NPCS.find((x) => x.id === id)!;
            const k = round.reactions[id]!;
            return i < shown ? (
              <button class={`tp${cur === id ? ' ring' : ''}`} aria-pressed={cur === id} aria-label={`${n.name} ${REACT[k]}`} onClick={() => setSel(id)}>
                <img class="npc" src={kit(n.portrait[k])} width={72} height={72} alt="" />
                <span>
                  <span class="nm">{n.name}</span>
                  <span class="st"><img class="face" src={kit(`icon-face-${k}`)} alt="" /><span class={`react ${k}`}>{REACT[k]}</span></span>
                </span>
              </button>
            ) : (
              <span class="tp wait" />
            );
          })}
        </section>
        {revising ? (
          <Revise onCancel={() => setRevising(false)} />
        ) : (
          <>
            <section class="k-panel test-main" aria-live="polite">
              {cur && (() => {
                const n = NPCS.find((x) => x.id === cur)!;
                const k = round.reactions[cur]!;
                return (
                  <>
                    <img class="npc" src={kit(n.portrait[k])} width={112} height={112} alt="" />
                    <div>
                      <div class="jua who">{n.name} <span class={`react ${k}`}><img class="face" src={kit(`icon-face-${k}`)} alt="" /> {REACT[k]}</span></div>
                      <p class="jua">{round.lines[cur]}</p>
                      <div class="sm rel">{related(cur)}</div>
                    </div>
                  </>
                );
              })()}
            </section>
            <section class="k-panel test-num" aria-label="만족 수">
              <div class="sm">만족한 사용자</div>
              <div class="big"><b>{count('happy')}</b> / {tested.length}</div>
              <div class="sub">부분 {count('partial')} · 불만 {count('unhappy')}</div>
            </section>
          </>
        )}
        {done && !revising && (
          <footer class="test-btns">
            {canReflect && (
              <button class={`k-btn ${r < 3 ? 'paper' : 'coral'}`} style="width:200px" onClick={() => advance('test')}>
                <span class="lbl jua"><span>돌아보기</span></span>
              </button>
            )}
            {r < 3 && (
              <button class="k-btn coral" style="width:260px" onClick={() => setRevising(true)}>
                <span class="lbl jua"><span>수정하러 가기</span></span>
              </button>
            )}
          </footer>
        )}
      </div>
      {modal && <Feedback id={modal} onClose={() => setClosed(closed + 1)} />}
    </div>
  );
}
