// tokens.css 의 전경/배경 쌍 대비(WCAG)를 :root 와 html[data-contrast=high] 에서 계산. 미달이 있으면 쌍을 찍고 exit 1
import { readFileSync } from 'node:fs';

const css = readFileSync(process.argv[2] ?? 'src/styles/tokens.css', 'utf8');
const vars = (sel) => {
  const body = css.match(new RegExp(`${sel}\\s*\\{([^}]*)\\}`))?.[1] ?? '';
  return Object.fromEntries([...body.matchAll(/--([\w-]+)\s*:\s*(#[0-9a-fA-F]{6})\b/g)].map((m) => [m[1], m[2]]));
};
const root = vars(':root');
const high = { ...root, ...vars('html\\[data-contrast=high\\]') };

const lum = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

// [전경, 배경, 최소비] 이름 목록 (7:1 은 고대비에서 4.5 → 7 로 올린다)
const pairs = [];
const text = (fg, bg) => pairs.push([fg, bg, 4.5]);
for (const k of ['primary', 'secondary', 'accent', 'destructive', 'card', 'popover']) text(`${k}-foreground`, k);
for (const bg of ['background', 'card', 'muted', 'secondary', 'surface-classroom', 'surface-studio', 'surface-slot', 'surface-slot-filled', 'surface-progress']) text('foreground', bg);
text('surface-slot-foreground', 'surface-slot');
text('surface-slot-foreground', 'surface-slot-filled');
for (const bg of ['background', 'card']) text('accent-text', bg);
for (const bg of ['background', 'card']) text('muted-foreground', bg);
for (const k of ['trouble', 'case', 'ref']) text(`cardkind-${k}-foreground`, `cardkind-${k}`);
for (const k of ['happy', 'partial', 'unhappy']) text(`reaction-${k}-foreground`, `reaction-${k}`);
// 반응 색 글자는 카드 바탕 위에서도 읽힌다(.react)
for (const k of ['happy', 'partial', 'unhappy']) text(`reaction-${k}`, 'card');
// 그래픽 전용(글자 아님)은 3:1
for (const k of ['purpose', 'tech', 'function', 'beauty', 'access', 'eco']) pairs.push([`element-${k}`, 'card', 3]);
for (const k of ['surface-link', 'surface-progress-done']) pairs.push([k, 'background', 3]);

let bad = 0;
for (const [theme, t, boost] of [['root', root, false], ['high', high, true]]) {
  for (const [fg, bg, min] of pairs) {
    const need = boost && min === 4.5 ? 7 : min;
    if (!t[fg] || !t[bg]) { console.log(`MISSING ${theme} --${fg} / --${bg}`); bad++; continue; }
    const r = ratio(t[fg], t[bg]);
    if (r + 1e-9 < need) { console.log(`FAIL ${theme} --${fg} ${t[fg]} on --${bg} ${t[bg]} = ${r.toFixed(2)} < ${need}`); bad++; }
  }
}
console.log(`${pairs.length * 2} pairs checked, ${bad} failed`);
process.exit(bad ? 1 : 0);
