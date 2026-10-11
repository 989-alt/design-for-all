import { useRef } from 'preact/hooks';
import { CASES } from '../content/cases';
import { NPCS } from '../content/npcs';
import { PRODUCTS } from '../content/products';
import { npcsFor } from '../engine/judge';
import { clear } from '../engine/save';
import { score, type Scores } from '../engine/score';
import { verdict } from '../engine/verdict';
import { Hud } from './Progress';
import { Radar, radarPoints } from './Radar';
import { useGame } from './store';
import '../styles/result.css';

const kit = (id: string) => `./assets/kit/${id}.png`;
const GRADE = { master: ['badge-gold', '모두의 디자이너'], care: ['badge-silver', '배려 디자이너'], apprentice: ['badge-bronze', '견습 디자이너'] } as const;

// 결과 카드 영역만 canvas 에 다시 그린다: 바탕·레이더 면·그림·글자(DOM 에 보이는 그대로). 색은 토큰 변수에서 읽는다
function saveCard(card: HTMLElement, sc: Scores, seed: number) {
  const box = card.getBoundingClientRect();
  const k = card.offsetWidth / box.width; // 무대 축소를 되돌린다
  const c = document.createElement('canvas');
  c.width = card.offsetWidth;
  c.height = card.offsetHeight;
  const g = c.getContext('2d')!;
  const v = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const xy = (r: DOMRect) => [(r.left - box.left) * k, (r.top - box.top) * k, r.width * k, r.height * k] as const;
  g.fillStyle = v('--card');
  g.fillRect(0, 0, c.width, c.height);
  const [ax, ay, aw, ah] = xy(card.querySelector('.radar-area')!.getBoundingClientRect());
  g.globalAlpha = 0.35;
  g.fillStyle = v('--primary');
  g.beginPath();
  radarPoints(sc).forEach(([x, y]) => g.lineTo(ax + x * aw, ay + y * ah));
  g.fill();
  g.globalAlpha = 1;
  card.querySelectorAll('img').forEach((img) => img.naturalWidth && g.drawImage(img, ...xy(img.getBoundingClientRect())));
  const walk = document.createTreeWalker(card, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  g.textBaseline = 'middle';
  for (let n = walk.nextNode(); n; n = walk.nextNode()) {
    const text = n.textContent!;
    if (!text.trim()) continue;
    range.selectNodeContents(n);
    const [x, y, , h] = xy(range.getBoundingClientRect());
    const st = getComputedStyle(n.parentElement!);
    g.font = `${st.fontWeight} ${st.fontSize} ${st.fontFamily}`;
    g.fillStyle = st.color;
    g.fillText(text, x, y + h / 2);
  }
  c.toBlob((b) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(b!);
    a.download = `design-card-${seed}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });
}

// 화면 10 결과: 디자인 카드(등급·만족·레이더) + 확인하기 3 + 수정 이력 + PNG 저장·처음으로
export function Result() {
  const { state } = useGame();
  const card = useRef<HTMLElement>(null);
  const p = PRODUCTS[state.product!];
  const last = state.rounds[state.rounds.length - 1];
  const n = npcsFor(p.id).length;
  const sc = score(p.id, last);
  const vd = verdict(state);
  const [badge, gradeName] = GRADE[vd.grade];
  const firstOk = CASES.filter((c) => state.tags.find((t) => t.caseId === c.id)?.tried[0] === c.main).length;
  // PRD §5 ㉒ 확인하기 3항목
  const checks = [
    ['요소와 과정을 알아요', firstOk >= 5, `사례 첫 정답 ${firstOk}/${CASES.length}`],
    ['누구나 편리하게 고쳤어요', vd.S1, `만족 ${last.satisfied}/${n}명`],
    ['고쳐 보며 더 좋게 했어요', state.rounds.length > 1, `수정 ${state.rounds.length - 1}번`],
  ] as const;
  const npcName = (id: string) => NPCS.find((x) => x.id === id)!.name;

  return (
    <div class="stage studio result">
      <Hud />
      <section class="k-panel rcard" ref={card} aria-label="디자인 카드">
        <div class="rhead">
          <img src={kit(badge)} width={96} height={96} alt="" />
          <div>
            <p class="jua grade">{gradeName}</p>
            <p class="sat">내 {p.name} · 만족 {last.satisfied}/{n}명</p>
          </div>
        </div>
        <Radar sc={sc} />
      </section>
      <section class="k-panel checks" aria-labelledby="checks-h">
        <h2 id="checks-h" class="jua">확인하기</h2>
        <ul>
          {checks.map(([label, ok, note]) => (
            <li>
              {ok ? <img class="icon" src={kit('icon-check')} width={28} height={28} alt="" /> : <span class="icon-gap" />}
              <span>
                <b>{label}</b> <span class="sm">{ok ? '했어요' : '다음엔 해 봐요'} · {note}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>
      <section class="k-panel history" aria-labelledby="hist-h">
        <h2 id="hist-h" class="jua">수정 이력</h2>
        <ol>
          {state.rounds.map((r, i) => (
            <li>
              <b>{i === 0 ? '처음' : `수정 ${i}`}</b> 만족 {r.satisfied}/{n}명
              {r.reason && <span class="sm"> · {npcName(r.reason)}의 말을 듣고 고침</span>}
            </li>
          ))}
        </ol>
      </section>
      <div class="rbtns">
        <button class="k-btn" onClick={() => saveCard(card.current!, sc, state.seed)}>
          <span class="lbl jua"><span>그림으로 저장</span></span>
        </button>
        <button class="k-btn paper" onClick={() => (clear(), location.reload())}>
          <span class="lbl jua"><span>처음으로</span></span>
        </button>
      </div>
    </div>
  );
}
