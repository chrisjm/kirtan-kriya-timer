import type { TimerPhase } from './types';

// Default Kirtan Kriya meditation phases - fixed sequence
export const defaultPhases: TimerPhase[] = [
  { id: 'phase-1', action: 'Out-loud chant', durationMinutes: 2, volumeLevel: 90, completed: false },
  { id: 'phase-2', action: 'Whisper chant', durationMinutes: 2, volumeLevel: 60, completed: false },
  { id: 'phase-3', action: 'Mental chant', durationMinutes: 4, volumeLevel: 0, completed: false },
  { id: 'phase-4', action: 'Whisper chant', durationMinutes: 2, volumeLevel: 60, completed: false },
  { id: 'phase-5', action: 'Out-loud chant', durationMinutes: 2, volumeLevel: 90, completed: false }
];
