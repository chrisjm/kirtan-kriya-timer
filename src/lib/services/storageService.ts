type Theme = 'light' | 'dark' | 'auto';

interface StorageState {
  currentPhaseIndex: number;
  soundVolume: number;
  isMuted: boolean;
  theme?: Theme;
}

const STORAGE_KEY = 'kirtan-kriya-settings';

const defaultState: StorageState = {
  currentPhaseIndex: 0,
  soundVolume: 70,
  isMuted: true,
  theme: 'auto'
};

function getState(): StorageState {
  if (typeof window === 'undefined') return defaultState;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : defaultState;
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return defaultState;
  }
}

function setState(partialState: Partial<StorageState>): void {
  if (typeof window === 'undefined') return;

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

export function getSoundSettings(): { volume: number; isMuted: boolean } {
  const state = getState();
  return {
    volume: state.soundVolume,
    isMuted: state.isMuted
  };
}

export function setSoundSettings(settings: { volume?: number; isMuted?: boolean }): void {
  const updates: Partial<StorageState> = {};
  if (settings.volume !== undefined) updates.soundVolume = settings.volume;
  if (settings.isMuted !== undefined) updates.isMuted = settings.isMuted;
  setState(updates);
}

export function getTheme(): Theme {
  return getState().theme ?? 'auto';
}

export function setTheme(theme: Theme): void {
  setState({ theme });
}
