// 원본 에셋(assets/)을 public/assets 로 복사만 한다. 원본은 건드리지 않는다.
import { cpSync, rmSync } from 'node:fs';

rmSync('public/assets', { recursive: true, force: true });
cpSync('assets/img/kit', 'public/assets/kit', { recursive: true });
cpSync('assets/bgm', 'public/assets/bgm', { recursive: true });
cpSync('assets/img/bg-classroom.png', 'public/assets/bg-classroom.png');
cpSync('assets/img/keyart-title.png', 'public/assets/keyart-title.png');
