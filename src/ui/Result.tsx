import { useEffect, useRef, useState } from 'preact/hooks';
import { CASES } from '../content/cases';
import { NPCS } from '../content/npcs';
import { PRODUCTS } from '../content/products';
import type { NpcId, PartId, PartNo, ProductId, SlotId } from '../content/types';
import { firstCorrectCount } from '../engine/export';
import { npcsFor, partOf, SLOTS } from '../engine/judge';
import { clear } from '../engine/save';
import { score, type Scores } from '../engine/score';
import { initState } from '../engine/state';
import { verdict } from '../engine/verdict';
import { anchorOf } from './previewLayout';
import { Hud } from './Progress';
import { Radar, radarOuter, radarPoints } from './Radar';
import { hydrate, useGame } from './store';
import '../styles/result.css';

const kit = (id: string) => `./assets/kit/${id}.png`;
const GRADE = { master: ['badge-gold', '모두의 디자이너'], care: ['badge-silver', '배려 디자이너'], apprentice: ['badge-bronze', '견습 디자이너'] } as const;
// Preview.tsx 의 판 글자 표와 같다(Preview 는 T05 소유라 여기 다시 둔다)
const LABEL_TEXT: Record<string, string> = { locker: '12', door: '5학년 1반' };
const NO_TEXT = ['door-label-3', 'door-label-4', 'locker-label-4'];

const cssVar = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
const img = (src: string) =>
  new Promise<HTMLImageElement>((ok, no) => {
    const i = new Image();
    i.onload = () => ok(i);
    i.onerror = no;
    i.src = src;
  });
type G = CanvasRenderingContext2D;
const contain = (g: G, im: HTMLImageElement, x: number, y: number, w: number, h: number) => {
  const k = Math.min(w / im.naturalWidth, h / im.naturalHeight);
  g.drawImage(im, x + (w - im.naturalWidth * k) / 2, y + (h - im.naturalHeight * k) / 2, im.naturalWidth * k, im.naturalHeight * k);
};

// Preview 와 같은 레이어를 canvas 한 변 S 에 차례로: 형태 < 소재·색(무늬를 깔고 형태 알파로 자른 뒤 multiply) < 기능A < 기능B < 판 글자
async function drawProduct(g: G, product: ProductId, slots: Record<SlotId, PartId>, S: number) {
  const form = partOf(slots.form);
  const no = Number(form.id.slice(-1)) as PartNo;
  const shape = await img(kit(form.assetId!));
  g.fillStyle = cssVar('--surface-slot');
  g.fillRect(0, 0, S, S);
  contain(g, shape, 0, 0, S, S);
  const tint = (paint: string | HTMLImageElement, alpha: number) => {
    const o = document.createElement('canvas');
    o.width = o.height = S;
    const og = o.getContext('2d')!;
    if (typeof paint === 'string') {
      og.fillStyle = paint;
      og.fillRect(0, 0, S, S);
    } else {
      const w = S / 4, h = (w * paint.naturalHeight) / paint.naturalWidth; // studio.css background-size:25%
      for (let y = 0; y < S; y += h) for (let x = 0; x < S; x += w) og.drawImage(paint, x, y, w, h);
    }
    og.globalCompositeOperation = 'destination-in';
    contain(og, shape, 0, 0, S, S);
    g.save();
    g.globalAlpha = alpha;
    g.globalCompositeOperation = 'multiply';
    g.drawImage(o, 0, 0);
    g.restore();
  };
  const material = partOf(slots.material).assetId;
  if (material) tint(await img(kit(material)), 0.8);
  const color = partOf(slots.color).color;
  if (color) tint(color.kind === 'solid' ? cssVar(`--${color.token}`) : await img(kit(color.assetId)), 0.65);
  for (const slot of ['funcA', 'funcB'] as const) {
    const p = partOf(slots[slot]);
    if (!p.assetId) continue;
    const a = anchorOf(product, no, slot, p.id);
    contain(g, await img(kit(p.assetId)), (a.x - a.s / 2) * S, (a.y - a.s / 2) * S, a.s * S, a.s * S);
  }
  const label = partOf(slots.funcB).assetId;
  const text = label && !NO_TEXT.includes(label) && LABEL_TEXT[product];
  if (text) {
    const a = anchorOf(product, no, 'funcB', slots.funcB);
    g.font = `400 ${a.s * S * (product === 'door' ? 0.14 : 0.24)}px ${cssVar('--font-display')}`;
    g.fillStyle = cssVar('--foreground');
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(text, a.x * S, a.y * S);
  }
}

