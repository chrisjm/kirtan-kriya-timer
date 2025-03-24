import { expect, test } from '@playwright/test';
import { waitForAppLoad, getTimerValue, startTimer, pauseTimer, resetTimer, selectPhase, enableAudio, setVolume, setMantraPace } from './helpers';

/**
 * Timer Functionality Tests
 * Testing the core timer functionality including initialization,
 * controls, and phase progression
 */
test.describe('Timer Functionality', () => {
	// Setup for all timer tests
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
		await waitForAppLoad(page);
	});

	/**
	 * Timer Initialization Tests
	 */
	test('timer loads with correct default values', async ({ page }) => {
		// Check page title
		await expect(page.locator('h1')).toHaveText('Kirtan Kriya Timer');

		// Check timer display shows correct format (MM:SS)
		const timerValue = await getTimerValue(page);
		expect(timerValue).toMatch(/^\d{2}:\d{2}$/);

		// Verify start button is visible
		await expect(page.getByRole('button', { name: /start/i })).toBeVisible();
	});

	/**
	 * Timer Controls Tests
	 */
	test('start button begins the timer countdown', async ({ page }) => {
		// Get initial time
		const initialTime = await getTimerValue(page);

		// Start the timer
		await startTimer(page);

		// Wait for 2 seconds to ensure timer is counting down
		await page.waitForTimeout(2000);

		// Get new time
		const newTime = await getTimerValue(page);

		// Verify time has changed (decreased)
		expect(initialTime).not.toEqual(newTime);

		// Verify pause button is now visible
		await expect(page.getByRole('button', { name: /pause/i })).toBeVisible();
	});

	test('pause button stops the timer countdown', async ({ page }) => {
		// Start the timer
		await startTimer(page);
		await page.waitForTimeout(1000);

		// Pause the timer
		await pauseTimer(page);

		// Get time after pausing
		const pausedTime = await getTimerValue(page);

		// Wait to verify timer is actually paused
		await page.waitForTimeout(2000);

		// Get time after waiting
		const newTime = await getTimerValue(page);

		// Verify time hasn't changed
		expect(pausedTime).toEqual(newTime);

		// Verify resume button is visible
		await expect(page.getByRole('button', { name: /resume/i })).toBeVisible();
	});

	test('reset button returns timer to initial state', async ({ page }) => {
		// Get initial time
		const initialTime = await getTimerValue(page);

		// Start the timer
		await startTimer(page);
		await page.waitForTimeout(2000);

		// Pause the timer
		await pauseTimer(page);

		// Reset the timer
		await resetTimer(page);

		// Get time after reset
		const resetTime = await getTimerValue(page);

		// Verify time has been reset to initial time
		expect(resetTime).toEqual(initialTime);

		// Verify start button is visible
		await expect(page.getByRole('button', { name: /start/i })).toBeVisible();
	});

	/**
	 * Phase Selection Tests
	 */
	test('manual phase selection changes current phase', async ({ page }) => {
		// Wait for app to load
		await waitForAppLoad(page);
		
		// Get initial phase info using data-testid
		const phaseTitle = page.locator('[data-testid="phase-title"]');
		await expect(phaseTitle).toBeVisible({ timeout: 10000 });
		const initialPhaseText = await phaseTitle.textContent();
		console.log('Initial phase text:', initialPhaseText);

		// Select the second phase
		const selectSuccess = await selectPhase(page, 1);
		expect(selectSuccess).toBeTruthy();
		console.log('Selected phase 2');
		
		// Wait for the phase to update
		await page.waitForTimeout(1000);

		// Verify the phase info has updated
		const newPhaseText = await phaseTitle.textContent();
		console.log('New phase text:', newPhaseText);
		expect(newPhaseText).not.toEqual(initialPhaseText);
		expect(newPhaseText).toContain('Phase 2');
	});
});

/**
 * Audio Functionality Tests
 * Testing the audio initialization and controls
 */
test.describe('Audio Functionality', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
		await waitForAppLoad(page);
	});

	test('audio enable button initializes audio', async ({ page }) => {
		// Check if audio is initially disabled
		await expect(page.locator('text=Audio Disabled')).toBeVisible();

		// Enable audio
		const success = await enableAudio(page);

		// Verify audio was enabled
		expect(success).toBeTruthy();
		await expect(page.locator('text=Audio Enabled')).toBeVisible();
	});

	test('volume slider changes volume level', async ({ page }) => {
		// Enable audio first
		await enableAudio(page);

		// Set volume to 75%
		const success = await setVolume(page, 75);

		// Verify volume was changed
		expect(success).toBeTruthy();
		await expect(page.locator('text=75%')).toBeVisible();
	});

	test('mantra pace control changes BPM', async ({ page }) => {
		// Wait for app to load
		await waitForAppLoad(page);
		
		// Enable audio first (required for mantra pace to work)
		const audioEnabled = await enableAudio(page);
		expect(audioEnabled).toBeTruthy();
		
		// Open settings if needed to access the mantra pace control
		const settingsButton = page.locator('[data-testid="settings-button"]');
		if (await settingsButton.isVisible()) {
			await settingsButton.click();
		}

		// Find the mantra pace value using data-testid
		const mantraPaceValue = page.locator('[data-testid="mantra-pace-value"]');
		await expect(mantraPaceValue).toBeVisible({ timeout: 10000 });
		
		// Get current BPM value
		const initialBpm = await mantraPaceValue.textContent();
		console.log('Initial BPM value:', initialBpm);

		// Set mantra pace to 80 BPM
		const success = await setMantraPace(page, 80);
		expect(success).toBeTruthy();
		console.log('Set mantra pace to 80 BPM');
		
		// Wait for the UI to update
		await page.waitForTimeout(1000);

		// Verify the BPM display shows the new value
		const newBpm = await mantraPaceValue.textContent();
		console.log('New BPM value:', newBpm);
		expect(initialBpm).not.toEqual(newBpm);
		expect(newBpm).toContain('80');
	});
});
