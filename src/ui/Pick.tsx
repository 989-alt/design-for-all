import { CARDS } from '../content/cards';
import { PRODUCTS } from '../content/products';
import type { ProductId } from '../content/types';
import { Card } from './Card';
import { Hud, Next } from './Progress';
import { useGame } from './store';

const IDS: ProductId[] = ['desk', 'locker', 'door'];

export function Pick() {
  const { state, dispatch } = useGame();
  const mine = (p: ProductId) => CARDS.filter((c) => c.product === p && state.collected.includes(c.id));
  const p = state.product;
  return (
    <div class="stage studio">
      <Hud />
      <section class="picks" role="radiogroup" aria-label="고칠 제품">
        {IDS.map((id) => (
          <button class={`k-panel thin pick${p === id ? ' ring' : ''}`} role="radio" aria-checked={p === id} onClick={() => dispatch({ type: 'pickProduct', productId: id })}>
            <img src={`./assets/kit/${PRODUCTS[id].icon}.png`} width={160} height={160} alt="" />
            <span class="jua name">{PRODUCTS[id].name}</span>
            <span class="sm">
              {p === id && <img class="icon" src="./assets/kit/icon-check.png" width={18} height={18} alt="고름" />} 불편 카드 {mine(id).length}장
            </span>
          </button>
        ))}
      </section>
      <section class="k-panel thin pick-cards" aria-labelledby="pick-h">
        <h2 id="pick-h" class="jua">모은 {p ? `${PRODUCTS[p].name} ` : ''}불편 카드</h2>
        {p && (mine(p).length ? mine(p).map((c) => <Card card={c} />) : <p class="warn" role="status">모은 불편 카드 중에 {PRODUCTS[p].name} 카드가 없어요</p>)}
      </section>
      <Next />
    </div>
  );
}
