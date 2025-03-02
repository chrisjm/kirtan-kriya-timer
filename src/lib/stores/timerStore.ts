import { writable } from 'svelte/store';

export interface TimerPhase {
  action: string;
  durationMinutes: number;
  volume: number;
}

export interface TimerState {
  phases: TimerPhase[];
  currentPhaseIndex: number;
  isRunning: boolean;
  timeRemaining: number;
  soundEnabled: boolean;
  volumeLevel: number;
}

// Default Kirtan Kriya meditation phases - fixed sequence
const defaultPhases: TimerPhase[] = [
  { action: 'Out-loud chant', durationMinutes: 2, volume: 90 },
  { action: 'Whisper chant', durationMinutes: 2, volume: 60 },
  { action: 'Mental chant', durationMinutes: 4, volume: 30 },
  { action: 'Whisper chant', durationMinutes: 2, volume: 60 },
  { action: 'Out-loud chant', durationMinutes: 2, volume: 90 }
];

// Create the writable store with initial state
const createTimerStore = () => {
  const initialState: TimerState = {
    phases: defaultPhases,
    currentPhaseIndex: 0,
    isRunning: false,
    timeRemaining: defaultPhases[0].durationMinutes * 60 * 1000, // Convert minutes to milliseconds
    soundEnabled: false,
    volumeLevel: 70
  };

  const { subscribe, set, update } = writable<TimerState>(initialState);

  // Load saved state from localStorage if available
  if (typeof window !== 'undefined') {
    try {
      const savedState = localStorage.getItem('kirtan-kriya-timer-state');
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        set(parsedState);
      }
    } catch (error) {
      console.error('Error loading saved timer state:', error);
    }
  }

  // Helper to save state to localStorage
  const saveState = (state: TimerState) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('kirtan-kriya-timer-state', JSON.stringify(state));
      } catch (error) {
        console.error('Error saving timer state:', error);
      }
    }
  };

  return {
    subscribe,

    startTimer: () => update(state => {
      const newState = { ...state, isRunning: true };
      saveState(newState);
      return newState;
    }),

    pauseTimer: () => update(state => {
      const newState = { ...state, isRunning: false };
      saveState(newState);
      return newState;
    }),

    resetTimer: () => update(state => {
      const newState = {
        ...state,
        isRunning: false,
        currentPhaseIndex: 0,
        timeRemaining: state.phases[0].durationMinutes * 60 * 1000
      };
      saveState(newState);
      return newState;
    }),

    updateTimeRemaining: (timeRemaining: number) => update(state => {
      const newState = { ...state, timeRemaining };
      // Don't save every time update to avoid excessive writes
      return newState;
    }),

    nextPhase: () => update(state => {
      if (state.currentPhaseIndex >= state.phases.length - 1) {
        // If we're at the last phase, reset
        const newState = {
          ...state,
          isRunning: false,
          currentPhaseIndex: 0,
          timeRemaining: state.phases[0].durationMinutes * 60 * 1000
        };
        saveState(newState);
        return newState;
      } else {
        // Move to next phase
        const nextIndex = state.currentPhaseIndex + 1;
        const newState = {
          ...state,
          currentPhaseIndex: nextIndex,
          timeRemaining: state.phases[nextIndex].durationMinutes * 60 * 1000
        };
        saveState(newState);
        return newState;
      }
    }),

    selectPhase: (index: number) => update(state => {
      if (index < 0 || index >= state.phases.length) return state;

      const newState = {
        ...state,
        currentPhaseIndex: index,
        timeRemaining: state.phases[index].durationMinutes * 60 * 1000
      };
      saveState(newState);
      return newState;
    }),

    toggleSound: () => update(state => {
      const newState = { ...state, soundEnabled: !state.soundEnabled };
      saveState(newState);
      return newState;
    }),

    setVolumeLevel: (volumeLevel: number) => update(state => {
      const newState = { ...state, volumeLevel };
      saveState(newState);
      return newState;
    }),
  };
};

export const timerStore = createTimerStore();
