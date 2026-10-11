import type { FunctionComponent } from 'preact';
import { useEffect } from 'preact/hooks';
import type { Stage } from './engine/types';
import { Cases } from './ui/Cases';
import { Classroom } from './ui/Classroom';
import { Pick } from './ui/Pick';
import { applyPref } from './ui/pref';
import { Hud } from './ui/Progress';
import { Research } from './ui/Research';
import { getState, useGame } from './ui/store';
import { Studio } from './ui/Studio';
import { Test } from './ui/Test';
import { Title } from './ui/Title';
import './styles/ui.css';

const SCREENS: Partial<Record<Stage, FunctionComponent>> = { title: Title, cases: Cases, classroom: Classroom, pick: Pick, research: Research, design: Studio, test: Test, revise: Studio };
// 돌아보기 이후 화면은 T06~ 에서 채운다
const Later = () => <div class="stage studio"><Hud /></div>;

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
