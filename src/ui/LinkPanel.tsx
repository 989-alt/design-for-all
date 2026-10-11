import type { ComponentChildren } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import { CARDS } from '../content/cards';
import { PRODUCTS } from '../content/products';
import type { CardId, SlotId } from '../content/types';
import { partOf } from '../engine/judge';
import { Card } from './Card';
import { useGame } from './store';

// 하단 트레이 = 불편 카드 보관함. slot 이 있으면 연결 패널로 열려 '이 제품' 카드와 '없음' 중 하나를 고른다. 열린 동안 오른쪽 칸은 '닫기'
export function LinkPanel({ slot, onDone, onClose, children }: { slot: SlotId | null; onDone: () => void; onClose: () => void; children: ComponentChildren }) {
  const { state, dispatch } = useGame();
  const ref = useRef<HTMLDivElement>(null);
  const mine = CARDS.filter((c) => c.product === state.product && state.collected.includes(c.id));
  const part = slot && state.draft.slots[slot] && partOf(state.draft.slots[slot]!);
  const link = (cardId: CardId | null) => {
    if (!dispatch({ type: 'linkPart', slotId: slot!, cardId }).rejected) onDone();
  };
  // 열리면 첫 카드로 포커스
  useEffect(() => {
    if (part) ref.current?.querySelector('button')?.focus();
  }, [slot, part && part.id]);

  return (
    <footer class={`k-panel thin tray${part ? ' open' : ''}`} aria-label="불편 카드 보관함">
      <span class="jua th">{part ? <>누구의<br />불편?</> : <>불편<br />카드</>}</span>
      {part ? (
        <div class="cards" ref={ref} role="group" aria-label={`${PRODUCTS[state.product!].slotNames[slot!]} 「${part.name}」은 누구의 불편을 푸나요?`}>
          {mine.map((c) => <Card card={c} onClick={() => link(c.id)} pressed={state.draft.links[slot!] === c.id} />)}
          <button class="k-btn paper none" aria-pressed={state.draft.links[slot!] === null} onClick={() => link(null)}>
            <span class="lbl jua"><span>없음</span></span>
          </button>
        </div>
      ) : (
        <div class="cards">{mine.map((c) => <Card card={c} />)}</div>
      )}
      {part ? (
        <button class="k-btn paper shut" onClick={onClose}>
          <span class="lbl jua"><span>닫기</span></span>
        </button>
      ) : (
        children
      )}
    </footer>
  );
}
