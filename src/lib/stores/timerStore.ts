import { writable, get } from 'svelte/store';
import { getCurrentPhaseIndex, setCurrentPhaseIndex } from '../services/storageService';

// Enhanced timer state management with explicit states
// Timer state machine states
export enum TimerStatus {
  IDLE = 'idle',      // Initial state or reset state
  RUNNING = 'running', // Timer actively counting down
  PAUSED = 'paused'   // Timer temporarily stopped
}

// State machine transitions
type TimerTransition = {
  from: TimerStatus;
  to: TimerStatus;
  action: 'START' | 'PAUSE' | 'RESET' | 'COMPLETE_PHASE' | 'COMPLETE_CYCLE';
};

// Valid state transitions
const validTransitions: TimerTransition[] = [
  { from: TimerStatus.IDLE, to: TimerStatus.RUNNING, action: 'START' },
  { from: TimerStatus.RUNNING, to: TimerStatus.PAUSED, action: 'PAUSE' },
  { from: TimerStatus.PAUSED, to: TimerStatus.RUNNING, action: 'START' },
  { from: TimerStatus.RUNNING, to: TimerStatus.RUNNING, action: 'COMPLETE_PHASE' },
  { from: TimerStatus.RUNNING, to: TimerStatus.IDLE, action: 'COMPLETE_CYCLE' },
  { from: TimerStatus.RUNNING, to: TimerStatus.IDLE, action: 'RESET' },
  { from: TimerStatus.PAUSED, to: TimerStatus.IDLE, action: 'RESET' }
];

// Validate state transition
function isValidTransition(from: TimerStatus, to: TimerStatus, action: TimerTransition['action']): boolean {
  return validTransitions.some(t => t.from === from && t.to === to && t.action === action);
}

// Event types for timer state changes
export enum TimerEventType {
  START = 'timer:start',
  PAUSE = 'timer:pause',
  RESET = 'timer:reset',
  PHASE_CHANGE = 'timer:phase_change',
  PHASE_COMPLETE = 'timer:phase_complete',
  MEDITATION_COMPLETE = 'timer:meditation_complete'
}

export interface TimerPhase {
  id: string; // Unique identifier for each phase
  action: string;
  durationMinutes: number;
  volumeLevel: number;
  completed?: boolean; // Track if this phase has been completed
}

export interface TimerState {
  phases: TimerPhase[];
  currentPhaseIndex: number;
  status: TimerStatus;
  timeRemaining: number;
  activeTimerId?: string; // Track the current active timer
}

export interface TimerEvent {
  type: TimerEventType;
  phase?: TimerPhase;
  phaseIndex?: number;
  timerId?: string;
}

