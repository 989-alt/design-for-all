// 콘텐츠 정본 타입. 엔진(T03)·UI 가 import 한다. 값 로직은 두지 않는다.

export type NpcId = 'seoyun' | 'dohyun' | 'hajun' | 'jian' | 'haeun' | 'grandma';
export type CardId =
  | 'C01' | 'C02' | 'C03' | 'C04' | 'C05' | 'C06' | 'C07' | 'C08' | 'C09'
  | 'C10' | 'C11' | 'C12' | 'C13' | 'C14' | 'C15' | 'C16' | 'C17';
export type ProductId = 'desk' | 'locker' | 'door';
export type SlotId = 'form' | 'funcA' | 'funcB' | 'material' | 'color';
export type PartNo = 1 | 2 | 3 | 4;
export type PartId = `${ProductId}-${SlotId}-${PartNo}`;
export type ElementId = 'purpose' | 'tech' | 'function' | 'beauty' | 'access' | 'eco';
export type ReactionKind = 'happy' | 'partial' | 'unhappy';

export interface Npc {
  id: NpcId;
  name: string;
  trait: string;
  portrait: Record<ReactionKind, string>; // kit 에셋 id
}

export interface TroubleCard {
  id: CardId;
  npc: NpcId; // 누가
  product: ProductId;
  where: string; // 어디서
  what: string; // 무엇이
  reactions: Record<ReactionKind, string>; // {part} 자리에 부품 이름
}

// 색 슬롯: 단색은 tokens.css 변수 이름, 무늬는 타일 에셋
export type ColorToken = 'muted' | 'secondary' | 'primary' | 'surface-classroom';
export type ColorFill = { kind: 'solid'; token: ColorToken } | { kind: 'tile'; assetId: string };

export interface Part {
  id: PartId;
  slot: SlotId;
  name: string;
  assetId: string | null; // 색 부품은 null, 대신 color
  color?: ColorFill;
  solves: CardId[]; // full
  partial: CardId[];
  worse: CardId[];
  tech: boolean;
  eco: 'full' | 'half' | 'none';
}

export interface Product {
  id: ProductId;
  name: string;
  icon: string;
  slotNames: Record<SlotId, string>;
  parts: Record<SlotId, [Part, Part, Part, Part]>;
}

// 키 = 형태·색·소재 부품 번호 (예 '231' = 형태2·색3·소재1)
export type HarmonyKey = `${PartNo}${PartNo}${PartNo}`;
export type Harmony = Record<HarmonyKey, 0 | 50 | 100>;

export interface CaseCard {
  id: string;
  title: string;
  main: ElementId;
  sub: ElementId[];
  back: string;
  assetId: string;
}

export type RefKind = 'popular' | 'original' | 'mobility' | 'tech';
export interface RefCard {
  id: string;
  kind: RefKind;
  title: string;
  desc: string;
  usableFor: CardId[];
  assetId: string;
}

export interface Sample {
  id: string;
  title: string;
  desc: string;
  praise: Record<ElementId, string>; // 까닭 조각 — 「주어 · 요소 이름 · 까닭」 조립용
  assetId: string;
}

export interface Feedback {
  id: 'fb-bus' | 'fb-tech';
  title: string;
  lines: string[];
  assetId: string;
}

export interface DesignElement {
  id: ElementId;
  name: string;
  desc: string;
  icon: string;
}
