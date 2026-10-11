// 글자 크게·고대비·소리 토글(HUD 도구 버튼). html 속성과 localStorage 를 맞춘다. 소리는 기본 켬
export const KEY = 'dfa.pref';
export type Pref = { text?: 'large'; contrast?: 'high'; sound?: 'off' };

export function readPref(): Pref {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}');
  } catch {
    return {};
  }
}

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
