import os from 'node:os';
import path from 'node:path';
import { defineConfig } from '@playwright/test';

const port = 3001;
const baseURL = `http://localhost:${port}`;
const sqlitePath = path.join(process.cwd(), '.playwright', 'pumpme-e2e.sqlite');

export default defineConfig({
    testDir: path.join('tests', 'e2e'),
    timeout: 60_000,
    retries: process.env.CI ? 2 : 0,
    use: {
        baseURL,
        trace: 'on-first-retry',
        viewport: { width: 390, height: 844 }
    },
    globalSetup: path.join('tests', 'e2e', 'global-setup.ts'),
    webServer: {
        command: `npm run dev -- -p ${port}`,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        env: {
            ...process.env,
            PUMPME_SQLITE_PATH: sqlitePath,
            // Prevent Next from treating local e2e as Vercel runtime.
            VERCEL: '0',
            HOME: process.env.HOME ?? os.homedir()
        }
    }
});
