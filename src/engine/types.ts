// 엔진 상태·액션·거부 사유. 모양은 PRD §9 GameState 를 따른다.
import type { CardId, ElementId, NpcId, PartId, ProductId, ReactionKind, SlotId } from '../content/types';

export type Stage = 'title' | 'cases' | 'classroom' | 'pick' | 'research' | 'design' | 'test' | 'revise' | 'reflect' | 'result';

export interface Round {
  slots: Record<SlotId, PartId>;
  links: Record<SlotId, CardId | null>;
  reactions: Partial<Record<NpcId, ReactionKind>>; // 그 제품 카드가 있는 NPC 만
  lines: Partial<Record<NpcId, string>>; // 반응 대표 한 줄
  satisfied: number;
  worse: Partial<Record<NpcId, PartId>>; // ✗ 로 불만인 NPC → 지목 부품(§4.3)
  reason?: NpcId; // rounds[1..] 수정 이유
}

export interface Praise {
  sampleId: string;
  element: ElementId;
  line: string;
}

export type LogEntry = { t: number; e: string; d?: unknown };

export interface GameState {
  v: 1;
  seed: number;
  stage: Stage;
  startedAt: number;
  npcOrder: NpcId[]; // seed 로 정한 교실 등장 순서
  refOrder: string[]; // seed 로 정한 참고 카드 순서
  tags: { caseId: string; tried: ElementId[]; correct: boolean }[];
  collected: CardId[];
  product: ProductId | null;
  research: { refId: string; cardId: CardId | null }[];
  // 조립대 작업 중인 설계. runTest 때 rounds 로 굳는다
  draft: { slots: Partial<Record<SlotId, PartId>>; links: Partial<Record<SlotId, CardId | null>>; reason?: NpcId };
  rounds: Round[];
  reflect: { good: ElementId[]; fix: ElementId[]; praise: Praise[] };
  feedback: ('bus' | 'tech')[];
  log: LogEntry[];
}

export type Action =
  | { type: 'start'; seed: number }
  | { type: 'tagCase'; caseId: string; elementId: ElementId }
  | { type: 'nextStage' }
  | { type: 'talk'; npcId: NpcId }
  | { type: 'takeCard'; cardId: CardId }
  | { type: 'pickProduct'; productId: ProductId }
  | { type: 'pickRef'; refId: string }
  | { type: 'linkRef'; refId: string; cardId: CardId }
  | { type: 'setPart'; slotId: SlotId; partId: PartId }
  | { type: 'linkPart'; slotId: SlotId; cardId: CardId | null }
  | { type: 'runTest' }
  | { type: 'revise'; reason?: NpcId }
  | { type: 'reflect'; good: ElementId[]; fix: ElementId[]; praise: Praise[] }
  | { type: 'finish' };

export type Reject =
  | 'wrong_stage'
  | 'finished'
  | 'unknown_id'
  | 'already_correct'
  | 'cases_incomplete'
  | 'not_talked'
  | 'already_collected'
  | 'need_more_cards'
  | 'no_product'
  | 'no_product_cards'
  | 'two_refs_max'
  | 'ref_not_picked'
  | 'not_collected'
  | 'need_two_refs'
  | 'bad_part'
  | 'no_part'
  | 'slots_incomplete'
  | 'no_change'
  | 'no_reason'
  | 'revise_limit'
  | 'need_revise'
  | 'reflect_incomplete';

export interface Step {
  state: GameState;
  rejected?: Reject;
  effects?: LogEntry[]; // 이번 액션이 남긴 로그
}
