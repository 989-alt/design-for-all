import type { Npc, NpcId } from './types';

const npc = (id: NpcId, name: string, trait: string): Npc => ({
  id,
  name,
  trait,
  portrait: { happy: `npc-${id}`, partial: `npc-partial-${id}`, unhappy: `npc-unhappy-${id}` },
});

export const NPCS: Npc[] = [
  npc('seoyun', '서윤', '휠체어를 타요'),
  npc('dohyun', '도현', '키가 커요'),
  npc('hajun', '하준', '팔에 깁스를 했어요'),
  npc('jian', '지안', '눈이 잘 안 보여요'),
  npc('haeun', '하은', '도우미 활동을 온 1학년이에요'),
  npc('grandma', '할머니', '손목과 무릎이 아픈 손님이에요'),
];
