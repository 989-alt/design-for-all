import type { FunctionComponent } from 'preact';
import { useEffect } from 'preact/hooks';
import type { Stage } from './engine/types';
import { Cases } from './ui/Cases';
import { Classroom } from './ui/Classroom';
import { Pick } from './ui/Pick';
import { Hud } from './ui/Progress';
import { Research } from './ui/Research';
import { getState, useGame } from './ui/store';
import { Title } from './ui/Title';
import './styles/ui.css';

const SCREENS: Partial<Record<Stage, FunctionComponent>> = { title: Title, cases: Cases, classroom: Classroom, pick: Pick, research: Research };
// 조립대 이후 화면은 T05~ 에서 채운다
const Later = () => <div class="stage studio"><Hud /></div>;

const KEY = 'dfa.pref';
type Pref = { text?: 'large'; contrast?: 'high' };

function readPref(): Pref {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}');
  } catch {
    return {};
  }
}

// 글자 크게·고대비 토글(Progress 의 HUD 도구 버튼). html 속성과 localStorage 를 맞춘다
export function applyPref(next: Pref) {
  const pref = { ...readPref(), ...next };
  const root = document.documentElement;
  for (const [k, v] of [['text', pref.text], ['contrast', pref.contrast]] as const) {
    if (v) root.dataset[k] = v;
    else delete root.dataset[k];
  }
  try {
    localStorage.setItem(KEY, JSON.stringify(pref));
  } catch {
    /* 저장 불가여도 화면은 동작한다 */
  }
}

function fitStage() {
  const s = Math.min(innerWidth / 1280, innerHeight / 800);
  document.documentElement.style.setProperty('--stage-scale', String(s));
}

// 첫 렌더 전에 저장된 토글을 반영해야 HUD 의 aria-pressed 가 맞는다
applyPref({});

// 연타가 새 화면으로 새지 않게: 직전 클릭 뒤 화면이 바뀌었으면 이어진 클릭(detail>1)은 버린다
let clickStage: Stage | null = null;
addEventListener('click', (e) => {
  const now = getState().stage;
  if (e.detail > 1 && clickStage !== now) e.stopPropagation();
  else clickStage = now;
}, true);

export function App() {
  useEffect(() => {
    fitStage();
    addEventListener('resize', fitStage);
    return () => removeEventListener('resize', fitStage);
  }, []);

  const { state } = useGame();
  const Screen = SCREENS[state.stage] ?? Later;
  return (
    <>
      <Screen />
      <div class="rotate-hint">가로 화면으로 돌려 주세요</div>
    </>
  );
}
