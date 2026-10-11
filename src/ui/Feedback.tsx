import { useEffect, useRef } from 'preact/hooks';
import { FEEDBACK } from '../content/feedback';

// 오개념 피드백 카드(M1 저상 버스·M3 첨단). 모달 — 닫아야 진행. 포커스는 닫기 버튼 하나에 가둔다
export function Feedback({ id, onClose }: { id: 'bus' | 'tech'; onClose: () => void }) {
  const fb = FEEDBACK.find((f) => f.id === `fb-${id}`)!;
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => ref.current?.focus(), [id]);
  const key = (e: KeyboardEvent) => {
    if (e.key === 'Tab') (e.preventDefault(), ref.current?.focus());
    if (e.key === 'Escape') onClose();
  };
  return (
    <div class="fb-back" onKeyDown={key}>
      <section class="k-panel fb" role="dialog" aria-modal="true" aria-labelledby="fb-h">
        <img src={`./assets/kit/${fb.assetId}.png`} alt="" />
        <div>
          <h2 id="fb-h" class="jua">{fb.title}</h2>
          {fb.lines.map((l) => <p>{l}</p>)}
          <button ref={ref} class="k-btn coral" style="width:200px" onClick={onClose}>
            <span class="lbl jua"><span>알겠어요</span></span>
          </button>
        </div>
      </section>
    </div>
  );
}
