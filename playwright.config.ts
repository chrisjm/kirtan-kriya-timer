import type { PlaywrightTestConfig } from '@playwright/test';
import { devices } from '@playwright/test';

const config: PlaywrightTestConfig = {
	webServer: {
		command: 'npm run build && npm run preview',
		port: 4173,
		reuseExistingServer: !process.env.CI
	},
	testDir: 'tests',
	testMatch: /(.+\.)?(test|spec)\.[jt]s/,
	timeout: 6000,
	use: {
		trace: 'on-first-retry',
		screenshot: 'only-on-failure',
		video: 'on-first-retry'
	},
	projects: [
		{
			name: 'chromium',
			use: { browserName: 'chromium' }
		},
		{
			name: 'webkit',
			use: { browserName: 'webkit' }
		},
		{
			name: 'mobile-chrome',
			use: {
				browserName: 'chromium',
				...devices['Pixel 5']
			}
		}
	],
	reporter: [
		['html', { outputFolder: 'playwright-report' }],
		['json', { outputFile: 'playwright-report/test-results.json' }]
	],
	expect: {
		timeout: 15000
	},
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined
};

export default config;
