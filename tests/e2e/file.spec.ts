import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';

// 빌드본을 file:// 로 직접 열어도(배포 없이 USB·폴더로 나눠 줌) 결과 카드를 PNG 로 저장한다 (QA r1 #0)
test('file:// 빌드: 이어하기 → 결과 → 그림으로 저장 = PNG 다운로드', async ({ page }) => {
  const url = `file://${resolve('dist/index.html')}`;
  const fixture = JSON.parse(readFileSync('tests/e2e/fixtures/last-result.json', 'utf8'));
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(url);
  await page.evaluate((s) => localStorage.setItem('dfa.save.v1', JSON.stringify({ v: 1, state: s })), fixture);
  await page.reload();
  await page.getByRole('button', { name: '이어하기', exact: true }).click();
  const dl = page.waitForEvent('download', { timeout: 8000 });
  await page.getByRole('button', { name: '그림으로 저장', exact: true }).click();
  const file = readFileSync((await (await dl).path())!);
  expect([...file.subarray(0, 8)]).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  expect(file.length).toBeGreaterThan(100_000); // 패널·제품 그림이 들어간 카드
  await expect(page.locator('.msg')).toHaveText('');
});
