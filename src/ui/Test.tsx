import { useEffect, useRef, useState } from 'preact/hooks';
import { CARDS } from '../content/cards';
import { NPCS } from '../content/npcs';
import { PRODUCTS } from '../content/products';
import type { NpcId, ReactionKind } from '../content/types';
import { cosmeticOnly, partOf, SLOTS, techMiss } from '../engine/judge';
import { score } from '../engine/score';
import { reduce } from '../engine/state';
import { verdict } from '../engine/verdict';
import { playSfx } from './Audio';
import { Feedback } from './Feedback';
import { Hud } from './Progress';
import { REACT, Revise } from './Revise';
import { advance, useGame } from './store';
import '../styles/studio.css';

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
  const fix = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // 줄인 움직임이면 차례 연출이 없으니 반응 효과음을 한 번만 낸다(첫 부분·불만, 없으면 만족)
    if (instant) playSfx(`sfx-${round.reactions[tested.find((n) => round.reactions[n] !== 'happy') ?? tested[0]]!}`);
  }, []);
  useEffect(() => {
    if (shown >= tested.length) return;
    const t = setTimeout(() => (playSfx(`sfx-${round.reactions[tested[shown]]!}`), setShown(shown + 1)), STEP_MS);
    return () => clearTimeout(t);
  }, [shown]);

  // 이번 테스트의 피드백: 저상 버스(M1)는 1차에만, 첨단(M3)은 이번 라운드가 놓쳤으면
  const fbs = [...(r === 1 && state.feedback.includes('bus') ? ['bus' as const] : []), ...(techMiss(round) ? ['tech' as const] : [])];
  const done = shown >= tested.length;
  const modal = done && closed < fbs.length ? fbs[closed] : null;

  const vis = tested.slice(0, shown);
  // 연출 중엔 막 나온 사람, 끝나면 첫 부분·불만(없으면 첫 사람)
  const cur = sel ?? (done ? (tested.find((n) => round.reactions[n] !== 'happy') ?? tested[0]) : vis[vis.length - 1]);
  const count = (k: ReactionKind) => vis.filter((n) => round.reactions[n] === k).length;
  const canReflect = !reduce(state, { type: 'nextStage' }).rejected;
  // S1(만족 n−1 이상)을 채웠으면 돌아보기가 주 버튼
  const s1 = verdict(state).S1;
  const first = state.rounds[0];
  const prev = state.rounds[r - 2];
  // M2(색·형태만 바꿈): 아름다움은 바뀌어도 누구나 편리는 그대로임을 보여 준다
  const cosmetic = prev && cosmeticOnly(prev, round.slots, round.satisfied);
  const beauty = (x: typeof round) => score(product.id, x).beauty;
  const closeRevise = () => {
    setRevising(false);
    setTimeout(() => fix.current?.focus());
  };

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
          <Revise onCancel={closeRevise} />
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
              {done && r > 1 && (
                <div class="since">
                  <div><img class="icon" src={kit('icon-access')} width={24} height={24} alt="" /> 처음 <b>{first.satisfied}</b> → 지금 <b>{round.satisfied}</b></div>
                  {cosmetic && (
                    <>
                      <div><img class="icon" src={kit('icon-beauty')} width={24} height={24} alt="" /> 아름다움 {beauty(prev)} → {beauty(round)}</div>
                      <div><img class="icon" src={kit('icon-access')} width={24} height={24} alt="" /> 누구나 편리 그대로</div>
                    </>
                  )}
                </div>
              )}
            </section>
          </>
        )}
        {done && !revising && (
          <footer class="test-btns">
            {canReflect && (
              <button class={`k-btn ${r < 3 && !s1 ? 'paper' : 'coral'}`} style="width:200px" onClick={() => advance('test')}>
                <span class="lbl jua"><span>돌아보기</span></span>
              </button>
            )}
            {r < 3 && (
              <button ref={fix} class={`k-btn ${canReflect && s1 ? 'paper' : 'coral'}`} style="width:260px" onClick={() => setRevising(true)}>
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
