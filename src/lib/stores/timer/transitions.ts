import { TimerStatus } from './types';

// State machine transitions
export type TimerTransition = {
  from: TimerStatus;
  to: TimerStatus;
  action: 'START' | 'PAUSE' | 'RESET' | 'COMPLETE_PHASE' | 'COMPLETE_CYCLE';
};

// Valid state transitions
export const validTransitions: TimerTransition[] = [
  { from: TimerStatus.IDLE, to: TimerStatus.RUNNING, action: 'START' },
  { from: TimerStatus.RUNNING, to: TimerStatus.PAUSED, action: 'PAUSE' },
  { from: TimerStatus.PAUSED, to: TimerStatus.RUNNING, action: 'START' },
  { from: TimerStatus.RUNNING, to: TimerStatus.RUNNING, action: 'COMPLETE_PHASE' },
  { from: TimerStatus.RUNNING, to: TimerStatus.IDLE, action: 'COMPLETE_CYCLE' },
  { from: TimerStatus.RUNNING, to: TimerStatus.IDLE, action: 'RESET' },
  { from: TimerStatus.PAUSED, to: TimerStatus.IDLE, action: 'RESET' }
];

// Validate state transition
export const isValidTransition = (
  from: TimerStatus,
  to: TimerStatus,
  action: TimerTransition['action']
): boolean => {
  return validTransitions.some(t => t.from === from && t.to === to && t.action === action);
};