// Default Kirtan Kriya meditation phases - fixed sequence
// DEBUG: Temporarily reduced phase durations for testing
const defaultPhases: TimerPhase[] = [
  { id: 'phase-1', action: 'Out-loud chant', durationMinutes: 0.1, volumeLevel: 90, completed: false },
  { id: 'phase-2', action: 'Whisper chant', durationMinutes: 0.1, volumeLevel: 60, completed: false },
  { id: 'phase-3', action: 'Mental chant', durationMinutes: 0.1, volumeLevel: 0, completed: false },
  { id: 'phase-4', action: 'Whisper chant', durationMinutes: 0.1, volumeLevel: 60, completed: false },
  { id: 'phase-5', action: 'Out-loud chant', durationMinutes: 0.1, volumeLevel: 90, completed: false }
];

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

  // Event listeners with enhanced typings
  type EventCallback = (event: TimerEvent) => void;
  const listeners: Map<TimerEventType, EventCallback[]> = new Map();

  // Create store with initial state
  const { subscribe, update } = writable<TimerState>(initialState);

  // Debug helper
  const debug = (message: string, data?: Record<string, unknown>): void => {
    console.log(`[TimerStore] ${message}`, data || '');
  };

  // Helper to emit events with enhanced logging
  const emitEvent = (event: TimerEvent): void => {
    debug(`Emitting event: ${event.type}`, {
      phaseIndex: event.phaseIndex,
      timerId: event.timerId
    });

    const callbacks = listeners.get(event.type) || [];
    callbacks.forEach(callback => callback(event));
  };

  // Generate a unique timer ID for a phase
  const generateTimerId = (phaseIndex: number): string => {
    return `timer_phase_${phaseIndex}_${Date.now()}`;
  };

  return {
    subscribe,

    // Enhanced event subscription system
    addEventListener: (type: TimerEventType, callback: EventCallback): (() => void) => {
      debug(`Adding event listener for: ${type}`);
      const callbacks = listeners.get(type) || [];
      listeners.set(type, [...callbacks, callback]);

      // Return unsubscribe function
      return () => {
        debug(`Removing event listener for: ${type}`);
        const updatedCallbacks = (listeners.get(type) || []).filter(cb => cb !== callback);
        listeners.set(type, updatedCallbacks);
      };
    },

    // Remove all listeners
    removeAllEventListeners: (): void => {
      debug('Removing all event listeners');
      listeners.clear();
    },

    // Get current timer status
    getStatus: (): TimerStatus => {
      return get({ subscribe }).status;
    },

    // Start timer with enhanced state management
    startTimer: () => update(state => {
      // Only start if we're not already running
      if (state.status === TimerStatus.RUNNING) {
        debug('Timer already running, ignoring start command');
        return state;
      }

      const currentPhase = state.phases[state.currentPhaseIndex];
      const timerId = generateTimerId(state.currentPhaseIndex);

      // Emit start event with enhanced data
      emitEvent({
        type: TimerEventType.START,
        phase: currentPhase,
        phaseIndex: state.currentPhaseIndex,
        timerId
      });

      debug('Starting timer', {
        phaseIndex: state.currentPhaseIndex,
        timerId,
        phaseName: currentPhase.action
      });

      return {
        ...state,
        status: TimerStatus.RUNNING,
        activeTimerId: timerId
      };
    }),

    // Pause timer with enhanced state management
    pauseTimer: () => update(state => {
      // Only pause if currently running
      if (state.status !== TimerStatus.RUNNING) {
        debug('Timer not running, ignoring pause command');
        return state;
      }

      // Emit pause event with current timer ID
      emitEvent({
        type: TimerEventType.PAUSE,
        timerId: state.activeTimerId
      });

      debug('Pausing timer', {
        timerId: state.activeTimerId
      });

      return {
        ...state,
        status: TimerStatus.PAUSED
      };
    }),

    // Reset timer with enhanced cleanup
    resetTimer: () => update(state => {
      const newIndex = 0;
      setCurrentPhaseIndex(newIndex);

      // Reset completion status of all phases
      const resetPhases = state.phases.map(phase => ({
        ...phase,
        completed: false
      }));

      const newTimerId = generateTimerId(newIndex);

      // Emit reset event with enhanced data
      emitEvent({
        type: TimerEventType.RESET,
        phase: resetPhases[newIndex],
        phaseIndex: newIndex,
        timerId: newTimerId
      });

      debug('Resetting timer', {
        newPhaseIndex: newIndex,
        newTimerId
      });

      return {
        ...state,
        phases: resetPhases,
        status: TimerStatus.IDLE,
        currentPhaseIndex: newIndex,
        timeRemaining: resetPhases[newIndex].durationMinutes * 60 * 1000,
        activeTimerId: newTimerId
      };
    }),

    // Update time with timer ID validation
    updateTimeRemaining: (timeRemaining: number, timerId?: string) => update(state => {
      // Validate timer ID if provided
      if (timerId && state.activeTimerId !== timerId) {
        debug('Timer ID mismatch, ignoring time update', {
          providedTimerId: timerId,
          activeTimerId: state.activeTimerId
        });
        return state;
      }

      return { ...state, timeRemaining };
    }),

    // Mark current phase as completed and handle phase transition
    completeCurrentPhase: () => update(state => {
      // Only allow completion if we're running
      if (state.status !== TimerStatus.RUNNING) {
        debug('Cannot complete phase when not running', { currentStatus: state.status });
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

      // Emit phase complete event
      emitEvent({
        type: TimerEventType.PHASE_COMPLETE,
        phase: updatedPhases[state.currentPhaseIndex],
        phaseIndex: state.currentPhaseIndex,
        timerId: state.activeTimerId
      });

      debug('Phase completed', {
        phaseIndex: state.currentPhaseIndex,
        phaseName: updatedPhases[state.currentPhaseIndex].action,
        isLastPhase
      });

      if (isLastPhase) {
        // Complete the meditation cycle
        emitEvent({
          type: TimerEventType.MEDITATION_COMPLETE,
          timerId: state.activeTimerId
        });

        // Validate and perform state transition
        if (!isValidTransition(state.status, TimerStatus.IDLE, 'COMPLETE_CYCLE')) {
          debug('Invalid state transition', { from: state.status, to: TimerStatus.IDLE });
          return state;
        }

        // Reset to initial state
        return {
          ...state,
          phases: updatedPhases.map(phase => ({ ...phase, completed: false })),
          status: TimerStatus.IDLE,
          currentPhaseIndex: 0,
          timeRemaining: state.phases[0].durationMinutes * 60 * 1000,
          activeTimerId: undefined
        };
      } else {
        // Move to next phase
        const nextIndex = state.currentPhaseIndex + 1;
        const nextPhase = state.phases[nextIndex];
        const newTimerId = generateTimerId(nextIndex);

        // Validate and perform state transition
        if (!isValidTransition(state.status, TimerStatus.RUNNING, 'COMPLETE_PHASE')) {
          debug('Invalid state transition', { from: state.status, to: TimerStatus.RUNNING });
          return state;
        }

        setCurrentPhaseIndex(nextIndex);

        // Emit phase change event
        emitEvent({
          type: TimerEventType.PHASE_CHANGE,
          phase: nextPhase,
          phaseIndex: nextIndex,
          timerId: newTimerId
        });

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



    // Enhanced phase selection with state validation
    selectPhase: (index: number) => update(state => {
      if (index < 0 || index >= state.phases.length) {
        debug('Invalid phase index, ignoring selection', { requestedIndex: index });
        return state;
      }



      const selectedPhase = state.phases[index];
      const wasRunning = state.status === TimerStatus.RUNNING;
      const newTimerId = generateTimerId(index);

      setCurrentPhaseIndex(index);

      // Emit phase change event
      emitEvent({
        type: TimerEventType.PHASE_CHANGE,
        phase: selectedPhase,
        phaseIndex: index,
        timerId: newTimerId
      });

      debug('Phase manually selected', {
        phaseIndex: index,
        wasRunning,
        newTimerId
      });

      return {
        ...state,
        currentPhaseIndex: index,
        timeRemaining: selectedPhase.durationMinutes * 60 * 1000,
        activeTimerId: newTimerId,
        // Maintain running state if it was running before
        status: wasRunning ? TimerStatus.RUNNING : TimerStatus.IDLE
      };
    }),

    // Explicitly set timer state for testing or recovery
    setTimerState: (newState: Partial<TimerState>) => update(state => {
      return { ...state, ...newState };
    }),

    // Helper to get current phase with enhanced type safety
    getCurrentPhase: (): TimerPhase => {
      const state = get({ subscribe });
      return state.phases[state.currentPhaseIndex];
    },

    // Helper to get active timer ID
    getActiveTimerId: (): string | undefined => {
      return get({ subscribe }).activeTimerId;
    },

    // Check if a specific timer ID is the active one
    isActiveTimerId: (timerId: string): boolean => {
      return get({ subscribe }).activeTimerId === timerId;
    }
  };
};

export const timerStore = createTimerStore();
