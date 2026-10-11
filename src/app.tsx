import type { FunctionComponent } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import type { NpcId } from './content/types';
import { exportResult } from './engine/export';
import { load, save } from './engine/save';
import type { Stage } from './engine/types';
import { Cases } from './ui/Cases';
import { Classroom } from './ui/Classroom';
import { Pick } from './ui/Pick';
import { applyPref } from './ui/pref';
import { Reflect } from './ui/Reflect';
import { Research } from './ui/Research';
import { Result } from './ui/Result';
import { dispatch, getState, useGame } from './ui/store';
import { Studio } from './ui/Studio';
import { Teacher } from './ui/Teacher';
import { Test } from './ui/Test';
import { Title } from './ui/Title';
import './styles/ui.css';

const SCREENS: Record<Stage, FunctionComponent> = { title: Title, cases: Cases, classroom: Classroom, pick: Pick, research: Research, design: Studio, test: Test, revise: Studio, reflect: Reflect, result: Result };
const query = new URLSearchParams(location.search);

if (query.get('e2e') === '1') Object.assign((window as unknown as { __dfa: object }).__dfa, { exportResult: () => exportResult(getState()) });

// 이어하기: store.ts 엔 상태를 갈아끼우는 길이 없다. 타이틀에선 아직 성공한 액션이 없어 store 가 쥔 객체가 initState() 그대로이므로
// 그 객체에 저장본을 덮고, 늘 거부되는 액션 하나로 구독자를 깨운다(거부라 상태는 그대로)
function resume(saved: NonNullable<ReturnType<typeof load>>) {
  Object.assign(getState(), saved);
  dispatch({ type: 'talk', npcId: '' as NpcId });
}

// 타이틀 위에 얹는 이어하기·교사 안내 링크(Title.tsx 는 T04 소유)
function TitleExtra({ onTeacher }: { onTeacher: () => void }) {
  const saved = load();
  return (
    <div class="title-extra">
      {saved && (
        <button class="k-btn resume" onClick={() => resume(saved)}>
          <span class="lbl jua"><span>이어하기</span></span>
        </button>
      )}
      <button class="teacher-link sm" onClick={onTeacher}>교사 안내</button>
    </div>
  );
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
  const [teacher, setTeacher] = useState(query.get('teacher') === '1');
  // 바뀔 때마다 저장. 타이틀(새 판)은 저장하지 않아 이어하기가 저장본 있을 때만 보인다
  useEffect(() => {
    if (state.stage !== 'title') save(state);
  }, [state]);

  if (teacher) return <Teacher onClose={() => setTeacher(false)} />;
  const Screen = SCREENS[state.stage];
  return (
    <>
      <Screen />
      {state.stage === 'title' && <TitleExtra onTeacher={() => setTeacher(true)} />}
      <div class="rotate-hint">가로 화면으로 돌려 주세요</div>
    </>
  );
}
