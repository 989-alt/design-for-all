import { useState } from 'preact/hooks';
import { CARDS } from '../content/cards';
import { NPCS } from '../content/npcs';
import { REF_KINDS, REFERENCES } from '../content/references';
import { Card } from './Card';
import { Hud, Next } from './Progress';
import { useGame } from './store';

// 탭 2번: 참고 카드 → 불편 카드. 고른 카드를 다시 탭하면 내려놓는다
export function Research() {
  const { state, dispatch } = useGame();
  const [active, setActive] = useState<string | null>(null);
  const picked = (id: string) => state.research.find((r) => r.refId === id);
  const tapRef = (id: string) => {
    if (picked(id) && active !== id) return setActive(id);
    const was = !!picked(id);
    if (!dispatch({ type: 'pickRef', refId: id }).rejected) setActive(was ? null : id);
  };
  const tapCard = (cardId: (typeof CARDS)[number]['id']) => {
    if (active && !dispatch({ type: 'linkRef', refId: active, cardId }).rejected) setActive(null);
  };
  const act = REFERENCES.find((r) => r.id === active);
  return (
    <div class="stage studio">
      <Hud />
      <section class="refs" aria-label="참고 카드 12장">
        {state.refOrder.map((id) => {
          const r = REFERENCES.find((x) => x.id === id)!;
          const pk = picked(id);
          const to = pk?.cardId && CARDS.find((c) => c.id === pk.cardId)!;
          return (
            <button class={`k-panel thin ref${active === id ? ' ring' : ''}`} aria-pressed={!!pk} data-ref={id} onClick={(e) => e.detail > 1 || tapRef(id)}>
              <img src={`./assets/kit/${r.assetId}.png`} alt="" />
              <span class="jua rt">{r.title}</span>
              <span class="sm">
                {pk ? <><img class="icon" src="./assets/kit/icon-check.png" width={18} height={18} alt="" /> {to ? `→ ${NPCS.find((n) => n.id === to.npc)!.name}` : '고름'}</> : REF_KINDS[r.kind]}
              </span>
            </button>
          );
        })}
      </section>
      <section class="k-panel targets" aria-label="내 불편 카드">
        <p class="desc" aria-live="polite">{act ? <><b class="jua">{act.title}</b> {act.desc}</> : <b class="jua">내 불편 카드</b>}</p>
        <div class="tlist">
          {CARDS.filter((c) => c.product === state.product && state.collected.includes(c.id)).map((c) => (
            <Card card={c} onClick={() => tapCard(c.id)} pressed={state.research.some((r) => r.cardId === c.id)} />
          ))}
        </div>
      </section>
      <Next cls="right" />
    </div>
  );
}
