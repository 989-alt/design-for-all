import { Hud } from './Progress';
import { advance } from './store';

// 시드: ?seed=N 이 있으면 그것, 없으면 시각
const seed = () => Number(new URLSearchParams(location.search).get('seed')) || Date.now() >>> 0;

export function Title() {
  return (
    <div class="stage">
      <img class="art" src="./assets/keyart-title.png" alt="" />
      <Hud />
      <section class="k-panel brief" aria-labelledby="brief-h">
        <h2 id="brief-h" class="sm">의뢰서</h2>
        <p class="jua lead">우리 교실을 모두를 위한 교실로</p>
        <p>제품 디자인은 생활에서 쓰는 제품을 쓰기 좋고 아름답게 만드는 일이에요. 요즘은 누구나 편리하게, 환경까지 생각해요.</p>
        <button class="k-btn coral" style="width:200px" onClick={() => advance('title', { type: 'start', seed: seed() })}>
          <span class="lbl jua"><span>시작</span></span>
        </button>
      </section>
    </div>
  );
}