// kit.css .k-panel 과 같은 9-slice: 원본 자름 50 60 70 50(위·오른·아래·왼) → 테두리 25 30 35 25, 가운데 채움
function frame(g: G, im: HTMLImageElement, W: number, H: number) {
  const sx = [0, 50, im.naturalWidth - 60, im.naturalWidth], sy = [0, 50, im.naturalHeight - 70, im.naturalHeight];
  const dx = [0, 25, W - 30, W], dy = [0, 25, H - 35, H];
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++) g.drawImage(im, sx[i], sy[j], sx[i + 1] - sx[i], sy[j + 1] - sy[j], dx[i], dy[j], dx[i + 1] - dx[i], dy[j + 1] - dy[j]);
}

// 결과 카드 영역만 canvas 에 2배로 다시 그린다: 패널 틀·레이더 면·그림(제품 미리보기 canvas 포함)·글자(DOM 에 보이는 그대로)
async function saveCard(card: HTMLElement, sc: Scores, seed: number) {
  const box = card.getBoundingClientRect();
  const k = card.offsetWidth / box.width; // 무대 축소를 되돌린다
  const [W, H] = [card.offsetWidth, card.offsetHeight];
  const c = document.createElement('canvas');
  c.width = W * 2;
  c.height = H * 2;
  const g = c.getContext('2d')!;
  g.scale(2, 2);
  const xy = (r: DOMRect) => [(r.left - box.left) * k, (r.top - box.top) * k, r.width * k, r.height * k] as const;
  frame(g, await img(kit('panel')), W, H);
  const [ax, ay, aw, ah] = xy(card.querySelector('.radar')!.getBoundingClientRect());
  for (const [pts, color, alpha] of [[radarOuter, '--border', 0.3], [radarPoints(sc), '--primary', 0.35]] as const) {
    g.globalAlpha = alpha;
    g.fillStyle = cssVar(color);
    g.beginPath();
    pts.forEach(([x, y]) => g.lineTo(ax + x * aw, ay + y * ah));
    g.fill();
  }
  g.globalAlpha = 1;
  card.querySelectorAll<HTMLImageElement | HTMLCanvasElement>('img, canvas').forEach((el) => {
    if (el instanceof HTMLCanvasElement || el.naturalWidth) g.drawImage(el, ...xy(el.getBoundingClientRect()));
  });
  const walk = document.createTreeWalker(card, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  g.textBaseline = 'middle';
  for (let n = walk.nextNode(); n; n = walk.nextNode()) {
    const text = n.textContent!;
    if (!text.trim()) continue;
    const st = getComputedStyle(n.parentElement!);
    g.font = `${st.fontWeight} ${st.fontSize} ${st.fontFamily}`;
    g.fillStyle = st.color;
    range.selectNodeContents(n);
    // 한 줄이면 통째로, 줄이 바뀐 글은 글자마다 제자리에
    const pieces = range.getClientRects().length > 1 ? [...text].map((_, i) => [i, i + 1]) : [[0, text.length]];
    for (const [s, e] of pieces) {
      range.setStart(n, s);
      range.setEnd(n, e);
      const [x, y, w, h] = xy(range.getBoundingClientRect());
      if (w) g.fillText(text.slice(s, e), x, y + h / 2);
    }
  }
  const b = await new Promise<Blob | null>((ok) => c.toBlob(ok, 'image/png'));
  if (!b) return false;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(b);
  a.download = `design-card-${seed}.png`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  return true;
}

// 화면 10 결과: 디자인 카드(제목·등급·만족·제품·레이더) + 확인하기 3 + 수정 이력 + PNG 저장·처음으로
export function Result() {
  const { state } = useGame();
  const card = useRef<HTMLElement>(null);
  const pv = useRef<HTMLCanvasElement>(null);
  const [fail, setFail] = useState(false);
  const p = PRODUCTS[state.product!];
  const last = state.rounds[state.rounds.length - 1];
  const n = npcsFor(p.id).length;
  const sc = score(p.id, last);
  const vd = verdict(state);
  const [badge, gradeName] = GRADE[vd.grade];
  const firstOk = firstCorrectCount(state);
  // PRD §5 ㉒ 확인하기 3항목
  const checks = [
    ['요소와 과정을 알아요', firstOk >= 5, `사례 첫 정답 ${firstOk}/${CASES.length}`],
    ['누구나 편리하게 고쳤어요', vd.S1, `만족 ${last.satisfied}/${n}명`],
    ['고쳐 보았어요', state.rounds.length > 1, `수정 ${state.rounds.length - 1}번`],
  ] as const;
  const npcName = (id: string) => NPCS.find((x) => x.id === id)!.name;

  useEffect(() => {
    const g = pv.current!.getContext('2d')!;
    g.scale(2, 2);
    drawProduct(g, p.id, last.slots, 180).catch(() => {});
  }, []);

  const onSave = () => saveCard(card.current!, sc, state.seed).then((ok) => setFail(!ok), () => setFail(true));

  return (
    <div class="stage studio result">
      <Hud />
      <section class="k-panel rcard" ref={card} aria-label="디자인 카드">
        <p class="gtitle sm">모두의 교실 디자인 스튜디오</p>
        <div class="rhead">
          <img src={kit(badge)} width={96} height={96} alt="" />
          <div>
            <p class="jua grade">{gradeName}</p>
            <p class="sat">내 {p.name} · 만족 {last.satisfied}/{n}명</p>
          </div>
          <canvas class="rprod" ref={pv} width={360} height={360} role="img"
            aria-label={`내 ${p.name}: ${SLOTS.map((s) => partOf(last.slots[s]).name).join(', ')}`} />
        </div>
        <Radar sc={sc} />
      </section>
      <div class="rcol">
        <section class="k-panel checks" aria-labelledby="checks-h">
          <h2 id="checks-h" class="jua">확인하기</h2>
          <ul>
            {checks.map(([label, ok, note]) => (
              <li>
                <img class="icon" src={kit(ok ? 'icon-check' : 'icon-face-partial')} width={28} height={28} alt="" />
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
            {state.rounds.map((r, i) => {
              const prev = state.rounds[i - 1];
              return (
                <li>
                  <b>{i === 0 ? '처음' : `수정 ${i}`}</b> 만족 {r.satisfied}/{n}명
                  {r.reason && <span class="sm"> · {npcName(r.reason)}의 말을 듣고 고침</span>}
                  {prev && SLOTS.filter((s) => prev.slots[s] !== r.slots[s]).map((s) => (
                    <span class="sm line">{p.slotNames[s]}: {partOf(prev.slots[s]).name} → {partOf(r.slots[s]).name}</span>
                  ))}
                  {(Object.entries(r.worse) as [NpcId, PartId][]).map(([npc, part]) => (
                    <span class="sm line">✗ {partOf(part).name}({npcName(npc)})</span>
                  ))}
                </li>
              );
            })}
          </ol>
        </section>
        <p class="msg" aria-live="polite">{fail ? '그림을 만들지 못했어요. 다시 눌러 보세요' : ''}</p>
        <div class="rbtns">
          <button class="k-btn" onClick={onSave}>
            <span class="lbl jua"><span>그림으로 저장</span></span>
          </button>
          <button class="k-btn paper" onClick={() => (clear(), hydrate(initState()))}>
            <span class="lbl jua"><span>처음으로</span></span>
          </button>
        </div>
      </div>
    </div>
  );
}
