<script lang="ts">
	import { soundStore, mantraNotes } from '$lib/stores/soundStore';
	import { Music } from 'lucide-svelte';
	import { onMount } from 'svelte';

	// Available musical keys
	const musicalKeys = [
		{ id: 'C', name: 'C' },
		{ id: 'C#', name: 'C#/Db' },
		{ id: 'D', name: 'D' },
		{ id: 'D#', name: 'D#/Eb' },
		{ id: 'E', name: 'E' },
		{ id: 'F', name: 'F' },
		{ id: 'F#', name: 'F#/Gb' },
		{ id: 'G', name: 'G' },
		{ id: 'G#', name: 'G#/Ab' },
		{ id: 'A', name: 'A' },
		{ id: 'A#', name: 'A#/Bb' },
		{ id: 'B', name: 'B' }
	];

	// Base pattern intervals (relative to the key)
	const basePattern = [2, 0, -2, 0]; // E, D, C, D in the key of C is +2, 0, -2, 0 semitones

	// Predefined octave ranges
	const octaveRanges = [
		{ id: 'octave1', name: 'Octave 1 (Low)', octave: 2 },
		{ id: 'octave2', name: 'Octave 2 (Medium)', octave: 3 },
		{ id: 'octave3', name: 'Octave 3 (High)', octave: 4 },
		{ id: 'octave4', name: 'Octave 4 (Very High)', octave: 5 }
	];

	// Current key and octave settings with defaults
	let selectedKey = 'E';
	let selectedOctave = 'octave2';
	// Flag to prevent reactive updates during initialization
	let isInitialized = false;

	// Function to extract key and octave from a note string
	const extractKeyAndOctave = (note: string) => {
		const keyPart = note.replace(/[0-9]/g, '');
		const octavePart = parseInt(note.replace(/[^0-9]/g, ''));
		return { keyPart, octavePart };
	};

	// Function to generate pitches based on key and octave
	const generatePitches = (key: string, octaveId: string): string[] => {
		const octave = octaveRanges.find((o) => o.id === octaveId)?.octave || 3;
		const keyIndex = musicalKeys.findIndex((k) => k.id === key);
		
		if (keyIndex === -1) {
			console.error(`Key not found: ${key}`);
			return $soundStore.mantraPitches; // Return current pitches if key not found
		}
		
		return basePattern.map((interval) => {
			// Calculate the note index (0-11) in the chromatic scale
			let noteIndex = (keyIndex + interval + 12) % 12;
			// Get the note name
			const noteName = musicalKeys[noteIndex].id;
			// For sharps, use the first character (e.g., C# not Db)
			const cleanNoteName = noteName.includes('#') ? noteName.substring(0, 2) : noteName;
			// Return the note with octave
			return `${cleanNoteName}${octave}`;
		});
	};

	// Initialize from current state on mount
	onMount(() => {
		if ($soundStore.mantraPitches && $soundStore.mantraPitches.length === 4) {
			const firstNote = $soundStore.mantraPitches[0];
			if (firstNote) {
				const { keyPart, octavePart } = extractKeyAndOctave(firstNote);
				
				// Set the key if it exists in our options
				if (musicalKeys.some(k => k.id === keyPart)) {
					selectedKey = keyPart;
				}
				
				// Set the octave if it exists in our ranges
				const matchingOctave = octaveRanges.find(o => o.octave === octavePart);
				if (matchingOctave) {
					selectedOctave = matchingOctave.id;
				}
			}
		}
		
		isInitialized = true;
	});

	// Handle key selection change
	const handleKeyChange = (event: Event) => {
		if (event.target instanceof HTMLSelectElement) {
			selectedKey = event.target.value;
			const newPitches = generatePitches(selectedKey, selectedOctave);
			soundStore.setPitches(newPitches);
		}
	};

	// Handle octave selection change
	const handleOctaveChange = (event: Event) => {
		if (event.target instanceof HTMLSelectElement) {
			selectedOctave = event.target.value;
			const newPitches = generatePitches(selectedKey, selectedOctave);
			soundStore.setPitches(newPitches);
		}
	};

	// Subscribe to soundStore changes, but only after initialization
	$: if (isInitialized && $soundStore.mantraPitches && $soundStore.mantraPitches.length === 4) {
		// Only update UI if the pitches don't match what we would generate
		const expectedPitches = generatePitches(selectedKey, selectedOctave);
		if (JSON.stringify(expectedPitches) !== JSON.stringify($soundStore.mantraPitches)) {
			// Pitches changed externally, update our UI
			const firstNote = $soundStore.mantraPitches[0];
			if (firstNote) {
				const { keyPart, octavePart } = extractKeyAndOctave(firstNote);
				
				// Only update if the key exists in our options
				if (musicalKeys.some(k => k.id === keyPart)) {
					selectedKey = keyPart;
				}
				
				// Only update if the octave exists in our ranges
				const matchingOctave = octaveRanges.find(o => o.octave === octavePart);
				if (matchingOctave) {
					selectedOctave = matchingOctave.id;
				}
			}
		}
	}
</script>

<div class="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
	<h3 class="text-lg font-medium mb-2">Mantra Pitch</h3>
	<div class="flex flex-col gap-4 w-full">
		<div class="flex items-center gap-2 text-sm font-medium">
			<Music class="h-4 w-4" />
			<span>Adjust Pitch Settings</span>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			<!-- Key Selection -->
			<div class="flex flex-col gap-1">
				<label for="key-selection" class="text-sm font-medium">Musical Key</label>
				<select
					id="key-selection"
					value={selectedKey}
					on:change={handleKeyChange}
					class="select select-bordered w-full text-sm h-9 bg-white dark:bg-gray-700"
					tabindex="0"
					aria-label="Select musical key"
				>
					{#each musicalKeys as key}
						<option value={key.id}>{key.name}</option>
					{/each}
				</select>
				<p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
					Adjust to match your vocal range
				</p>
			</div>

			<!-- Octave Selection -->
			<div class="flex flex-col gap-1">
				<label for="octave-selection" class="text-sm font-medium">Octave Range</label>
				<select
					id="octave-selection"
					value={selectedOctave}
					on:change={handleOctaveChange}
					class="select select-bordered w-full text-sm h-9 bg-white dark:bg-gray-700"
					tabindex="0"
					aria-label="Select octave range"
				>
					{#each octaveRanges as range}
						<option value={range.id}>{range.name}</option>
					{/each}
				</select>
				<p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
					Higher octaves for higher voices
				</p>
			</div>
		</div>

		<div class="mt-2 text-xs text-gray-500 dark:text-gray-400">
			<p>Current pitch pattern: {mantraNotes.map((note) => note.pitch).join(', ')}</p>
			<p class="mt-1">
				Adjust the key to find comfortable tones for your voice. Higher keys are typically better for female voices, while lower keys work well for male voices.
			</p>
		</div>
	</div>
</div>
