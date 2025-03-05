import { writable, get } from 'svelte/store';
import { getCurrentPhaseIndex, setCurrentPhaseIndex } from '../services/storageService';
import { TimerStatus, type TimerPhase, type TimerState } from './timer/types.js';
import { type TimerTransition, validTransitions } from './timer/transitions.js';

// Validate state transition
function isValidTransition(from: TimerStatus, to: TimerStatus, action: TimerTransition['action']): boolean {
  return validTransitions.some(t => t.from === from && t.to === to && t.action === action);
}

// Default Kirtan Kriya meditation phases - fixed sequence
const defaultPhases: TimerPhase[] = [
  { id: 'phase-1', action: 'Out-loud chant', durationMinutes: 2, volumeLevel: 90, completed: false },
  { id: 'phase-2', action: 'Whisper chant', durationMinutes: 2, volumeLevel: 60, completed: false },
  { id: 'phase-3', action: 'Mental chant', durationMinutes: 4, volumeLevel: 0, completed: false },
  { id: 'phase-4', action: 'Whisper chant', durationMinutes: 2, volumeLevel: 60, completed: false },
  { id: 'phase-5', action: 'Out-loud chant', durationMinutes: 2, volumeLevel: 90, completed: false }
];

// Create the writable store with enhanced initial state
const createTimerStore = () => {
  // TODO: Check local storage?
  const initialPhaseIndex = getCurrentPhaseIndex();

  const initialState: TimerState = {
    phases: defaultPhases,
    currentPhaseIndex: initialPhaseIndex,
    status: TimerStatus.IDLE,
    timeRemaining: defaultPhases[initialPhaseIndex].durationMinutes * 60 * 1000,
    activeTimerId: undefined
  };

  // Create store with initial state
  const { subscribe, update } = writable<TimerState>(initialState);

  // Generate a unique timer ID for a phase
  const generateTimerId = (phaseIndex: number): string => {
    return `timer_phase_${phaseIndex}_${Date.now()}`;
  };

  return {
    subscribe,

    getStatus: (): TimerStatus => {
      return get({ subscribe }).status;
    },

    startTimer: () => update(state => {
      // Only start if we're not already running
      if (state.status === TimerStatus.RUNNING) {
        return state;
      }

      const timerId = generateTimerId(state.currentPhaseIndex);

      return {
        ...state,
        status: TimerStatus.RUNNING,
        activeTimerId: timerId
      };
    }),

    pauseTimer: () => update(state => {
      // Only pause if currently running
      if (state.status !== TimerStatus.RUNNING) {
        return state;
      }

      return {
        ...state,
        status: TimerStatus.PAUSED
      };
    }),

    resetTimer: () => update(state => {
      const newIndex = 0;
      setCurrentPhaseIndex(newIndex);

      // Reset completion status of all phases
      const resetPhases = state.phases.map(phase => ({
        ...phase,
        completed: false
      }));

      const newTimerId = generateTimerId(newIndex);

      return {
        ...state,
        phases: resetPhases,
        status: TimerStatus.IDLE,
        currentPhaseIndex: newIndex,
        timeRemaining: resetPhases[newIndex].durationMinutes * 60 * 1000,
        activeTimerId: newTimerId
      };
    }),

    updateTimeRemaining: (timeRemaining: number, timerId?: string) => update(state => {
      // Validate timer ID if provided
      if (timerId && state.activeTimerId !== timerId) {
        return state;
      }

      return { ...state, timeRemaining };
    }),

    completeCurrentPhase: () => update(state => {
      // Only allow completion if we're running
      if (state.status !== TimerStatus.RUNNING) {
        return state;
      }

      // Mark current phase as completed
      const updatedPhases = [...state.phases];
      updatedPhases[state.currentPhaseIndex] = {
        ...updatedPhases[state.currentPhaseIndex],
        completed: true
      };

      // Check if this is the last phase
      const isLastPhase = state.currentPhaseIndex === state.phases.length - 1;

      if (isLastPhase) {
        // Validate and perform state transition
        if (!isValidTransition(state.status, TimerStatus.IDLE, 'COMPLETE_CYCLE')) {
          return state;
        }

        // Reset to initial state
        return {
          ...state,
          status: TimerStatus.IDLE,
          timeRemaining: 0,
          activeTimerId: undefined
        };
      } else {
        // Move to next phase
        const nextIndex = state.currentPhaseIndex + 1;
        const nextPhase = state.phases[nextIndex];
        const newTimerId = generateTimerId(nextIndex);

        // Validate and perform state transition
        if (!isValidTransition(state.status, TimerStatus.RUNNING, 'COMPLETE_PHASE')) {
          return state;
        }

        setCurrentPhaseIndex(nextIndex);

        return {
          ...state,
          phases: updatedPhases,
          status: TimerStatus.RUNNING,
          currentPhaseIndex: nextIndex,
          timeRemaining: nextPhase.durationMinutes * 60 * 1000,
          activeTimerId: newTimerId
        };
      }
    }),

    selectPhase: (index: number) => update(state => {
      if (index < 0 || index >= state.phases.length) {
        return state;
      }

      const selectedPhase = state.phases[index];
      const wasRunning = state.status === TimerStatus.RUNNING;
      const newTimerId = generateTimerId(index);

      setCurrentPhaseIndex(index);

      return {
        ...state,
        currentPhaseIndex: index,
        timeRemaining: selectedPhase.durationMinutes * 60 * 1000,
        activeTimerId: newTimerId,
        // Maintain running state if it was running before
        status: wasRunning ? TimerStatus.RUNNING : TimerStatus.IDLE
      };
    }),
  };
};

export const timerStore = createTimerStore();
