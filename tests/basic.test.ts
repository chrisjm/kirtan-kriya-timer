import { expect, test } from '@playwright/test';
import { waitForAppLoad, enableAudio, getTimerValue, startTimer } from './helpers';

/**
 * Basic Functionality Tests
 * A minimal set of tests to verify core functionality
 */
test.describe('Basic Functionality', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
		await waitForAppLoad(page);
	});

	/**
	 * Basic UI Test
	 */
	test('page loads with timer display visible', async ({ page }) => {
		// Check that the timer display is visible
		const timerDisplay = page.locator('.font-mono.text-5xl');
		await expect(timerDisplay).toBeVisible();

		// Check that the timer value is in the expected format (MM:SS)
		const timerValue = await getTimerValue(page);
		expect(timerValue).toMatch(/^\d{2}:\d{2}$/);
	});

	/**
	 * Basic Timer Controls Test
	 */
	test('start button begins the timer countdown', async ({ page }) => {
		// Get initial timer value
		const initialValue = await getTimerValue(page);

		// Start the timer
		await startTimer(page);

		// Wait for 2 seconds to ensure the timer has changed
		await page.waitForTimeout(2000);

		// Get the new timer value
		const newValue = await getTimerValue(page);

		// Verify that the timer value has changed
		expect(newValue).not.toEqual(initialValue);
	});

	/**
	 * Basic Audio Test
	 */
	test('audio can be enabled', async ({ page }) => {
		// Enable audio
		const audioEnabled = await enableAudio(page);

		// Verify audio was enabled
		expect(audioEnabled).toBeTruthy();

		// Check for audio enabled text
		await expect(page.locator('text=Audio Enabled')).toBeVisible();
	});
});
