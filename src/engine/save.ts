// 중단 복구 저장본(PRD §9). 상태가 바뀔 때마다 통째로 쓴다. 손상·옛 판은 없는 것으로 본다
import { CARDS } from '../content/cards';
import { CASES } from '../content/cases';
import { ELEMENTS } from '../content/elements';
import { NPCS } from '../content/npcs';
import { PRODUCTS } from '../content/products';
import { REFERENCES } from '../content/references';
import { SAMPLES } from '../content/samples';
import { SLOTS } from './judge';
import type { GameState, Stage } from './types';

export const SAVE_KEY = 'dfa.save.v1';
const STAGES: Stage[] = ['cases', 'classroom', 'pick', 'research', 'design', 'test', 'revise', 'reflect', 'result'];

export function save(s: GameState) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ v: 1, state: s }));
  } catch {
    /* 용량 초과·저장 막힘: 저장 없이 계속 논다 */
  }
}

const arr = Array.isArray;
const obj = (o: unknown): boolean =>!!o && typeof o === 'object';
const at = (s: GameState, from: Stage) => STAGES.indexOf(s.stage) >= STAGES.indexOf(from);

// 어느 단계든 화면들이 읽는 필드가 다 있어야 그 단계로 복원한다. 조사부터는 제품, 테스트부터는 라운드 1개 이상
const shapeOk = (s: GameState) =>
  [s.tags, s.collected, s.log, s.npcOrder, s.refOrder, s.research, s.feedback, s.rounds].every(arr)
  && obj(s.draft) && obj(s.draft.slots) && obj(s.draft.links)
  && s.rounds.every((r) => obj(r) && obj(r.slots) && obj(r.links) && obj(r.reactions) && obj(r.lines) && obj(r.worse) && typeof r.satisfied === 'number')
  && ['good', 'fix', 'praise'].every((k) => arr(s.reflect?.[k as 'good']))
  && (!at(s, 'research') || (typeof s.product === 'string' && Object.prototype.hasOwnProperty.call(PRODUCTS, s.product)))
  && (!at(s, 'test') || s.rounds.length >= 1);

// 안에 든 id 가 콘텐츠 표에 있어야 한다 — 없는 id 는 화면이 표를 찾다 undefined 로 죽는다.
// 콘텐츠 id(부품·카드·NPC·사례·참고·견본)를 바꾸거나 지우면 SAVE_KEY·v 를 올려 옛 저장본을 버린다
const ids = (xs: { id: string }[]) => new Set(xs.map((x) => x.id));
const CARD = ids(CARDS), CASE = ids(CASES), ELEM = ids(ELEMENTS), NPC = ids(NPCS), REF = ids(REFERENCES), SAMPLE = ids(SAMPLES);
const PART = ids(Object.values(PRODUCTS).flatMap((p) => Object.values(p.parts).flat()));
const SLOT = new Set<string>(SLOTS);
const of = (set: Set<string>) => (x: unknown) => typeof x === 'string' && set.has(x);
const all = (a: unknown, ok: (x: any) => boolean) => arr(a) && a.every(ok);
const rec = (o: unknown, ok: (k: string, v: unknown) => boolean) => obj(o) && Object.entries(o as object).every(([k, v]) => ok(k, v));
const cardOrNull = (x: unknown) => x === null || of(CARD)(x);
const optNpc = (x: unknown) => x === undefined || of(NPC)(x);

const contentOk = (s: GameState) => {
  const slots = (o: unknown) => rec(o, (k, v) => of(PART)(v) && (v as string).startsWith(`${s.product}-${k}-`));
  const links = (o: unknown) => rec(o, (k, v) => SLOT.has(k) && cardOrNull(v));
  const byNpc = (o: unknown, ok: (v: unknown) => boolean) => rec(o, (k, v) => NPC.has(k) && ok(v));
  return typeof s.seed === 'number'
    && all(s.tags, (t) => obj(t) && of(CASE)(t.caseId) && all(t.tried, of(ELEM)) && typeof t.correct === 'boolean')
    && all(s.collected, of(CARD)) && all(s.npcOrder, of(NPC)) && all(s.refOrder, of(REF))
    && all(s.research, (r) => obj(r) && of(REF)(r.refId) && cardOrNull(r.cardId))
    && all(s.feedback, (x) => x === 'bus' || x === 'tech')
    && all(s.log, (l) => obj(l) && typeof l.e === 'string' && (!['part', 'link'].includes(l.e) || obj(l.d))) // Slot 이 d.slotId 를 읽는다
    && slots(s.draft.slots) && links(s.draft.links) && optNpc(s.draft.reason)
    && s.rounds.every((r) => SLOTS.every((k) => k in r.slots) && slots(r.slots) && links(r.links)
      && byNpc(r.reactions, of(new Set(['happy', 'partial', 'unhappy']))) && byNpc(r.lines, (v) => typeof v === 'string')
      && byNpc(r.worse, of(PART)) && optNpc(r.reason))
    && all(s.reflect.good, of(ELEM)) && all(s.reflect.fix, of(ELEM))
    && all(s.reflect.praise, (p) => obj(p) && of(SAMPLE)(p.sampleId) && of(ELEM)(p.element) && typeof p.line === 'string');
};

export function load(): GameState | null {
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY) ?? 'null');
    if (s?.v !== 1 || s.state?.v !== 1 || !STAGES.includes(s.state.stage)) return null;
    return shapeOk(s.state) && contentOk(s.state) ? s.state : null;
  } catch {
    return null;
  }
}

// 저장소가 막혀도 던지지 않는다 — 처음으로·오류 복구가 이어서 타이틀로 가야 한다
export function clear() {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    /* 지울 수 없으면 그대로 둔다 */
  }
}
