import { browser } from '$app/environment';

type Theme = 'light' | 'dark' | 'auto';

interface StorageState {
  currentPhaseIndex: number;
  soundVolume: number;
  isMuted: boolean;
  mantraPace: number;
  mantraPitches: string[];
  mantraKey: string;
  theme?: Theme;
}

const STORAGE_KEY = 'kirtan-kriya-settings';

const defaultState: StorageState = {
  currentPhaseIndex: 0,
  soundVolume: 70,
  isMuted: true,
  mantraPace: 68,
  mantraPitches: ['A3', 'G3', 'F3', 'G3'],
  mantraKey: 'G',
  theme: 'auto'
};

/**
 * Explicitly initializes the local storage with default values if it doesn't exist
 * Returns true if storage was initialized, false if it already existed
 */
export function initializeStorage(): boolean {
  if (!browser) return false;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultState));
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error initializing localStorage:', error);
    return false;
  }
}

function getState(): StorageState {
  if (!browser) return defaultState;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : defaultState;
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return defaultState;
  }
}

function setState(partialState: Partial<StorageState>): void {
  if (!browser) return;

  try {
    const currentState = getState();
    const newState = { ...currentState, ...partialState };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
  } catch (error) {
    console.error('Error writing to localStorage:', error);
  }
}

export function getCurrentPhaseIndex(): number {
  return getState().currentPhaseIndex;
}

export function setCurrentPhaseIndex(index: number): void {
  setState({ currentPhaseIndex: index });
}

export function getSoundSettings(): { volume: number; isMuted: boolean; mantraPace: number; mantraPitches: string[]; mantraKey: string } {
  const state = getState();
  return {
    volume: state.soundVolume,
    isMuted: state.isMuted,
    mantraPace: state.mantraPace,
    mantraPitches: state.mantraPitches ?? defaultState.mantraPitches,
    mantraKey: state.mantraKey ?? defaultState.mantraKey
  };
}

export function setSoundSettings(settings: { volume?: number; isMuted?: boolean; mantraPace?: number; mantraPitches?: string[]; mantraKey?: string }): void {
  const updates: Partial<StorageState> = {};
  if (settings.volume !== undefined) updates.soundVolume = settings.volume;
  if (settings.isMuted !== undefined) updates.isMuted = settings.isMuted;
  if (settings.mantraPace !== undefined) updates.mantraPace = settings.mantraPace;
  if (settings.mantraPitches !== undefined) updates.mantraPitches = settings.mantraPitches;
  if (settings.mantraKey !== undefined) updates.mantraKey = settings.mantraKey;
  setState(updates);
}

export function getTheme(): Theme {
  return getState().theme ?? 'auto';
}

export function setTheme(theme: Theme): void {
  setState({ theme });
}
