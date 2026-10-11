import { PRODUCTS } from '../content/products';
import type { ColorFill, PartNo, PartId, SlotId } from '../content/types';
import { partOf } from '../engine/judge';
import { score } from '../engine/score';
import { ANCHORS, type Anchor } from './previewLayout';
import { useGame } from './store';

const kit = (id: string) => `./assets/kit/${id}.png`;
// 표시 부품(빈 판) 위 글자는 DOM 으로 얹는다. 색띠 테두리는 판이 아니라 글자 없음
const LABEL_TEXT: Record<string, string> = { locker: '12', door: '5학년 1반' };
const NO_TEXT = ['door-label-4'];

const fill = (f: ColorFill) => (f.kind === 'solid' ? { background: `var(--${f.token})` } : { backgroundImage: `url(${kit(f.assetId)})` });
const box = (a: Anchor) => ({ left: `${(a.x - a.s / 2) * 100}%`, top: `${(a.y - a.s / 2) * 100}%`, width: `${a.s * 100}%`, height: `${a.s * 100}%` });

// 형태 그림 위에 기능A·B 를 앵커 자리에, 소재·색은 형태 알파를 마스크로 쓴 multiply 레이어. DOM 순서 = 겹침 순서
function Art({ slots }: { slots: Partial<Record<SlotId, PartId>> }) {
  const { state } = useGame();
  const product = state.product!;
  const form = slots.form && partOf(slots.form);
  const at = ANCHORS[product][(form ? Number(form.id.split('-')[2]) : 1) as PartNo];
  const mask = form ? { maskImage: `url(${kit(form.assetId!)})`, WebkitMaskImage: `url(${kit(form.assetId!)})` } : {};
  const func = (slot: 'funcA' | 'funcB') => {
    const p = slots[slot] && partOf(slots[slot]!);
    if (!p?.assetId) return null;
    const text = slot === 'funcB' && !NO_TEXT.includes(p.assetId) && LABEL_TEXT[product];
    return (
      <div class={`pv-part ${slot}`} style={box(at[slot])}>
        <img src={kit(p.assetId)} alt="" />
        {text && <span class="pv-text jua">{text}</span>}
      </div>
    );
  };
  const material = slots.material && partOf(slots.material).assetId;
  const color = slots.color && partOf(slots.color).color;
  const names = Object.values(slots).map((id) => partOf(id!).name).join(', ');
  return (
    <div class="pv-art" role="img" aria-label={names ? `미리보기: ${names}` : '미리보기: 아직 고른 부품이 없어요'}>
      {form && <img class="pv-form" src={kit(form.assetId!)} alt="" />}
      {func('funcA')}
      {func('funcB')}
      {form && material && <div class="pv-mask material" style={{ ...mask, backgroundImage: `url(${kit(material)})` }} />}
      {form && color && <div class="pv-mask color" style={{ ...mask, ...fill(color) }} />}
    </div>
  );
}

// 게이지 3: 직전 테스트 결과. 테스트 전엔 빈 트랙
function Gauge({ icon, name, pct, label }: { icon: string; name: string; pct: number | null; label: string }) {
  return (
    <div class="row-gauge">
      <span><img class="icon" src={kit(icon)} width={24} height={24} alt="" /> {name}</span>
      <span class="k-track">{!!pct && <span class="k-fill" style={{ width: `${pct}%` }} />}</span>
      <span>{label}</span>
    </div>
  );
}

export function Preview() {
  const { state } = useGame();
  const p = PRODUCTS[state.product!];
  const r = state.rounds.length;
  const last = state.rounds[r - 1];
  const sc = last && score(p.id, last);
  const n = last ? Object.keys(last.reactions).length : 0;
  return (
    <section class="k-panel preview" aria-label={`내 ${p.name}`}>
      <div class="ph">
        <span class="jua h"><img class="icon" src={kit(p.icon)} width={28} height={28} alt="" /> 내 {p.name}</span>
        <span class="sm">{r + 1}차 · 수정 {r}/2</span>
      </div>
      <Art slots={state.draft.slots} />
      <div class="gauges" aria-label={last ? '직전 테스트 결과' : '테스트 전'}>
        <Gauge icon="icon-access" name="누구나 편리" pct={sc ? sc.access : null} label={last ? `${last.satisfied}/${n}` : '–'} />
        <Gauge icon="icon-purpose" name="목적" pct={sc ? sc.purpose : null} label={sc ? `${sc.purpose / 20}/5` : '–'} />
        <Gauge icon="icon-eco" name="환경" pct={sc ? sc.eco : null} label={sc ? String(sc.eco) : '–'} />
      </div>
    </section>
  );
}
