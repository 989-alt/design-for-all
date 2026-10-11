// 소리: 첫 입력 뒤 BGM, 상태 변화로 효과음. HUD 안에서 렌더하지만 상태는 모듈에 하나만 둔다(화면이 바뀌어도 이어진다)
import { useEffect } from 'preact/hooks';
import type { BgmName, SfxName } from '../content/assets';
import type { GameState } from '../engine/types';
import { readPref } from './pref';
import { useGame } from './store';

const BGM_VOL = 0.5;
const SFX_VOL = 0.8;
const FADE_MS = 400;
const bgm = new window.Audio();
bgm.loop = true;
bgm.volume = 0;
const sfx = new Map<SfxName, HTMLAudioElement | null>(); // null = 파일 없음
let started = false; // 첫 pointerdown/keydown 을 받았나
let want: BgmName = 'bgm-studio';
let warned = false;
let fade: ReturnType<typeof setInterval> | undefined;

const on = () => readPref().sound !== 'off';
const warn = (name: string) => {
  if (!warned) console.warn(`소리 파일 없음(무시): ${name}`);
  warned = true;
};

function ramp(to: number, done?: () => void) {
  clearInterval(fade);
  const step = (to - bgm.volume) / (FADE_MS / 50);
  fade = setInterval(() => {
    const v = bgm.volume + step;
    bgm.volume = Math.min(1, Math.max(0, Math.abs(v - to) <= Math.abs(step) ? to : v));
    if (bgm.volume === to) (clearInterval(fade), done?.());
  }, 50);
}

function play() {
  bgm.play().catch(() => {}); // 자동재생이 거부돼도 게임은 진행한다
  ramp(BGM_VOL);
}

function syncBgm() {
  if (!started) return;
  if (!on()) return void (clearInterval(fade), bgm.pause());
  const src = `./assets/bgm/${want}.mp3`;
  if (!bgm.src.endsWith(src.slice(1))) {
    // 짧은 페이드 아웃 → 곡 교체 → 페이드 인
    const swap = () => ((bgm.src = src), play());
    return bgm.paused ? swap() : ramp(0, swap);
  }
  if (bgm.paused) play();
}

export function playSfx(name: SfxName) {
  if (!on()) return;
  let a = sfx.get(name);
  if (a === undefined) {
    a = new window.Audio(`./assets/sfx/${name}.mp3`);
    a.volume = SFX_VOL;
    a.onerror = () => (sfx.set(name, null), warn(name));
    sfx.set(name, a);
  }
  if (a) (a.cloneNode() as HTMLAudioElement).play().catch(() => {}); // 겹쳐 울리게 복제
}

const filled = (s: GameState) => Object.keys(s.draft.slots).length;
const linked = (s: GameState) =>
  Object.values(s.draft.links).filter(Boolean).length + s.research.filter((r) => r.cardId).length;

function onState(p: GameState, s: GameState) {
  want = s.stage === 'result' ? 'bgm-result' : 'bgm-studio';
  syncBgm();
  if (s.stage === 'result' && p.stage !== 'result') playSfx('sfx-grade');
  else if (s.stage === 'revise' && p.stage !== 'revise') playSfx('sfx-revise');
  else if (s.collected.length > p.collected.length) playSfx('sfx-card');
  else if (linked(s) > linked(p)) playSfx('sfx-link');
  else if (filled(s) > filled(p)) playSfx('sfx-snap');
}

let inited = false;
function init() {
  if (inited) return;
  inited = true;
  const first = () => {
    started = true;
    removeEventListener('pointerdown', first, true);
    removeEventListener('keydown', first, true);
    syncBgm();
  };
  addEventListener('pointerdown', first, true);
  addEventListener('keydown', first, true);
}

let prev: GameState | undefined;

export function Audio() {
  const { state } = useGame();
  useEffect(init, []);
  // 화면이 바뀌어 HUD 가 새로 마운트돼도 prev 가 모듈에 남아 있어 변화를 놓치지 않는다
  useEffect(() => {
    if (prev && prev !== state) onState(prev, state);
    prev = state;
  }, [state]);
  syncBgm(); // HUD 소리 토글이 바뀌면 HUD 가 다시 그려지며 여기로 온다
  return null;
}
