// 순수 리듀서. 예외 대신 거부 사유를 돌려준다. 상태는 직렬화 가능한 객체뿐(저장은 T06).
import { CARDS } from '../content/cards';
import { CASES } from '../content/cases';
import { ELEMENTS } from '../content/elements';
import { COSMETIC_PREFIX } from '../content/feedback';
import { NPCS } from '../content/npcs';
import { PRODUCTS } from '../content/products';
import { REFERENCES } from '../content/references';
import { SAMPLES } from '../content/samples';
import type { CardId, NpcId, PartId, SlotId } from '../content/types';
import { busTrigger, cosmeticOnly, react, SLOTS, techMiss } from './judge';
import { mulberry32, shuffle } from './rng';
import type { Action, GameState, LogEntry, Reject, Round, Stage, Step } from './types';

export const MAX_ROUNDS = 3; // 1차 + 수정 2회

export function initState(): GameState {
  return {
    v: 1, seed: 0, stage: 'title', startedAt: 0, npcOrder: [], refOrder: [],
    tags: [], collected: [], product: null, research: [],
    draft: { slots: {}, links: {} }, rounds: [],
    reflect: { good: [], fix: [], praise: [] }, feedback: [], log: [],
  };
}

const isElement = (id: string) => ELEMENTS.some((e) => e.id === id);
// 프로토타입 키('constructor' 등) 차단. tsconfig lib ES2020 이라 Object.hasOwn 대신
const own = (o: object, k: string) => Object.prototype.hasOwnProperty.call(o, k);

