// 원본 에셋(assets/)을 public/assets 로 복사만 한다. 원본은 건드리지 않는다.
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';

rmSync('public/assets', { recursive: true, force: true });
cpSync('assets/img/kit', 'public/assets/kit', { recursive: true });
// _lyria 는 원본 보관용이라 배포본에 넣지 않는다
cpSync('assets/bgm', 'public/assets/bgm', { recursive: true, filter: (src) => !src.includes('_lyria') });
// 효과음은 생성 중일 수 있다 — 폴더가 없으면 건너뛴다(소리 모듈이 no-op)
if (existsSync('assets/sfx')) cpSync('assets/sfx', 'public/assets/sfx', { recursive: true });
cpSync('assets/img/bg-classroom.png', 'public/assets/bg-classroom.png');
cpSync('assets/img/keyart-title.png', 'public/assets/keyart-title.png');
// 교실 장면: 저장소 루트의 시안 그림(npcHitAreas.ts 의 CLASSROOM_ART_SRC). 없으면 cpSync 가 던져 빌드가 멈춘다
mkdirSync('public/assets/scene', { recursive: true });
cpSync('../시안/design-for-all/1-플랫-교실.png', 'public/assets/scene/classroom-npcs.png');
