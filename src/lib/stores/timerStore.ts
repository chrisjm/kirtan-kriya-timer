import { writable, get } from 'svelte/store';
import { getCurrentPhaseIndex, setCurrentPhaseIndex } from '../services/storageService';

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
    currentPhaseIndex: getCurrentPhaseIndex(),
    isRunning: false,
    timeRemaining: defaultPhases[0].durationMinutes * 60 * 1000
  };

  // Event listeners
  type EventCallback = (event: TimerEvent) => void;
  const listeners: Map<TimerEventType, EventCallback[]> = new Map();

  const { subscribe, update } = writable<TimerState>(initialState);

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
      // Emit start event with current phase
      emitEvent({
        type: TimerEventType.START,
        phase: state.phases[state.currentPhaseIndex],
        phaseIndex: state.currentPhaseIndex
      });

      return { ...state, isRunning: true };
    }),

    pauseTimer: () => update(state => {
      // Emit pause event
      emitEvent({ type: TimerEventType.PAUSE });

      return { ...state, isRunning: false };
    }),

    resetTimer: () => update(state => {
      const newIndex = 0;
      setCurrentPhaseIndex(newIndex);

      // Emit reset event with first phase
      emitEvent({
        type: TimerEventType.RESET,
        phase: state.phases[newIndex],
        phaseIndex: newIndex
      });

      return {
        ...state,
        isRunning: false,
        currentPhaseIndex: newIndex,
        timeRemaining: state.phases[newIndex].durationMinutes * 60 * 1000
      };
    }),

    updateTimeRemaining: (timeRemaining: number) => update(state => {
      const newState = { ...state, timeRemaining };
      // Don't save every time update to avoid excessive writes
      return newState;
    }),

    nextPhase: () => update(state => {
      const nextIndex = state.currentPhaseIndex >= state.phases.length - 1 ? 0 : state.currentPhaseIndex + 1;
      const nextPhase = state.phases[nextIndex];
      
      setCurrentPhaseIndex(nextIndex);

      if (nextIndex === 0) {
        // Emit complete event at end of cycle
        emitEvent({ type: TimerEventType.COMPLETE });
      } else {
        // Emit phase change event
        emitEvent({
          type: TimerEventType.PHASE_CHANGE,
          phase: nextPhase,
          phaseIndex: nextIndex
        });
      }

      return {
        ...state,
        isRunning: nextIndex !== 0, // Stop if we've completed the cycle
        currentPhaseIndex: nextIndex,
        timeRemaining: nextPhase.durationMinutes * 60 * 1000
      };
    }),

    selectPhase: (index: number) => update(state => {
      if (index < 0 || index >= state.phases.length) return state;

      const selectedPhase = state.phases[index];
      setCurrentPhaseIndex(index);

      // Emit phase change event
      emitEvent({
        type: TimerEventType.PHASE_CHANGE,
        phase: selectedPhase,
        phaseIndex: index
      });

      return {
        ...state,
        currentPhaseIndex: index,
        timeRemaining: selectedPhase.durationMinutes * 60 * 1000
      };
    }),

    // Helper to get current phase
    getCurrentPhase: () => {
      const state = get({ subscribe });
      return state.phases[state.currentPhaseIndex];
    }
  };
};

export const timerStore = createTimerStore();
