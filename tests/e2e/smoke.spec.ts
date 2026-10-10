import path from 'node:path';
import { expect, test } from '@playwright/test';

test('무대 레터박스·버튼 실측·콘솔 에러 0', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(String(e)));

  await page.setViewportSize({ width: 1024, height: 640 });
  await page.goto('/');
  const box = (await page.locator('.stage').boundingBox())!;
  expect(box.x).toBeGreaterThanOrEqual(-0.5);
  expect(box.y).toBeGreaterThanOrEqual(-0.5);
  expect(box.x + box.width).toBeLessThanOrEqual(1024.5);
  expect(box.y + box.height).toBeLessThanOrEqual(640.5);

  await page.setViewportSize({ width: 1280, height: 800 });
  // resize 반영(scale=1)을 기다린 뒤 높이를 잰다
  await expect.poll(async () => (await page.locator('.k-btn').boundingBox())!.height).toBeCloseTo(64, -1);
  const btn = (await page.locator('.k-btn').boundingBox())!;
  expect(Math.abs(btn.height - 64)).toBeLessThanOrEqual(1);

  expect(errors).toEqual([]);
});

test('file:// 로 직접 열기', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('file://' + path.resolve('dist/index.html'));
  await expect(page.locator('.k-hud .title')).toBeVisible();
  await page.evaluate(() => document.fonts.load('20px Jua'));
  expect(await page.evaluate(() => document.fonts.check('20px Jua'))).toBe(true);
  expect(errors).toEqual([]);
});
