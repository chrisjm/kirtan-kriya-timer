import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

// Default timeout for actions and assertions
const DEFAULT_TIMEOUT = 10000;

/**
 * Helper functions for Kirtan Kriya Timer tests
 * These functions encapsulate common test operations to make tests more maintainable
 */

/**
 * Waits for the application to be fully loaded
 */
export const waitForAppLoad = async (page: Page): Promise<void> => {
  await page.waitForSelector('h1:has-text("Kirtan Kriya Timer")', { timeout: DEFAULT_TIMEOUT });
  // Wait a bit more to ensure all components are loaded
  await page.waitForTimeout(500);
};

/**
 * Enables audio in the application
 * Returns true if audio was successfully enabled
 */
export const enableAudio = async (page: Page): Promise<boolean> => {
  try {
    // Check if audio is already enabled using data-testid
    if (await page.locator('[data-testid="audio-status-enabled"]').isVisible({ timeout: 1000 })) {
      return true;
    }
    
    // Click the enable button using data-testid first, then fall back to role
    let enableButton = page.locator('[data-testid="enable-audio-button"]');
    if (await enableButton.count() === 0) {
      enableButton = page.getByRole('button', { name: 'Enable' });
    }
    
    if (await enableButton.isVisible({ timeout: DEFAULT_TIMEOUT })) {
      await enableButton.click();
      
      // Wait for audio to be enabled using data-testid
      await expect(page.locator('[data-testid="audio-status-enabled"]')).toBeVisible({ timeout: DEFAULT_TIMEOUT });
      // Wait a bit more to ensure audio is fully initialized
      await page.waitForTimeout(500);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error enabling audio:', error);
    return false;
  }
};

/**
 * Gets the current timer display value
 * Returns the timer text in MM:SS format
 */
export const getTimerValue = async (page: Page): Promise<string | null> => {
  const timerDisplay = page.locator('[data-testid="timer-display"]');
  await expect(timerDisplay).toBeVisible({ timeout: DEFAULT_TIMEOUT });
  return timerDisplay.textContent();
};

/**
 * Starts the timer
 * Returns true if the timer was successfully started
 */
export const startTimer = async (page: Page): Promise<boolean> => {
  try {
    // Try to find the start/resume button using data-testid first, then fall back to role
    let startButton = page.locator('[data-testid="start-button"]');
    if (await startButton.count() === 0) {
      startButton = page.getByRole('button', { name: /start|resume/i });
    }
    
    if (await startButton.isVisible({ timeout: DEFAULT_TIMEOUT })) {
      await startButton.click();
      
      // Verify timer started (pause button should be visible)
      // Try to find the pause button using data-testid first, then fall back to role
      let pauseButton = page.locator('[data-testid="pause-button"]');
      if (await pauseButton.count() === 0) {
        pauseButton = page.getByRole('button', { name: /pause/i });
      }
      await expect(pauseButton).toBeVisible({ timeout: DEFAULT_TIMEOUT });
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error starting timer:', error);
    return false;
  }
};

/**
 * Pauses the timer
 * Returns true if the timer was successfully paused
 */
export const pauseTimer = async (page: Page): Promise<boolean> => {
  try {
    // Try to find the pause button using data-testid first, then fall back to role
    let pauseButton = page.locator('[data-testid="pause-button"]');
    if (await pauseButton.count() === 0) {
      pauseButton = page.getByRole('button', { name: /pause/i });
    }
    
    if (await pauseButton.isVisible({ timeout: DEFAULT_TIMEOUT })) {
      await pauseButton.click();
      
      // Verify timer paused (resume button should be visible)
      // Try to find the resume button using data-testid first, then fall back to role
      let resumeButton = page.locator('[data-testid="start-button"]');
      if (await resumeButton.count() === 0) {
        resumeButton = page.getByRole('button', { name: /resume/i });
      }
      await expect(resumeButton).toBeVisible({ timeout: DEFAULT_TIMEOUT });
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error pausing timer:', error);
    return false;
  }
};

/**
 * Resets the timer
 * Returns true if the timer was successfully reset
 */
export const resetTimer = async (page: Page): Promise<boolean> => {
  try {
    // Try to find the reset button using data-testid first, then fall back to role
    let resetButton = page.locator('[data-testid="reset-button"]');
    if (await resetButton.count() === 0) {
      resetButton = page.getByRole('button', { name: /reset/i });
    }
    
    if (await resetButton.isVisible({ timeout: DEFAULT_TIMEOUT })) {
      await resetButton.click();
      
      // Verify timer reset (start button should be visible)
      // Try to find the start button using data-testid first, then fall back to role
      let startButton = page.locator('[data-testid="start-button"]');
      if (await startButton.count() === 0) {
        startButton = page.getByRole('button', { name: /start/i });
      }
      await expect(startButton).toBeVisible({ timeout: DEFAULT_TIMEOUT });
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error resetting timer:', error);
    return false;
  }
};

/**
 * Selects a phase by index
 * Returns true if the phase was successfully selected
 */
export const selectPhase = async (page: Page, phaseIndex: number): Promise<boolean> => {
  try {
    // First, make sure we're not using strict mode for this locator since we know there are multiple phase buttons
    // Use a more specific selector with nth-child to target the specific phase button
    const phaseButtonSelector = `.phase-button:nth-child(${phaseIndex + 1})`;
    
    // Try to find the button by its aria-label which includes the phase number
    const phaseButtonByLabel = page.getByRole('button', { name: `Select phase ${phaseIndex + 1}` });
    
    // Check if the button exists using the role selector first
    if (await phaseButtonByLabel.count() > 0) {
      console.log(`Found phase button ${phaseIndex + 1} using role selector`);
      await phaseButtonByLabel.click();
    } else {
      // Fall back to the nth-child selector if role selector doesn't work
      console.log(`Trying to find phase button ${phaseIndex + 1} using CSS selector`);
      const phaseButton = page.locator(phaseButtonSelector);
      await expect(phaseButton).toBeVisible({ timeout: DEFAULT_TIMEOUT });
      await phaseButton.click();
    }
    
    // Wait a moment for the phase to be selected
    await page.waitForTimeout(1000);
    
    // Look for phase info using the data-testid
    const phaseTitle = page.locator('[data-testid="phase-title"]');
    await expect(phaseTitle).toBeVisible({ timeout: DEFAULT_TIMEOUT });
    
    // The phase title should contain the phase number
    const phaseTitleText = await phaseTitle.textContent();
    console.log(`Phase title after selection: ${phaseTitleText}`);
    
    if (!phaseTitleText) {
      console.error('Phase title text is null or empty');
      return false;
    }
    
    // Verify the phase number is displayed correctly (should be 1-indexed)
    // The phase title format is "Phase X: Description" where X is the phase number
    console.log(`Checking if phase title contains Phase ${phaseIndex + 1}`);
    const hasCorrectPhase = phaseTitleText.includes(`Phase ${phaseIndex + 1}:`);
    
    if (!hasCorrectPhase) {
      console.error(`Phase title does not contain expected phase number ${phaseIndex + 1}`);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error selecting phase:', error);
    return false;
  }
};

/**
 * Sets the volume level
 * Returns true if the volume was successfully set
 */
export const setVolume = async (page: Page, volume: number): Promise<boolean> => {
  try {
    // Volume should be between 0 and 100
    if (volume < 0 || volume > 100) {
      return false;
    }
    
    // First ensure audio is enabled
    await enableAudio(page);
    
    // Try to find the volume slider using data-testid first, then fall back to aria-label
    let volumeSlider = page.locator('input[data-testid="volume-slider"]');
    if (await volumeSlider.count() === 0) {
      volumeSlider = page.locator('input[aria-label*="volume"]');
    }
    
    if (await volumeSlider.isVisible({ timeout: DEFAULT_TIMEOUT })) {
      // Use evaluate for more reliable slider interaction
      await volumeSlider.evaluate((el: HTMLInputElement, value: number) => {
        el.value = value.toString();
        el.dispatchEvent(new Event('input'));
        el.dispatchEvent(new Event('change'));
      }, volume);
      
      // Wait a moment for the UI to update
      await page.waitForTimeout(500);
      
      // Verify volume changed - try with data-testid first, then fall back to text content
      const volumeValueLocator = page.locator('[data-testid="volume-value"]');
      if (await volumeValueLocator.count() > 0) {
        await expect(volumeValueLocator).toContainText(`${volume}%`, { timeout: DEFAULT_TIMEOUT });
      } else {
        await expect(page.locator(`text=${volume}%`)).toBeVisible({ timeout: DEFAULT_TIMEOUT });
      }
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error setting volume:', error);
    return false;
  }
};

/**
 * Sets the mantra pace (BPM)
 * Returns true if the pace was successfully set
 */
export const setMantraPace = async (page: Page, pace: number): Promise<boolean> => {
  try {
    // Pace should be between 24 and 120
    if (pace < 24 || pace > 120) {
      return false;
    }
    
    // Find the pace slider using data-testid first, then fall back to id
    let paceSlider = page.locator('[data-testid="mantra-pace-slider"]');
    if (await paceSlider.count() === 0) {
      paceSlider = page.locator('#mantra-pace');
    }
    
    if (await paceSlider.isVisible({ timeout: DEFAULT_TIMEOUT })) {
      // Use evaluate for more reliable slider interaction
      await paceSlider.evaluate((el: HTMLInputElement, value: number) => {
        el.value = value.toString();
        el.dispatchEvent(new Event('input'));
        el.dispatchEvent(new Event('change'));
      }, pace);
      
      // Wait a moment for the UI to update
      await page.waitForTimeout(500);
      
      // Try to find the pace value using data-testid first
      const paceValueLocator = page.locator('[data-testid="mantra-pace-value"]');
      if (await paceValueLocator.count() > 0) {
        await expect(paceValueLocator).toContainText(`${pace}`, { timeout: DEFAULT_TIMEOUT });
      } else {
        // Fall back to looking for the BPM text anywhere on the page
        await expect(page.locator(`text=${pace} BPM`)).toBeVisible({ timeout: DEFAULT_TIMEOUT });
      }
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error setting mantra pace:', error);
    return false;
  }
};

/**
 * Checks if wake lock is active
 * Returns true if wake lock is active, false if inactive or not supported
 */
export const isWakeLockActive = async (page: Page): Promise<boolean> => {
  try {
    // Try to find the wake lock indicator using data-testid first, then fall back to class
    let wakeLockIndicator = page.locator('[data-testid="wake-lock-active"]');
    if (await wakeLockIndicator.count() === 0) {
      wakeLockIndicator = page.locator('.w-2.h-2.rounded-full.bg-green-500');
    }
    return await wakeLockIndicator.isVisible({ timeout: 2000 });
  } catch (error) {
    console.error('Error checking wake lock status:', error);
    return false;
  }
};

/**
 * Toggles the settings sidebar
 * Returns true if the settings sidebar was successfully toggled
 */
export const toggleSettings = async (page: Page): Promise<boolean> => {
  try {
    // Try to find the settings toggle button using data-testid first, then fall back to text content
    let settingsToggle = page.locator('[data-testid="settings-toggle"]');
    if (await settingsToggle.count() === 0) {
      settingsToggle = page.locator('button:has-text("Settings")');
    }
    
    if (await settingsToggle.isVisible({ timeout: DEFAULT_TIMEOUT })) {
      await settingsToggle.click();
      
      // Wait a moment for the sidebar to toggle
      await page.waitForTimeout(500);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error toggling settings:', error);
    return false;
  }
};
