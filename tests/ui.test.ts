import { expect, test } from '@playwright/test';
import { waitForAppLoad, startTimer, getTimerValue, enableAudio } from './helpers';

/**
 * UI and Accessibility Tests
 * Testing the responsive design and accessibility features
 */
test.describe('UI and Accessibility', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
		await waitForAppLoad(page);
	});

	/**
	 * Responsive Design Tests
	 */
	test('layout adapts to mobile viewport size', async ({ page }) => {
		// Set viewport to mobile size
		await page.setViewportSize({ width: 375, height: 667 });

		// Check that the main container has appropriate padding
		const mainContainer = page.locator('main.container');
		await expect(mainContainer).toBeVisible();

		// Check that timer display is visible and properly sized
		const timerDisplay = page.locator('.font-mono.text-5xl');
		await expect(timerDisplay).toBeVisible();

		// Verify timer value is in expected format
		const timerValue = await getTimerValue(page);
		expect(timerValue).toMatch(/^\d{2}:\d{2}$/);
	});

	test('timer controls are visible and clickable', async ({ page }) => {
		// Check that the start button is visible
		const startButton = page.locator('[data-testid="start-button"]');
		await expect(startButton).toBeVisible();

		// Check that the reset button is visible
		const resetButton = page.locator('[data-testid="reset-button"]');
		await expect(resetButton).toBeVisible();

		// Enable audio and check that it works
		const audioEnabled = await enableAudio(page);
		expect(audioEnabled).toBeTruthy();
	});
	/**
	 * Accessibility Tests
	 */
	test('keyboard navigation works for interactive elements', async ({ page }) => {
		// Ensure the page is fully loaded
		await waitForAppLoad(page);

		// Verify the start button is visible using data-testid
		const startButton = page.locator('[data-testid="start-button"]');
		await expect(startButton).toBeVisible();

		// Focus the start button directly for more reliable testing
		await startButton.focus();
		await expect(startButton).toBeFocused();

		// Press the button with keyboard
		await page.keyboard.press('Enter');

		// Verify the timer started (pause button should be visible)
		await expect(page.locator('[data-testid="pause-button"]')).toBeVisible();

		// Verify the reset button is disabled
		const resetButton = page.locator('[data-testid="reset-button"]');
		await expect(resetButton).toBeDisabled();

		// Focus the pause button directly
		await page.locator('[data-testid="pause-button"]').focus();
		await expect(page.locator('[data-testid="pause-button"]')).toBeFocused();

		// Press the pause button with keyboard
		await page.keyboard.press('Enter');

		// Verify the reset button is enabled
		await expect(resetButton).not.toBeDisabled();

		// Focus the reset button directly
		await resetButton.focus();
		await expect(resetButton).toBeFocused();

		// Press reset with keyboard and verify timer was reset
		await page.keyboard.press('Enter');
		await expect(startButton).toBeVisible();
	});

	test('ARIA attributes are present and correct', async ({ page }) => {
		// Check that buttons have proper aria-labels
		const buttons = page.locator('button[aria-label]');
		const count = await buttons.count();
		expect(count).toBeGreaterThan(0);

		// Check that sliders have proper aria-labels
		const sliders = page.locator('input[type="range"][aria-label]');
		const sliderCount = await sliders.count();
		expect(sliderCount).toBeGreaterThan(0);

		// Check for specific aria-label on mantra pace slider
		const paceSlider = page.locator('#mantra-pace');
		const ariaLabel = await paceSlider.getAttribute('aria-label');
		expect(ariaLabel).toContain('tempo');
	});

	test('color scheme respects dark mode preference', async ({ page }) => {
		// Ensure the page is fully loaded
		await waitForAppLoad(page);

		// Emulate dark mode preference
		await page.emulateMedia({ colorScheme: 'dark' });

		// Wait for theme to apply
		await page.waitForTimeout(1000);

		// Check that dark mode is applied to the HTML element
		const htmlElement = page.locator('html');
		await expect(htmlElement).toHaveClass(/dark/, { timeout: 5000 });

		// Check for dark mode specific elements
		// Look for any element with a dark mode class
		const darkModeElements = page.locator('[class*="dark:"]');
		const count = await darkModeElements.count();
		expect(count).toBeGreaterThan(0);

		// Switch to light mode
		await page.emulateMedia({ colorScheme: 'light' });

		// Wait for theme to apply
		await page.waitForTimeout(1000);

		// Check that light mode is applied (dark classes should not be active)
		await expect(page.locator('body')).not.toHaveClass(/dark/);
	});
});

/**
 * Navigation and Routing Tests
 */
test.describe('Navigation and Routing', () => {
	test('can navigate to FAQ page and back', async ({ page }) => {
		// Start at home page
		await page.goto('/');
		await waitForAppLoad(page);

		// Click on FAQ link
		await page.getByRole('link', { name: /View Frequently Asked Questions/i }).click();

		// Verify we're on the FAQ page
		await expect(page).toHaveURL(/\/faq/);
		await expect(page.locator('h1')).toContainText('Frequently Asked Questions');

		// Navigate back to home
		await page.goBack();

		// Verify we're back on the home page
		await expect(page).toHaveURL(/\/$/);
		await expect(page.locator('h1')).toContainText('Kirtan Kriya Timer');
	});

	test('timer state is preserved when navigating', async ({ page }) => {
		// Start at home page
		await page.goto('/');
		await waitForAppLoad(page);

		// Start the timer
		await startTimer(page);
		await page.waitForTimeout(1000);

		// Get current time
		const initialTime = await getTimerValue(page);

		// Navigate to FAQ page
		await page.getByRole('link', { name: /View Frequently Asked Questions/i }).click();
		await expect(page).toHaveURL(/\/faq/);

		// Navigate back to home
		await page.goBack();

		// Get time after returning
		const newTime = await getTimerValue(page);

		// Timer should be paused, but time should be preserved
		expect(initialTime).toEqual(newTime);

		// Timer should be paused (start/resume button should be visible)
		await expect(page.getByRole('button', { name: /resume/i })).toBeVisible();
	});
});
