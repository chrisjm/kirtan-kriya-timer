// Timer state machine states
export enum TimerStatus {
  IDLE = 'idle',      // Initial state or reset state
  RUNNING = 'running', // Timer actively counting down
  PAUSED = 'paused'   // Timer temporarily stopped
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
  id: string;
  action: string;
  durationMinutes: number;
  volumeLevel: number;
  completed?: boolean;
}

export interface TimerState {
  phases: TimerPhase[];
  currentPhaseIndex: number;
  status: TimerStatus;
  timeRemaining: number;
  activeTimerId?: string;
  meditationCompleted: boolean;
}

export interface TimerEvent {
  type: TimerEventType;
  phase?: TimerPhase;
  phaseIndex?: number;
  timerId?: string;
}

export type EventCallback = (event: TimerEvent) => void;
