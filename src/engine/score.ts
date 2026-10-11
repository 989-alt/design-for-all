// 요소 6 점수(PRD §4.4), 0~100. 최신성은 참고 축 — ★ 없으면 null.
import { CARDS } from '../content/cards';
import { HARMONY } from '../content/harmony';
import type { ElementId, HarmonyKey, ProductId } from '../content/types';
import { linkOk, npcsFor, partOf, SLOTS } from './judge';
import type { Round } from './types';

export type Scores = Record<Exclude<ElementId, 'tech'>, number> & { tech: number | null };

const ECO = { full: 100, half: 50, none: 0 };

export function score(product: ProductId, round: Pick<Round, 'slots' | 'links' | 'satisfied'>): Scores {
  const parts = SLOTS.map((s) => partOf(round.slots[s]));
  const ok = SLOTS.map((s, i) => linkOk(parts[i], round.links[s]));
  const cards = CARDS.filter((c) => c.product === product);
  const full = cards.filter((c) => parts.some((p) => p.solves.includes(c.id)) && !parts.some((p) => p.worse.includes(c.id)));
  const no = (s: (typeof SLOTS)[number]) => round.slots[s].split('-')[2];
  const tech = parts.map((p, i) => (p.tech ? ok[i] : null)).filter((x) => x !== null);
  return {
    access: Math.round((round.satisfied / npcsFor(product).length) * 100),
    purpose: ok.filter(Boolean).length * 20,
    function: Math.round((full.length / cards.length) * 100),
    beauty: HARMONY[product][`${no('form')}${no('color')}${no('material')}` as HarmonyKey],
    eco: Math.max(...parts.map((p) => ECO[p.eco])),
    tech: tech.length === 0 ? null : tech.every(Boolean) ? 100 : 0,
  };
}
