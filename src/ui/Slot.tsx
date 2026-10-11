import { CARDS } from '../content/cards';
import { NPCS } from '../content/npcs';
import { PRODUCTS } from '../content/products';
import type { Part, PartId, SlotId } from '../content/types';
import { partOf } from '../engine/judge';
import { useGame } from './store';

const ICON: Record<SlotId, string> = { form: 'icon-shape', funcA: 'icon-height', funcB: 'icon-move', material: 'icon-material', color: 'icon-color' };
const npcName = (id: string) => NPCS.find((n) => n.id === id)!.name;

// 슬롯 한 행: 슬롯 버튼(이름·고른 부품) + 연결 칩. 지금 슬롯이면 부품 4 버튼이 펼쳐진다
export function Slot({ slot, now, onOpen, onPick, onLink }: {
  slot: SlotId;
  now: boolean;
  onOpen: () => void;
  onPick: (p: Part) => void;
  onLink: () => void;
}) {
  const { state } = useGame();
  const prod = PRODUCTS[state.product!];
  const sname = prod.slotNames[slot];
  const cur = state.draft.slots[slot];
  const link = state.draft.links[slot];
  const last = state.rounds[state.rounds.length - 1];
  // 직전 테스트에서 ✗ 로 지목된 부품이 아직 그대로면 표시
  const worse = last && cur && (Object.entries(last.worse) as [string, PartId][]).filter(([, p]) => p === cur).map(([n]) => npcName(n));
  const chip = link ? npcName(CARDS.find((c) => c.id === link)!.npc) : link === null ? '없음' : '+ 연결';
  return (
    <div class={`srow${now ? ' now' : ''}`}>
      <button class="sname" aria-expanded={now} aria-label={`${sname} 슬롯${cur ? ` · ${partOf(cur).name}` : ' · 비어 있음'}`} onClick={onOpen}>
        <img class="icon" src={`./assets/kit/${ICON[slot]}.png`} width={32} height={32} alt="" /> {sname}
      </button>
      {now ? (
        <span class="opts" role="radiogroup" aria-label={`${sname} 부품`}>
          {prod.parts[slot].map((p) => (
            <button class="k-btn paper opt" role="radio" aria-checked={cur === p.id} onClick={() => onPick(p)}>
              <span class="lbl"><span>{cur === p.id && <img class="icon" src="./assets/kit/icon-check.png" width={18} height={18} alt="" />} {p.name}</span></span>
            </button>
          ))}
        </span>
      ) : (
        <span class="part jua">{cur ? partOf(cur).name : ''}</span>
      )}
      <span class="chips">
        {worse && worse.length > 0 && (
          <span class="worse"><img class="icon" src="./assets/kit/icon-face-unhappy.png" width={24} height={24} alt="" /> {worse.join('·')} 불편</span>
        )}
        {/* 칩 그림은 32px 그대로, 누르는 면은 48px */}
        {cur && (
          <button class="chip-hit" aria-label={`${sname} 연결: ${chip}`} onClick={onLink}>
            <span class="k-chip" style="width:96px"><span class="lbl sm"><span>{chip}</span></span></span>
          </button>
        )}
      </span>
    </div>
  );
}
