// 원본 에셋(assets/)을 public/assets 로 복사만 한다. 원본은 건드리지 않는다.
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';

rmSync('public/assets', { recursive: true, force: true });
// 화면이 쓰지 않는 kit 그림은 배포본에서 뺀다. 빠뜨린 게 있으면 check-assets 가 잡는다
const UNUSED_KIT = ['btn-coral-pressed', 'door-label-1', 'face-big-happy', 'face-big-partial', 'face-big-unhappy', 'icon-badge', 'step-check', 'step-done'];
cpSync('assets/img/kit', 'public/assets/kit', { recursive: true, filter: (src) => !UNUSED_KIT.some((n) => src.endsWith(`/${n}.png`)) });
// 결과 카드 PNG 저장용: file:// 에선 파일 그림이 canvas 를 오염시켜 data URL 만 쓸 수 있다.
// 카드에 들어가는 그림마다 클래식 스크립트 하나(fetch 없이 <script> 로 주입). Result.tsx 의 kit64 가 읽는다
mkdirSync('public/assets/img64', { recursive: true });
for (const f of readdirSync('assets/img/kit').filter((f) => /^(panel|badge-|icon-|desk-|door-|locker-|tile-).*\.png$/.test(f))) {
  const id = f.slice(0, -4);
  const url = `data:image/png;base64,${readFileSync(`assets/img/kit/${f}`).toString('base64')}`;
  writeFileSync(`public/assets/img64/${id}.js`, `(window.__dfaImg=window.__dfaImg||{})[${JSON.stringify(id)}]=${JSON.stringify(url)};\n`);
}
// _lyria(원본 보관)·-b(대안 곡)는 배포본에 넣지 않는다
cpSync('assets/bgm', 'public/assets/bgm', { recursive: true, filter: (src) => !src.includes('_lyria') && !src.endsWith('-b.mp3') });
// 효과음은 생성 중일 수 있다 — 폴더가 없으면 건너뛴다(소리 모듈이 no-op)
if (existsSync('assets/sfx')) cpSync('assets/sfx', 'public/assets/sfx', { recursive: true });
cpSync('assets/img/bg-classroom.png', 'public/assets/bg-classroom.png');
cpSync('assets/img/keyart-title.png', 'public/assets/keyart-title.png');
// 교실 장면: assets/img/classroom-npcs.png → npcHitAreas.ts 의 CLASSROOM_ART. 없으면 cpSync 가 던져 빌드가 멈춘다
mkdirSync('public/assets/scene', { recursive: true });
cpSync('assets/img/classroom-npcs.png', 'public/assets/scene/classroom-npcs.png');
