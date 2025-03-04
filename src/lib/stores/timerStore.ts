import { writable, get } from 'svelte/store';

// Event types for timer state changes
export enum TimerEventType {
  START = 'timer:start',
  PAUSE = 'timer:pause',
  RESET = 'timer:reset',
  PHASE_CHANGE = 'timer:phase_change',
  COMPLETE = 'timer:complete'
}

export interface TimerPhase {
  action: string;
  durationMinutes: number;
  volumeLevel: number;
}

export interface TimerState {
  phases: TimerPhase[];
  currentPhaseIndex: number;
  isRunning: boolean;
  timeRemaining: number;
}

export interface TimerEvent {
  type: TimerEventType;
  phase?: TimerPhase;
  phaseIndex?: number;
}

// Default Kirtan Kriya meditation phases - fixed sequence
const defaultPhases: TimerPhase[] = [
  { action: 'Out-loud chant', durationMinutes: 2, volumeLevel: 90 },
  { action: 'Whisper chant', durationMinutes: 2, volumeLevel: 60 },
  { action: 'Mental chant', durationMinutes: 4, volumeLevel: 0 },
  { action: 'Whisper chant', durationMinutes: 2, volumeLevel: 60 },
  { action: 'Out-loud chant', durationMinutes: 2, volumeLevel: 90 }
];

// Create the writable store with initial state
const createTimerStore = () => {
  const initialState: TimerState = {
    phases: defaultPhases,
    currentPhaseIndex: 0,
    isRunning: false,
    timeRemaining: defaultPhases[0].durationMinutes * 60 * 1000
  };

  // Event listeners
  type EventCallback = (event: TimerEvent) => void;
  const listeners: Map<TimerEventType, EventCallback[]> = new Map();

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

  // Helper to emit events
  const emitEvent = (event: TimerEvent) => {
    const callbacks = listeners.get(event.type) || [];
    callbacks.forEach(callback => callback(event));
  };

  return {
    subscribe,

    // Event subscription system
    addEventListener: (type: TimerEventType, callback: EventCallback) => {
      const callbacks = listeners.get(type) || [];
      listeners.set(type, [...callbacks, callback]);

      // Return unsubscribe function
      return () => {
        const updatedCallbacks = (listeners.get(type) || []).filter(cb => cb !== callback);
        listeners.set(type, updatedCallbacks);
      };
    },

    startTimer: () => update(state => {
      const newState = { ...state, isRunning: true };
      saveState(newState);

      // Emit start event with current phase
      emitEvent({
        type: TimerEventType.START,
        phase: state.phases[state.currentPhaseIndex],
        phaseIndex: state.currentPhaseIndex
      });

      return newState;
    }),

    pauseTimer: () => update(state => {
      const newState = { ...state, isRunning: false };
      saveState(newState);

      // Emit pause event
      emitEvent({ type: TimerEventType.PAUSE });

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

      // Emit reset event with first phase
      emitEvent({
        type: TimerEventType.RESET,
        phase: state.phases[0],
        phaseIndex: 0
      });

      return newState;
    }),

    updateTimeRemaining: (timeRemaining: number) => update(state => {
      const newState = { ...state, timeRemaining };
      // Don't save every time update to avoid excessive writes
      return newState;
    }),

    nextPhase: () => update(state => {
      if (state.currentPhaseIndex >= state.phases.length - 1) {
        // If we're at the last phase, reset and emit completion
        const newState = {
          ...state,
          isRunning: false,
          currentPhaseIndex: 0,
          timeRemaining: state.phases[0].durationMinutes * 60 * 1000
        };
        saveState(newState);

        // Emit complete event
        emitEvent({ type: TimerEventType.COMPLETE });

        return newState;
      } else {
        // Move to next phase
        const nextIndex = state.currentPhaseIndex + 1;
        const nextPhase = state.phases[nextIndex];
        const newState = {
          ...state,
          currentPhaseIndex: nextIndex,
          timeRemaining: nextPhase.durationMinutes * 60 * 1000
        };
        saveState(newState);

        // Emit phase change event
        emitEvent({
          type: TimerEventType.PHASE_CHANGE,
          phase: nextPhase,
          phaseIndex: nextIndex
        });

        return newState;
      }
    }),

    selectPhase: (index: number) => update(state => {
      if (index < 0 || index >= state.phases.length) return state;

      const selectedPhase = state.phases[index];
      const newState = {
        ...state,
        currentPhaseIndex: index,
        timeRemaining: selectedPhase.durationMinutes * 60 * 1000
      };
      saveState(newState);

      // Emit phase change event
      emitEvent({
        type: TimerEventType.PHASE_CHANGE,
        phase: selectedPhase,
        phaseIndex: index
      });

      return newState;
    }),

    // Helper to get current phase
    getCurrentPhase: () => {
      const state = get({ subscribe });
      return state.phases[state.currentPhaseIndex];
    }
  };
};

export const timerStore = createTimerStore();
