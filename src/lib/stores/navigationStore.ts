import { writable } from 'svelte/store';

// Store to track navigation and audio state across page transitions
interface NavigationState {
  audioWasInitialized: boolean;
  timerWasRunning: boolean;
}

// Create the writable store with initial state
const createNavigationStore = () => {
  // Initial state
  const initialState: NavigationState = {
    audioWasInitialized: false,
    timerWasRunning: false
  };

  const { subscribe, update, set } = writable<NavigationState>(initialState);

  return {
    subscribe,
    
    // Set audio initialization state
    setAudioInitialized: (isInitialized: boolean) => {
      update(state => ({
        ...state,
        audioWasInitialized: isInitialized
      }));
    },
    
    // Set timer running state
    setTimerRunning: (isRunning: boolean) => {
      update(state => ({
        ...state,
        timerWasRunning: isRunning
      }));
    },
    
    // Reset the store
    reset: () => set(initialState)
  };
};

export const navigationStore = createNavigationStore();
