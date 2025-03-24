import type { TimerPhase } from './types';

// Standard pattern for Kirtan Kriya meditation
const phasePattern = [
	{ id: 'phase-1', action: 'Out-loud chant', baseMinutes: 2, volumeLevel: 70 },
	{ id: 'phase-2', action: 'Whisper chant', baseMinutes: 2, volumeLevel: 40 },
	{ id: 'phase-3', action: 'Mental chant', baseMinutes: 4, volumeLevel: 0 },
	{ id: 'phase-4', action: 'Whisper chant', baseMinutes: 2, volumeLevel: 40 },
	{ id: 'phase-5', action: 'Out-loud chant', baseMinutes: 2, volumeLevel: 70 }
];

/**
 * Generate timer phases with durations based on a time multiplier
 * @param multiplier - Time multiplier (0.25, 0.5, 0.75, or 1)
 * @returns Array of TimerPhase objects with calculated duration
 */
export const generatePhases = (multiplier: number): TimerPhase[] => {
	return phasePattern.map((phase) => ({
		id: phase.id,
		action: phase.action,
		durationMinutes: phase.baseMinutes * multiplier,
		volumeLevel: phase.volumeLevel,
		completed: false
	}));
};

// Default phases with standard 1-minute multiplier
export const defaultPhases: TimerPhase[] = generatePhases(1);
