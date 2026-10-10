import { useEffect } from 'preact/hooks';

const KEY = 'dfa.pref';
type Pref = { text?: 'large'; contrast?: 'high' };

function readPref(): Pref {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}');
  } catch {
    return {};
  }
}

// 토글 훅 자리: 버튼은 아직 없다. html 속성과 localStorage 만 맞춘다
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

export function App() {
  useEffect(() => {
    applyPref({});
    fitStage();
    addEventListener('resize', fitStage);
    return () => removeEventListener('resize', fitStage);
  }, []);

  return (
    <>
      <div class="stage studio">
        <header class="hud">
          <div class="k-hud">
            <div class="hud-in">
              <h1 class="jua title">모두의 교실 디자인 스튜디오</h1>
              <button class="k-btn"><span class="lbl jua"><span>시작</span></span></button>
            </div>
          </div>
        </header>
      </div>
      <div class="rotate-hint">가로 화면으로 돌려 주세요</div>
    </>
  );
}
