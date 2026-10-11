// kie.ai 오디오 생성 — 배경음 Suno, 효과음 ElevenLabs (2026-10-11 사용자 지시: "배경음은 suno, 효과음은 일레븐랩스")
// 사용: node kie-audio.mjs <sfx|bgm> <프롬프트.json> <출력.mp3>
//   sfx JSON: {"text":"...","duration_seconds":0.6,"prompt_influence":0.5}
//   bgm JSON: {"title":"...","style":"...","duration":60,"negative_tags":"..."}
// 키: 워크트리 루트 .env 의 KIE_AI_KEY (커밋 금지). 결과 URL 은 14일 뒤 만료 — 즉시 내려받는다.
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const envFile = path.resolve(here, '../../.env');
const KEY = (process.env.KIE_AI_KEY || (fs.readFileSync(envFile, 'utf8').match(/^KIE_AI_KEY=(.+)$/m) || [])[1] || '').trim();
if (!KEY) { console.error('KIE_AI_KEY 없음'); process.exit(2); }
const [kind, promptFile, out] = process.argv.slice(2);
if (!['sfx', 'bgm'].includes(kind) || !promptFile || !out) { console.error('사용: node kie-audio.mjs <sfx|bgm> <prompt.json> <out.mp3>'); process.exit(2); }
if (fs.existsSync(out)) { console.error('이미 있음(덮어쓰지 않음):', out); process.exit(3); }
const p = JSON.parse(fs.readFileSync(promptFile, 'utf8'));
const body = kind === 'sfx'
  ? { model: 'elevenlabs/sound-effect-v2', input: { text: p.text, duration_seconds: p.duration_seconds, prompt_influence: p.prompt_influence ?? 0.5, ...(p.loop ? { loop: true } : {}) } }
  : { model: 'ai-music-api/generate', input: { custom_mode: true, instrumental: true, model: p.model || 'V6', title: p.title, style: p.style, negative_tags: p.negative_tags || 'vocals, singing, lyrics', duration: p.duration } };
const H = { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', Accept: 'application/json' };
const r = await (await fetch('https://api.kie.ai/api/v1/jobs/createTask', { method: 'POST', headers: H, body: JSON.stringify(body) })).json();
if (r.code !== 200) { console.error('createTask 실패', r.code, r.msg); process.exit(1); }
const id = r.data.taskId; console.error(`[${path.basename(out)}] task ${id}`);
let wait = 3000, d;
for (let t = 0; t < 200; t++) {
  await new Promise(s => setTimeout(s, wait)); wait = Math.min(wait * 1.3, 15000);
  const q = await (await fetch(`https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${id}`, { headers: H })).json();
  if (q.code !== 200) { console.error('recordInfo', q.code, q.msg); continue; }
  d = q.data; if (d.state === 'success' || d.state === 'fail') break;
}
if (!d || d.state !== 'success') { console.error('실패', d?.state, d?.failCode, d?.failMsg); process.exit(1); }
const res = d.response || JSON.parse(d.resultJson || '{}');
const urls = res.resultUrls || (res.data || []).map(x => x.audio_url).filter(Boolean);
if (!urls.length) { console.error('결과 URL 없음', JSON.stringify(res).slice(0, 400)); process.exit(1); }
for (let i = 0; i < urls.length; i++) {
  const buf = Buffer.from(await (await fetch(urls[i])).arrayBuffer());
  const o = i === 0 ? out : out.replace(/\.mp3$/, `-${String.fromCharCode(98 + i - 1)}.mp3`);
  fs.mkdirSync(path.dirname(o), { recursive: true }); fs.writeFileSync(o, buf);
  console.error(`[${path.basename(o)}] ${buf.length} bytes · ${d.costTime}s · credits ${d.creditsConsumed}`);
}
