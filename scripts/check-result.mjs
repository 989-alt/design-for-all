// 결과 JSON 판정: node scripts/check-result.mjs <json> --expect master|care|apprentice
// 판정식은 src/engine/verdict.ts 를 그대로 import(복제 금지). 맨 node 는 확장자 없는 .ts import 를 못 풀어 vite-node 로 자신을 다시 띄운다
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const [file, flag, expect] = process.argv.slice(2);
if (!file || flag !== '--expect' || !['master', 'care', 'apprentice'].includes(expect)) {
  console.error('사용법: node scripts/check-result.mjs <json> --expect master|care|apprentice');
  process.exit(2);
}

let verdict, react;
try {
  ({ verdict } = await import('../src/engine/verdict.ts'));
  ({ react } = await import('../src/engine/judge.ts'));
} catch (e) {
  if (process.env.DFA_VITE_NODE) throw e;
  const bin = fileURLToPath(new URL('../node_modules/.bin/vite-node', import.meta.url));
  const r = spawnSync(bin, [fileURLToPath(import.meta.url), file, flag, expect], { stdio: 'inherit', env: { ...process.env, DFA_VITE_NODE: '1' } });
  if (r.error) throw r.error;
  process.exit(r.status ?? 1);
}

const state = JSON.parse(readFileSync(file, 'utf8'));
// JSON 에 적힌 만족 수를 믿지 않고 부품으로 다시 판정한다
for (const [i, r] of state.rounds.entries()) {
  const satisfied = Object.values(react(state.product, r.slots)).filter((x) => x.kind === 'happy').length;
  if (satisfied !== r.satisfied) console.log(`round ${i + 1} satisfied ${r.satisfied} → ${satisfied} (부품으로 재계산)`);
  r.satisfied = satisfied;
}
const v = verdict(state);
for (const k of ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S8']) console.log(`${k} ${v[k]}`);
console.log(`passed ${v.passed}/6 grade ${v.grade} (expect ${expect})`);
if (v.grade !== expect) process.exit(1);
