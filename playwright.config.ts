import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { defineConfig, devices } from '@playwright/test';

// 이 기기엔 @playwright/test 1.54 가 기대하는 chromium 빌드가 없고 1248 헤드리스 셸만 있다. 있으면 그것을, 없으면 기본 브라우저를 쓴다
const SHELL = `${homedir()}/Library/Caches/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-mac-arm64/chrome-headless-shell`;
// PW_CHROMIUM 이 있으면 그것, 없으면 위 경로가 존재할 때만 쓴다
const EXE = process.env.PW_CHROMIUM || (existsSync(SHELL) ? SHELL : undefined);

export default defineConfig({
  testDir: 'tests/e2e',
  workers: 1,
  use: {
    baseURL: 'http://localhost:4184',
    ...(EXE ? { launchOptions: { executablePath: EXE } } : {}),
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run preview -- --port 4184',
    url: 'http://localhost:4184',
    reuseExistingServer: false,
  },
});
