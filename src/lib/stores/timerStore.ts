import { writable, get } from 'svelte/store';
import { getCurrentPhaseIndex, setCurrentPhaseIndex } from '../services/storageService';
import { TimerStatus, type TimerState } from './timer/types.js';
import { type TimerTransition, validTransitions } from './timer/transitions.js';
import { defaultPhases } from './timer/defaultPhases';
import { createMasterTimer } from './timer/masterTimer';

// Validate state transition
function isValidTransition(from: TimerStatus, to: TimerStatus, action: TimerTransition['action']): boolean {
  return validTransitions.some(t => t.from === from && t.to === to && t.action === action);
}

// Create the writable store with enhanced initial state
const createTimerStore = () => {
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

  // Create master timer
  const masterTimer = createMasterTimer({
    onTick: (timeRemaining: number) => {
      update(state => ({ ...state, timeRemaining }));
    },
    onComplete: () => {
      const state = get({ subscribe });
      if (state.status === TimerStatus.RUNNING) {
        completeCurrentPhase();
      }
    }
  });

  const getStatus = function (): TimerStatus {
    return get({ subscribe }).status;
  }

  const startTimer = function () {
    update(state => {
      // Only start if we're not already running
      if (state.status === TimerStatus.RUNNING) {
        return state;
      }

      // Start the master timer
      masterTimer.start(state.timeRemaining);

      return {
        ...state,
        status: TimerStatus.RUNNING
      };
    });
  }

  const pauseTimer = function () {
    update(state => {
      // Only pause if currently running
      if (state.status !== TimerStatus.RUNNING) {
        return state;
      }

      // Pause the master timer
      masterTimer.pause();

      return {
        ...state,
        status: TimerStatus.PAUSED
      };
    });
  }

  const resetTimer = function () {
    update(state => {
      const newIndex = 0;
      setCurrentPhaseIndex(newIndex);

      // Reset completion status of all phases
      const resetPhases = state.phases.map(phase => ({
        ...phase,
        completed: false
      }));

      // Pause any running timer
      masterTimer.pause();

      return {
        ...state,
        phases: resetPhases,
        status: TimerStatus.IDLE,
        currentPhaseIndex: newIndex,
        timeRemaining: resetPhases[newIndex].durationMinutes * 60 * 1000
      };
    });
  }

  const completeCurrentPhase = function () {
    update(state => {
      // Only allow completion if we're running
      if (state.status !== TimerStatus.RUNNING) {
        return state;
      }

      // Mark current phase as completed and update all previous phases
      const updatedPhases = state.phases.map((phase, index) => ({
        ...phase,
        completed: index <= state.currentPhaseIndex
      }));

      // Check if this is the last phase
      const isLastPhase = state.currentPhaseIndex === state.phases.length - 1;

      if (isLastPhase) {
        // Validate and perform state transition
        if (!isValidTransition(state.status, TimerStatus.IDLE, 'COMPLETE_CYCLE')) {
          return state;
        }

        // Reset to initial state
        masterTimer.pause();
        return {
          ...state,
          phases: updatedPhases,
          status: TimerStatus.IDLE,
          timeRemaining: 0
        };
      } else {
        // Move to next phase
        const nextIndex = state.currentPhaseIndex + 1;
        const nextPhase = state.phases[nextIndex];

        // Validate and perform state transition
        if (!isValidTransition(state.status, TimerStatus.RUNNING, 'COMPLETE_PHASE')) {
          return state;
        }

        setCurrentPhaseIndex(nextIndex);

        // Start the timer for the next phase
        const nextPhaseTime = nextPhase.durationMinutes * 60 * 1000;
        masterTimer.start(nextPhaseTime);

        return {
          ...state,
          phases: updatedPhases,
          status: TimerStatus.RUNNING,
          currentPhaseIndex: nextIndex,
          timeRemaining: nextPhaseTime
        };
      }
    });
  }

  const selectPhase = function (index: number) {
    update(state => {
      if (index < 0 || index >= state.phases.length) {
        return state;
      }

      const selectedPhase = state.phases[index];
      const wasRunning = state.status === TimerStatus.RUNNING;
      const newTime = selectedPhase.durationMinutes * 60 * 1000;

      setCurrentPhaseIndex(index);

      // If it was running, start the timer for the new phase
      if (wasRunning) {
        masterTimer.start(newTime);
      } else {
        masterTimer.pause();
      }

      // Update completion status of phases
      const updatedPhases = state.phases.map((phase, i) => ({
        ...phase,
        completed: i < index
      }));

      return {
        ...state,
        phases: updatedPhases,
        currentPhaseIndex: index,
        timeRemaining: newTime,
        status: wasRunning ? TimerStatus.RUNNING : TimerStatus.IDLE
      };
    });
  }

  return {
    subscribe,
    getStatus,
    startTimer,
    pauseTimer,
    resetTimer,
    completeCurrentPhase,
    selectPhase,
  };
};

export const timerStore = createTimerStore();
