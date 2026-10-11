// 원본 에셋(assets/)을 public/assets 로 복사만 한다. 원본은 건드리지 않는다.
import { cpSync, mkdirSync, rmSync } from 'node:fs';

rmSync('public/assets', { recursive: true, force: true });
cpSync('assets/img/kit', 'public/assets/kit', { recursive: true });
cpSync('assets/bgm', 'public/assets/bgm', { recursive: true });
cpSync('assets/img/bg-classroom.png', 'public/assets/bg-classroom.png');
cpSync('assets/img/keyart-title.png', 'public/assets/keyart-title.png');
// 교실 장면: 저장소 루트의 시안 그림(npcHitAreas.ts 의 CLASSROOM_ART_SRC). 없으면 cpSync 가 던져 빌드가 멈춘다
mkdirSync('public/assets/scene', { recursive: true });
cpSync('../시안/design-for-all/1-플랫-교실.png', 'public/assets/scene/classroom-npcs.png');
