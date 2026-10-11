import { CARDS } from '../content/cards';
import { NPCS } from '../content/npcs';
import type { NpcId } from '../content/types';
import { useGame } from './store';

// 교실 하단 대사. 남은 카드 하나씩, 다 받았으면 "고마워!" 한 줄
export function Dialog({ npcId }: { npcId: NpcId }) {
  const { state, dispatch } = useGame();
  const n = NPCS.find((x) => x.id === npcId)!;
  const card = CARDS.find((c) => c.npc === npcId && !state.collected.includes(c.id));
  return (
    <section class="k-speech speech" style="width:1100px;height:176px" aria-label="대화" aria-live="polite">
      <div class="who">
        <img class="npc" src={`./assets/kit/${n.portrait.happy}.png`} width={64} height={64} alt="" />
        <b class="jua">{n.name}</b>
        <small class="sm">{n.trait}</small>
      </div>
      {card ? (
        <p class="jua"><small class="sm">{card.where}</small><br /><u class="key">{card.what}</u></p>
      ) : (
        <p class="jua">고마워!</p>
      )}
      {card && (
        <button class="k-btn coral" style="width:220px" onClick={() => dispatch({ type: 'takeCard', cardId: card.id })}>
          <span class="lbl jua"><span>불편 카드 받기</span></span>
        </button>
      )}
    </section>
  );
}
