import { useState } from 'preact/hooks';
import { CARDS } from '../content/cards';
import { NPCS } from '../content/npcs';
import type { NpcId } from '../content/types';
import { Dialog } from './Dialog';
import { CLASSROOM_ART, NPC_HIT_AREAS } from './npcHitAreas';
import { Hud, Next } from './Progress';
import { useGame } from './store';

export function Classroom() {
  const { state, dispatch } = useGame();
  const [who, setWho] = useState<NpcId | null>(null);
  const users = new Set(CARDS.filter((c) => state.collected.includes(c.id)).map((c) => c.npc)).size;
  const talk = (id: NpcId) => {
    if (id !== who) dispatch({ type: 'talk', npcId: id });
    setWho(id);
  };
  return (
    <div class="stage">
      <img class="art" src={CLASSROOM_ART} alt="교실에 모인 사용자 6명" />
      <Hud />
      {NPC_HIT_AREAS.map((h) => {
        const n = NPCS.find((x) => x.id === h.id)!;
        return (
          <button class="npc-hit" style={{ left: h.x, top: h.y, width: h.w, height: h.h }} aria-label={`${n.name} · ${n.trait}`} aria-pressed={who === h.id} onClick={() => talk(h.id)} />
        );
      })}
      <Next cls="counter">
        <span class="count" aria-live="polite">불편 카드 <span class="num">{state.collected.length}</span> 장 · 사용자 <span class="num">{users}</span> 명</span>
      </Next>
      {who && <Dialog npcId={who} />}
    </div>
  );
}
