import * as Tone from 'tone';
import type { MantraNote } from '$lib/stores/soundStore';
import { browser } from '$app/environment';

export interface AudioEngine {
	synth: Tone.Synth;
	vol: Tone.Volume;
	loop: Tone.Loop;
	updatePitches: (mantraNotes: MantraNote[]) => void;
}

// Convert volume percentage to decibels for Tone.js
export const volumeToDecibels = (value: number): number => {
	const minDb = -48;
	const maxDb = 0;
	return Math.floor((value / 100) * (maxDb - minDb) + minDb);
};

export const createAudioEngine = async (
	initialVolume: number,
	mantraNotes: MantraNote[],
	mantraPace: number,
	onMantraChange: (index: number) => void
): Promise<AudioEngine> => {
	// Check if we're in a browser environment
	if (!browser) {
		throw new Error('Audio engine can only be created in a browser environment');
	}

	// Start with a clean audio context
	await Tone.start();
	// Initialize volume control
	const vol = new Tone.Volume(
		initialVolume !== null ? volumeToDecibels(initialVolume) : -10
	).toDestination();

	// Initialize synthesizer
	const synth = new Tone.Synth({
		oscillator: { type: 'sine' },
		envelope: {
			attack: 0.2,
			decay: 0.4,
			sustain: 0.5,
			release: 0.5
		}
	}).connect(vol);

	let noteIndex = 0;
	const noteDuration = '2n';

	// Create a loop that plays each mantra note in sequence
	const loop = new Tone.Loop((time) => {
		const currentNote = mantraNotes[noteIndex];
		synth.triggerAttackRelease(currentNote.pitch, noteDuration, time);
		onMantraChange(noteIndex);
		noteIndex = (noteIndex + 1) % mantraNotes.length;
	}, noteDuration);

	// Set BPM based on the mantraPace parameter
	Tone.getTransport().bpm.value = mantraPace;

	// Function to update pitches without recreating the engine
	const updatePitches = (newMantraNotes: MantraNote[]): void => {
		// Reset the note index to prevent out-of-bounds errors if the array length changes
		noteIndex = 0;

		// Update the mantraNotes reference
		// Since we're passing a reference to the mantraNotes array,
		// we need to make sure we're updating the same reference
		mantraNotes.length = 0;
		newMantraNotes.forEach((note) => mantraNotes.push(note));
	};

	return { synth, vol, loop, updatePitches };
};
