import { useState } from 'preact/hooks';
import { NPCS } from '../content/npcs';
import type { Part, SlotId } from '../content/types';
import { partOf, SLOTS } from '../engine/judge';
import { reduce } from '../engine/state';
import { LinkPanel } from './LinkPanel';
import { Preview } from './Preview';
import { Hud } from './Progress';
import { Slot } from './Slot';
import { useGame } from './store';
import '../styles/studio.css';

const BLOCK: Record<string, string> = { slots_incomplete: '부품 5개를 모두 골라요', no_change: '부품을 하나 이상 바꿔요' };

// 화면 6 조립대 · 화면 8 수정(같은 틀 + 위에 바꾼 이유)
export function Studio() {
  const { state, dispatch } = useGame();
  const { slots, links, reason } = state.draft;
  const [now, setNow] = useState<SlotId>(SLOTS.find((s) => !slots[s]) ?? 'form');
  const [linking, setLinking] = useState<SlotId | null>(null);
  const [note, setNote] = useState('');
  const [warned, setWarned] = useState(false);

  const pick = (slot: SlotId, p: Part) => {
    const had = links[slot];
    if (slots[slot] !== p.id) {
      dispatch({ type: 'setPart', slotId: slot, partId: p.id });
      // 부품이 바뀌면 그 슬롯의 연결은 지운다
      if (had) {
        dispatch({ type: 'linkPart', slotId: slot, cardId: null });
        setNote('부품을 바꿔서 연결을 지웠어요. 다시 이어 주세요');
      } else setNote('');
    }
    setLinking(slot);
  };
  const linked = () => {
    setLinking(null);
    setNote('');
    const next = SLOTS.find((s) => !slots[s]);
    if (next) setNow(next);
  };

  const block = reduce(state, { type: 'runTest' }).rejected;
  // ★ 부품에 연결이 없으면 테스트 전에 한 번만 알린다(막지는 않음)
  const techBare = SLOTS.some((s) => slots[s] && partOf(slots[s]!).tech && !links[s]);
  const test = () => {
    if (block) return;
    if (techBare && !warned) {
      setWarned(true);
      return setNote('첨단 부품에 이은 불편 카드가 없어요. 그래도 테스트하려면 한 번 더 눌러요');
    }
    dispatch({ type: 'runTest' });
  };
  const filled = SLOTS.filter((s) => slots[s]).length;
  const who = reason && NPCS.find((n) => n.id === reason)!;
  const last = state.rounds[state.rounds.length - 1];

  return (
    <div class={`stage studio${who ? ' revising' : ''}`}>
      <Hud />
      {who && (
        <p class="reason" role="status">
          <img class="npc" src={`./assets/kit/${who.portrait[last.reactions[who.id]!]}.png`} width={36} height={36} alt="" />
          <b class="jua">바꾼 이유</b> {who.name} — {last.lines[who.id]}
        </p>
      )}
      <Preview />
      <section class="k-panel parts" aria-labelledby="parts-h">
        <div class="ph">
          <span id="parts-h" class="jua h">부품</span>
          <span class="sm">{filled}/5</span>
        </div>
        {SLOTS.map((s) => (
          <Slot slot={s} now={now === s} onOpen={() => setNow(s)} onPick={(p) => pick(s, p)} onLink={() => (setNow(s), setLinking(s))} />
        ))}
      </section>
      <p class="studio-msg" aria-live="polite">{note || (block && BLOCK[block]) || ''}</p>
      <LinkPanel slot={linking} onDone={linked}>
        <button class="k-btn coral go" aria-disabled={block ? 'true' : undefined} onClick={test}>
          <span class="lbl jua"><span>{state.rounds.length ? '다시 테스트' : '테스트하기'}</span></span>
        </button>
      </LinkPanel>
    </div>
  );
}
