import { browser } from '$app/environment';

/**
 * Interface representing the state of the wake lock
 */
export interface WakeLockState {
  wakeLock: WakeLockSentinel | null;
  wakeLockSupported: boolean;
  wakeLockActive: boolean;
}

/**
 * Checks if the Wake Lock API is supported in the current browser
 */
export const isWakeLockSupported = (): boolean => {
  return browser && 'wakeLock' in navigator;
};

/**
 * Requests a wake lock to prevent the device from sleeping
 * @returns A promise that resolves to the wake lock state
 */
export const requestWakeLock = async (): Promise<WakeLockState> => {
  const state: WakeLockState = {
    wakeLock: null,
    wakeLockSupported: isWakeLockSupported(),
    wakeLockActive: false
  };

  if (!state.wakeLockSupported) return state;

  try {
    state.wakeLock = await navigator.wakeLock.request('screen');
    state.wakeLockActive = true;

    // Add release event listener
    state.wakeLock.addEventListener('release', () => {
      state.wakeLockActive = false;
      console.log('Wake lock released');
    });

    console.log('Wake lock acquired');
  } catch (error) {
    console.error('Failed to acquire wake lock:', error);
    state.wakeLockActive = false;
  }

  return state;
};

/**
 * Releases the wake lock if active
 * @param wakeLock The current wake lock sentinel
 * @returns A promise that resolves when the wake lock is released
 */
export const releaseWakeLock = async (wakeLock: WakeLockSentinel | null): Promise<void> => {
  if (wakeLock) {
    try {
      await wakeLock.release();
      console.log('Wake lock released');
    } catch (error) {
      console.error('Failed to release wake lock:', error);
    }
  }
};
