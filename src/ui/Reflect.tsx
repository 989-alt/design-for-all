import { useState } from 'preact/hooks';
import { ELEMENTS } from '../content/elements';
import { SAMPLES } from '../content/samples';
import type { ElementId, Sample } from '../content/types';
import { reduce } from '../engine/state';
import { Hud } from './Progress';
import { advance, useGame } from './store';
import '../styles/result.css';

type Draft = Record<string, { element?: ElementId; reason?: string }>;
const kit = (id: string) => `./assets/kit/${id}.png`;
const nameOf = (id: ElementId) => ELEMENTS.find((e) => e.id === id)!.name;
const flip = (list: ElementId[], id: ElementId) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
const lineOf = (sm: Sample, element: ElementId, reason: string) => `${sm.title} — ${nameOf(element)}: ${reason} 좋아요.`;

// 요소 칩: 고르면 요소 아이콘 옆에 체크 아이콘이 붙는다(색만으로 표시하지 않음)
function Chip({ id, on, onClick, label }: { id: ElementId; on: boolean; onClick: () => void; label: string }) {
  const e = ELEMENTS.find((x) => x.id === id)!;
  return (
    <button class="tag" aria-pressed={on} aria-label={`${label}: ${e.name}`} onClick={onClick}>
      <span class={`k-chip${on ? ' on' : ''}`}>
        <span class="lbl sm">
          <span>
            {on && <img class="icon" src={kit('icon-check')} width={20} height={20} alt="" />}
            <img class="icon" src={kit(e.icon)} width={20} height={20} alt="" /> {e.name}
          </span>
        </span>
      </span>
    </button>
  );
}

// 화면 9 돌아보기: 잘한 점·아쉬운 점 태그 + 샘플 2 칭찬(주어·요소·까닭 세 칸)
export function Reflect() {
  const { state, dispatch } = useGame();
  const { good, fix, praise } = state.reflect;
  const [draft, setDraft] = useState<Draft>(() =>
    Object.fromEntries(praise.map((p) => {
      const sm = SAMPLES.find((x) => x.id === p.sampleId)!;
      return [p.sampleId, { element: p.element, reason: Object.values(sm.praise).find((r) => p.line === lineOf(sm, p.element, r)) }];
    })),
  );

  // 바뀔 때마다 엔진에 보낸다(자동 저장). 세 칸이 다 찬 칭찬만 넘긴다
  const send = (g: ElementId[], f: ElementId[], d: Draft) =>
    dispatch({
      type: 'reflect', good: g, fix: f,
      praise: SAMPLES.flatMap((sm) => {
        const { element, reason } = d[sm.id] ?? {};
        return element && reason ? [{ sampleId: sm.id, element, line: lineOf(sm, element, reason) }] : [];
      }),
    });
  const pick = (sampleId: string, patch: Draft[string]) => {
    const d = { ...draft, [sampleId]: { ...draft[sampleId], ...patch } };
    setDraft(d);
    send(good, fix, d);
  };

  const block = reduce(state, { type: 'finish' }).rejected;
  return (
    <div class="stage studio reflect">
      <Hud />
      <div class="rbody">
      <section class="k-panel thin tags" aria-label="내 디자인 돌아보기">
        {([['잘한 점', good, (l: ElementId[]) => send(l, fix, draft)], ['아쉬운 점', fix, (l: ElementId[]) => send(good, l, draft)]] as const).map(([label, list, set]) => (
          <div class="tag-row" role="group" aria-label={label}>
            <b>{label}</b>
            {ELEMENTS.map((e) => <Chip id={e.id} label={label} on={list.includes(e.id)} onClick={() => set(flip(list, e.id))} />)}
          </div>
        ))}
        <p class="msg" aria-live="polite">{block ? '태그 하나씩, 칭찬 2개를 채워요' : ''}</p>
        <button class="k-btn coral done" aria-disabled={block ? 'true' : undefined} onClick={() => advance('reflect', { type: 'finish' })}>
          <span class="lbl jua"><span>다 했어요</span></span>
        </button>
      </section>
      <div class="samples">
        {SAMPLES.map((sm) => {
          const { element, reason } = draft[sm.id] ?? {};
          return (
            <section class="k-panel thin sample" aria-labelledby={`${sm.id}-h`}>
              <img class="sample-art" src={kit(sm.assetId)} alt="" />
              <div>
                <h3 id={`${sm.id}-h`} class="jua">{sm.title}</h3>
                <p class="sm desc">{sm.desc}</p>
                <div class="tag-row" role="group" aria-label={`${sm.title} 칭찬할 요소`}>
                  {ELEMENTS.map((e) => <Chip id={e.id} label="칭찬할 요소" on={element === e.id} onClick={() => pick(sm.id, { element: e.id })} />)}
                </div>
                <div class="reasons" role="group" aria-label={`${sm.title} 까닭`}>
                  {Object.values(sm.praise).map((r) => (
                    <button class={`k-btn paper${reason === r ? ' pressed' : ''}`} aria-pressed={reason === r} onClick={() => pick(sm.id, { reason: r })}>
                      <span class="lbl sm"><span>{reason === r && <img class="icon" src={kit('icon-check')} width={18} height={18} alt="" />} {r}</span></span>
                    </button>
                  ))}
                </div>
                <p class="sentence" aria-live="polite">
                  <span class="slot">{sm.title}</span> — <span class="slot">{element ? nameOf(element) : '요소 ?'}</span>:{' '}
                  <span class="slot">{reason ?? '까닭 ?'}</span> 좋아요.
                </p>
              </div>
            </section>
          );
        })}
      </div>
      </div>
    </div>
  );
}