export function reduce(s: GameState, a: Action, now = 0): Step {
  const no = (rejected: Reject): Step => ({ state: s, rejected });
  const fx: LogEntry[] = [];
  const log = (e: string, d?: unknown) => fx.push(d === undefined ? { t: now, e } : { t: now, e, d });
  const done = (patch: Partial<GameState>): Step => ({ state: { ...s, ...patch, log: [...s.log, ...fx] }, effects: fx });
  const go = (stage: Stage, patch: Partial<GameState> = {}) => (log('stage', stage), done({ ...patch, stage }));
  const at = (...stages: Stage[]) => stages.includes(s.stage);

  if (s.stage === 'result') return no('finished');

  switch (a.type) {
    case 'start': {
      if (!at('title')) return no('wrong_stage');
      const rand = mulberry32(a.seed);
      const npcOrder = shuffle(NPCS.map((n) => n.id), rand);
      const refOrder = shuffle(REFERENCES.map((r) => r.id), rand);
      log('start', a.seed);
      return go('cases', { seed: a.seed, startedAt: now, npcOrder, refOrder });
    }

    case 'tagCase': {
      if (!at('cases')) return no('wrong_stage');
      const c = CASES.find((x) => x.id === a.caseId);
      if (!c || !isElement(a.elementId)) return no('unknown_id');
      const prev = s.tags.find((t) => t.caseId === c.id);
      if (prev?.correct) return no('already_correct');
      const correct = a.elementId === c.main;
      const tag = { caseId: c.id, tried: [...(prev?.tried ?? []), a.elementId], correct };
      log('tag.case', { caseId: c.id, elementId: a.elementId, correct });
      return done({ tags: prev ? s.tags.map((t) => (t === prev ? tag : t)) : [...s.tags, tag] });
    }

    case 'nextStage': {
      if (at('cases')) return CASES.every((c) => s.tags.some((t) => t.caseId === c.id)) ? go('classroom') : no('cases_incomplete');
      if (at('classroom')) {
        const npcs = new Set(CARDS.filter((c) => s.collected.includes(c.id)).map((c) => c.npc));
        return s.collected.length >= 4 && npcs.size >= 3 ? go('pick') : no('need_more_cards');
      }
      if (at('pick')) {
        if (!s.product) return no('no_product');
        // 고른 제품의 불편 카드가 없으면 조사에서 이을 카드가 없어 막힌다(판정 D1)
        return CARDS.some((c) => c.product === s.product && s.collected.includes(c.id)) ? go('research') : no('no_product_cards');
      }
      if (at('research')) return s.research.length === 2 && s.research.every((r) => r.cardId) ? go('design') : no('need_two_refs');
      if (at('test')) return s.rounds.length >= 2 ? go('reflect') : no('need_revise');
      return no('wrong_stage');
    }

    case 'talk': {
      if (!at('classroom')) return no('wrong_stage');
      if (!NPCS.some((n) => n.id === a.npcId)) return no('unknown_id');
      log('talk', a.npcId);
      return done({});
    }

    case 'takeCard': {
      if (!at('classroom')) return no('wrong_stage');
      const c = CARDS.find((x) => x.id === a.cardId);
      if (!c) return no('unknown_id');
      if (!s.log.some((l) => l.e === 'talk' && l.d === c.npc)) return no('not_talked');
      if (s.collected.includes(c.id)) return no('already_collected');
      log('card', c.id);
      return done({ collected: [...s.collected, c.id] });
    }

    case 'pickProduct': {
      if (!at('pick')) return no('wrong_stage');
      if (!own(PRODUCTS, a.productId)) return no('unknown_id');
      log('product', a.productId);
      return done({ product: a.productId });
    }

    case 'pickRef': {
      if (!at('research')) return no('wrong_stage');
      if (!REFERENCES.some((r) => r.id === a.refId)) return no('unknown_id');
      if (s.research.some((r) => r.refId === a.refId)) {
        log('research.unpick', a.refId);
        return done({ research: s.research.filter((r) => r.refId !== a.refId) });
      }
      if (s.research.length >= 2) return no('two_refs_max');
      log('research.pick', a.refId);
      return done({ research: [...s.research, { refId: a.refId, cardId: null }] });
    }

    case 'linkRef': {
      if (!at('research')) return no('wrong_stage');
      if (!s.research.some((r) => r.refId === a.refId)) return no('ref_not_picked');
      if (!s.collected.includes(a.cardId)) return no('not_collected');
      const correct = REFERENCES.find((r) => r.id === a.refId)!.usableFor.includes(a.cardId);
      log('research.link', { refId: a.refId, cardId: a.cardId, correct });
      return done({ research: s.research.map((r) => (r.refId === a.refId ? { refId: r.refId, cardId: a.cardId } : r)) });
    }

    case 'setPart': {
      if (!at('design', 'revise')) return no('wrong_stage');
      const parts = PRODUCTS[s.product!].parts;
      if (!own(parts, a.slotId) || !parts[a.slotId].some((p) => p.id === a.partId)) return no('bad_part');
      log('part', { slotId: a.slotId, partId: a.partId });
      return done({ draft: { ...s.draft, slots: { ...s.draft.slots, [a.slotId]: a.partId } } });
    }

    case 'linkPart': {
      if (!at('design', 'revise')) return no('wrong_stage');
      if (!s.draft.slots[a.slotId]) return no('no_part');
      if (a.cardId !== null && !s.collected.includes(a.cardId)) return no('not_collected');
      log('link', { slotId: a.slotId, cardId: a.cardId });
      return done({ draft: { ...s.draft, links: { ...s.draft.links, [a.slotId]: a.cardId } } });
    }

    case 'runTest': {
      if (!(at('design') && s.rounds.length === 0) && !at('revise')) return no('wrong_stage');
      if (!SLOTS.every((sl) => s.draft.slots[sl])) return no('slots_incomplete');
      const slots = s.draft.slots as Record<SlotId, PartId>;
      const prev = s.rounds[s.rounds.length - 1];
      if (prev && SLOTS.every((sl) => prev.slots[sl] === slots[sl])) return no('no_change');
      const links = Object.fromEntries(SLOTS.map((sl) => [sl, s.draft.links[sl] ?? null])) as Record<SlotId, CardId | null>;
      const r = react(s.product!, slots);
      const npcs = Object.keys(r) as NpcId[];
      const reactions = Object.fromEntries(npcs.map((n) => [n, r[n]!.kind])) as Round['reactions'];
      const lines = Object.fromEntries(npcs.map((n) => [n, r[n]!.line])) as Round['lines'];
      const satisfied = npcs.filter((n) => reactions[n] === 'happy').length;
      const worse = Object.fromEntries(npcs.filter((n) => r[n]!.worse).map((n) => [n, r[n]!.worse])) as Round['worse'];
      if (prev && cosmeticOnly(prev, slots, satisfied)) {
        log('cosmetic_only');
        // ✗ 부품 지목 줄(§4.3)이 우선
        for (const n of npcs) if (reactions[n] !== 'happy' && !worse[n]) lines[n] = COSMETIC_PREFIX + CARDS.find((c) => c.id === r[n]!.card)!.reactions.unhappy;
      }
      const round: Round = { slots, links, reactions, lines, satisfied, worse };
      if (s.draft.reason) round.reason = s.draft.reason;
      const feedback = [...s.feedback];
      if (!prev && busTrigger(reactions, links)) feedback.push('bus');
      if (techMiss(round)) feedback.push('tech');
      for (const f of feedback.slice(s.feedback.length)) log('feedback', f);
      log('test', { round: s.rounds.length, satisfied, worse });
      return go('test', {
        rounds: [...s.rounds, round],
        feedback: [...new Set(feedback)],
        draft: { slots: { ...slots }, links: { ...links } },
      });
    }

    case 'revise': {
      if (!at('test')) return no('wrong_stage');
      if (s.rounds.length >= MAX_ROUNDS) return no('revise_limit');
      // 이유 = 직전 테스트의 부분·불만 NPC. 전원 만족이면 테스트에 나온 아무 NPC
      const last = s.rounds[s.rounds.length - 1].reactions;
      const tested = Object.keys(last) as NpcId[];
      const unmet = tested.filter((n) => last[n] !== 'happy');
      if (!a.reason || !(unmet.length ? unmet : tested).includes(a.reason)) return no('no_reason');
      log('revise', a.reason);
      return go('revise', { draft: { ...s.draft, reason: a.reason } });
    }

    case 'reflect': {
      if (!at('reflect')) return no('wrong_stage');
      const ids = [...a.good, ...a.fix, ...a.praise.map((p) => p.element)];
      if (!ids.every(isElement) || !a.praise.every((p) => SAMPLES.some((sm) => sm.id === p.sampleId))) return no('unknown_id');
      log('reflect', { good: a.good, fix: a.fix, praise: a.praise.map((p) => [p.sampleId, p.element]) });
      return done({ reflect: { good: [...a.good], fix: [...a.fix], praise: a.praise.map((p) => ({ ...p })) } });
    }

    case 'finish': {
      if (!at('reflect')) return no('wrong_stage');
      const { good, fix, praise } = s.reflect;
      if (!good.length || !fix.length || !SAMPLES.every((sm) => praise.some((p) => p.sampleId === sm.id))) return no('reflect_incomplete');
      return go('result');
    }
  }
}
