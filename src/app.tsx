import type { FunctionComponent } from 'preact';
import { useEffect, useErrorBoundary, useState } from 'preact/hooks';
import { exportResult } from './engine/export';
import { clear } from './engine/save';
import { initState } from './engine/state';
import type { Stage } from './engine/types';
import { Cases } from './ui/Cases';
import { Classroom } from './ui/Classroom';
import { Pick } from './ui/Pick';
import { applyPref } from './ui/pref';
import { Reflect } from './ui/Reflect';
import { Research } from './ui/Research';
import { Result } from './ui/Result';
import { getState, hydrate, useGame } from './ui/store';
import { Studio } from './ui/Studio';
import { Teacher } from './ui/Teacher';
import { Test } from './ui/Test';
import { Title } from './ui/Title';
import './styles/ui.css';

const SCREENS: Record<Stage, FunctionComponent<{ onTeacher?: () => void }>> = { title: Title, cases: Cases, classroom: Classroom, pick: Pick, research: Research, design: Studio, test: Test, revise: Studio, reflect: Reflect, result: Result };
const query = new URLSearchParams(location.search);

if (query.get('e2e') === '1') Object.assign((window as unknown as { __dfa: object }).__dfa, { exportResult: () => exportResult(getState()) });

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
  // 오류 경계: 화면이 렌더 중 죽으면(검증을 빠져나간 손상 저장본 등) 저장본을 지우고 타이틀로
  useErrorBoundary(() => {
    clear();
    hydrate(initState());
  });
  const [teacher, setTeacher] = useState(query.get('teacher') === '1');
  if (teacher) return <Teacher onClose={() => setTeacher(false)} />;
  const Screen = SCREENS[state.stage];
  return (
    <>
      <Screen onTeacher={() => setTeacher(true)} />
      <div class="rotate-hint">가로 화면으로 돌려 주세요</div>
    </>
  );
}
