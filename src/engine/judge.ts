// NPC 반응 판정(PRD §4.3)과 오개념 트리거 M1·M2·M3.
import { CARDS, WORSE_LINE } from '../content/cards';
import { NPCS } from '../content/npcs';
import { PRODUCTS } from '../content/products';
import type { CardId, NpcId, Part, PartId, ProductId, ReactionKind, SlotId, TroubleCard } from '../content/types';
import type { Round } from './types';

export const SLOTS: SlotId[] = ['form', 'funcA', 'funcB', 'material', 'color'];

export function partOf(id: PartId): Part {
  const [product, slot, n] = id.split('-') as [ProductId, SlotId, string];
  return PRODUCTS[product].parts[slot][Number(n) - 1];
}

// 그 제품 카드를 가진 NPC 만 테스트에 나온다(책상 6·사물함 5·문 5)
export function npcsFor(product: ProductId): NpcId[] {
  return NPCS.map((n) => n.id).filter((id) => CARDS.some((c) => c.product === product && c.npc === id));
}

type CardFx = { status: 'worse' | 'none' | 'partial' | 'full'; part?: Part };
const RANK = { worse: 0, none: 1, partial: 2, full: 3 };

// ✗ 가 있으면 다른 부품이 풀어도 더 나빠진 것으로 본다
function cardFx(parts: Part[], card: CardId): CardFx {
  const w = parts.find((p) => p.worse.includes(card));
  if (w) return { status: 'worse', part: w };
  const f = parts.find((p) => p.solves.includes(card));
  if (f) return { status: 'full', part: f };
  return parts.some((p) => p.partial.includes(card)) ? { status: 'partial' } : { status: 'none' };
}

function cardLine(card: TroubleCard, fx: CardFx): string {
  if (fx.status === 'worse') return WORSE_LINE.replace('{part}', fx.part!.name);
  if (fx.status === 'full') return card.reactions.happy.replace('{part}', fx.part!.name);
  // 손대지 않은 카드는 unhappy 문장 — partial 문장은 실제 partial 효과가 있을 때만
  return card.reactions[fx.status === 'partial' ? 'partial' : 'unhappy'];
}

export interface Reaction {
  kind: ReactionKind;
  line: string; // 가장 나쁜 카드의 문장
  card: CardId; // 그 가장 나쁜 카드
  worse?: PartId;
}

export function react(product: ProductId, slots: Record<SlotId, PartId>): Partial<Record<NpcId, Reaction>> {
  const parts = SLOTS.map((s) => partOf(slots[s]));
  const out: Partial<Record<NpcId, Reaction>> = {};
  for (const npc of npcsFor(product)) {
    const cards = CARDS.filter((c) => c.product === product && c.npc === npc);
    const fx = cards.map((c) => cardFx(parts, c.id));
    const worst = fx.reduce((a, b, i) => (RANK[b.status] < RANK[fx[a].status] ? i : a), 0);
    const kind: ReactionKind = fx.some((f) => f.status === 'worse') || fx.every((f) => f.status === 'none')
      ? 'unhappy'
      : fx.every((f) => f.status === 'full') ? 'happy' : 'partial';
    out[npc] = { kind, line: cardLine(cards[worst], fx[worst]), card: cards[worst].id };
    if (fx[worst].status === 'worse') out[npc]!.worse = fx[worst].part!.id;
  }
  return out;
}

// 맞는 연결 = 연결한 카드가 그 부품 효과표(full·partial)에 있음
export function linkOk(part: Part, card: CardId | null): boolean {
  return card !== null && (part.solves.includes(card) || part.partial.includes(card));
}

// M3: ★ 부품을 연결 없이 또는 틀린 카드에 연결
export function techMiss(round: Pick<Round, 'slots' | 'links'>): boolean {
  return SLOTS.some((s) => {
    const p = partOf(round.slots[s]);
    return p.tech && !linkOk(p, round.links[s]);
  });
}

// M1(PRD §6 수정본): 1차 만족 ≤1, 또는 연결한 카드(1장 이상)가 전부 한 NPC 의 것
export function busTrigger(reactions: Round['reactions'], links: Round['links']): boolean {
  const happy = Object.values(reactions).filter((k) => k === 'happy').length;
  const owners = new Set(Object.values(links).filter((c) => c !== null).map((c) => CARDS.find((x) => x.id === c)?.npc));
  return happy <= 1 || owners.size === 1;
}

// M2: 색·형태만 바꾸고 만족 수 그대로
export function cosmeticOnly(prev: Round, slots: Record<SlotId, PartId>, satisfied: number): boolean {
  const changed = SLOTS.filter((s) => prev.slots[s] !== slots[s]);
  return changed.length > 0 && changed.every((s) => s === 'form' || s === 'color') && satisfied === prev.satisfied;
}
