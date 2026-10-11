import { NPCS } from '../content/npcs';
import type { TroubleCard } from '../content/types';

// 불편 카드 한 장. onClick 이 있으면 고를 수 있는 버튼
export function Card({ card, onClick, pressed, note }: { card: TroubleCard; onClick?: () => void; pressed?: boolean; note?: string }) {
  const name = NPCS.find((n) => n.id === card.npc)!.name;
  const body = (
    <>
      <b class="jua">{name}</b> <span>{card.what}</span>
      {note && <span class="sm note">{note}</span>}
    </>
  );
  return onClick ? (
    <button class={`k-card thin tcard${pressed ? ' ring' : ''}`} aria-pressed={pressed} onClick={onClick}>{body}</button>
  ) : (
    <div class="k-card thin tcard">{body}</div>
  );
}
