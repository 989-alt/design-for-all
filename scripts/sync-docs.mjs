// 하네스 정본(../docs/design-for-all)을 docs/ 로 복사한다. 정본이 없으면(독립 저장소) 아무것도 안 하고 끝낸다.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const SRC = '../docs/design-for-all';
if (!existsSync(SRC)) process.exit(0);
mkdirSync('docs', { recursive: true });
for (const f of ['PRD.md', 'PRODUCT.md', 'DESIGN.md', '교과분석.md', '에셋목록.md', 'tokens.json']) {
  const body = readFileSync(`${SRC}/${f}`, 'utf8');
  const note = '정본은 하네스 docs/design-for-all — 이 사본은 저장소 배포용';
  writeFileSync(`docs/${f}`, f.endsWith('.json') ? body : `<!-- ${note} -->\n${body}`);
}
