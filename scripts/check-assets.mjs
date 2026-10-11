// src 가 참조하는 /assets 경로가 dist 에 모두 있는지 훑는다. 필수 누락이면 exit 1, 효과음(sfx)은 경고만
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const walk = (d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));
const src = walk('src').filter((f) => /\.(tsx?|css)$/.test(f) && !/\.test\./.test(f));
const text = src.map((f) => readFileSync(f, 'utf8')).join('\n');

const need = new Set(); // dist/assets 기준 상대경로
// 1) 글자 그대로 쓴 경로 (CSS url(/assets/..)·TSX ./assets/..)
for (const m of text.matchAll(/\/assets\/([\w./-]+\.(?:png|mp3))/g)) need.add(m[1]);
// 2) 템플릿으로 조립하는 kit id: 첫 마디가 kit 파일의 접두사인 문자열 리터럴은 kit 파일이어야 한다
const kitDir = 'dist/assets/kit';
const prefixes = new Set(readdirSync(kitDir).map((f) => f.split(/[-.]/)[0]));
const content = src.filter((f) => f.startsWith('src/content/')).map((f) => readFileSync(f, 'utf8')).join('\n');
for (const m of content.matchAll(/'((\w+)-[\w-]+)'/g)) if (prefixes.has(m[2])) need.add(`kit/${m[1]}.png`);
// 3) 소리 매니페스트: bgm 필수, sfx 선택
const manifest = readFileSync('src/content/assets.ts', 'utf8');
const names = (k) => [...(manifest.match(new RegExp(`${k} = \\[([^\\]]*)\\]`))?.[1].matchAll(/'([\w-]+)'/g) ?? [])].map((m) => m[1]);
for (const n of names('BGM')) need.add(`bgm/${n}.mp3`);
const optional = names('SFX').map((n) => `sfx/${n}.mp3`);

const missing = [...need].filter((p) => !existsSync(`dist/assets/${p}`));
const sfxMissing = optional.filter((p) => !existsSync(`dist/assets/${p}`));
if (existsSync('dist/assets/bgm/_lyria')) missing.push('bgm/_lyria 가 dist 에 있으면 안 됨');
for (const p of sfxMissing) console.warn(`경고(선택): ${p} 없음`);
if (missing.length) {
  console.error(`필수 에셋 누락 ${missing.length}:\n${missing.join('\n')}`);
  process.exit(1);
}
console.log(`ok: 필수 ${need.size}개 확인, 효과음 ${optional.length - sfxMissing.length}/${optional.length}`);
