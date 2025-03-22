<script lang="ts">
	import { soundStore } from '$lib/stores/soundStore';
	import { Music } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { getSoundSettings } from '$lib/services/storageService';

	// Available musical keys - limited to D, E, F, G, and A
	const musicalKeys = [
		{ id: 'D', name: 'D' },
		{ id: 'E', name: 'E' },
		{ id: 'F', name: 'F' },
		{ id: 'G', name: 'G' },
		{ id: 'A', name: 'A (default)' }
	];

	// Base pattern intervals (relative to the key)
	const basePattern = [2, 0, -2, 0]; // E, D, C, D in the key of C is +2, 0, -2, 0 semitones

	// Fixed octave for all notes - Octave 2 is best for most people's vocal range
	const fixedOctave = 3; // Octave 2 in musical notation is actually 3 in Tone.js

	// Current key setting with default
	let selectedKey = 'A';
	// Flag to prevent reactive updates during initialization
	let isInitialized = false;
	// Flag to prevent unnecessary updates when we're the ones changing the pitches
	let isUpdatingPitches = false;

	// Load saved key setting from storage service
	const loadSavedSettings = () => {
		if (!browser) return;

		try {
			const soundSettings = getSoundSettings();
			if (soundSettings.mantraPitches && soundSettings.mantraPitches.length === 4) {
				const firstNote = soundSettings.mantraPitches[0];
				if (firstNote) {
					const keyPart = extractKey(firstNote);
					if (keyPart && musicalKeys.some((k) => k.id === keyPart)) {
						selectedKey = keyPart;
					}
				}
			}
		} catch (error) {
			console.error('Error loading pitch settings:', error);
		}
	};

	// Function to extract key from a note string
	const extractKey = (note: string) => {
		// Handle notes with sharps (e.g., C#3)
		let keyPart;

		if (note.includes('#')) {
			keyPart = note.substring(0, 2);
		} else {
			keyPart = note.substring(0, 1);
		}

		return keyPart;
	};

	// Function to generate pitches based on key
	const generatePitches = (key: string): string[] => {
		const allKeys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
		const baseKeyIndex = allKeys.findIndex((k) => k === key);

		if (baseKeyIndex === -1) {
			console.error(`Key not found: ${key}`);
			return $soundStore.mantraPitches; // Return current pitches if key not found
		}

		return basePattern.map((interval) => {
			// Calculate the note index in the chromatic scale
			let noteIndex = (baseKeyIndex + interval + 12) % 12;

			// Get the note name
			const noteName = allKeys[noteIndex];

			// Return the note with fixed octave
			return `${noteName}${fixedOctave}`;
		});
	};

	// Initialize from current state on mount
	onMount(() => {
		// First try to load saved settings
		loadSavedSettings();

		// Then check if we should apply the current pitches from the store
		if ($soundStore.mantraPitches && $soundStore.mantraPitches.length === 4) {
			const firstNote = $soundStore.mantraPitches[0];
			if (firstNote) {
				const keyPart = extractKey(firstNote);

				// Only update if the key from the store is different from our loaded settings
				if (keyPart !== selectedKey && musicalKeys.some((k) => k.id === keyPart)) {
					selectedKey = keyPart;
				}
			}
		}

		// Update the store with our settings if needed
		const expectedPitches = generatePitches(selectedKey);
		if (JSON.stringify(expectedPitches) !== JSON.stringify($soundStore.mantraPitches)) {
			isUpdatingPitches = true;
			soundStore.setPitches(expectedPitches);
			isUpdatingPitches = false;
		}

		isInitialized = true;
	});

	// Handle key selection change
	const handleKeyChange = (event: Event) => {
		if (event.target instanceof HTMLSelectElement) {
			selectedKey = event.target.value;
			const newPitches = generatePitches(selectedKey);

			// Set flag to prevent reactive updates while we're changing the pitches
			isUpdatingPitches = true;
			soundStore.setPitches(newPitches);
			isUpdatingPitches = false;
		}
	};

	// Subscribe to soundStore changes, but only after initialization and when we're not the ones updating
	$: if (
		isInitialized &&
		!isUpdatingPitches &&
		$soundStore.mantraPitches &&
		$soundStore.mantraPitches.length === 4
	) {
		// Only update UI if the pitches don't match what we would generate
		const expectedPitches = generatePitches(selectedKey);
		if (JSON.stringify(expectedPitches) !== JSON.stringify($soundStore.mantraPitches)) {
			// Pitches changed externally, update our UI
			const firstNote = $soundStore.mantraPitches[0];
			if (firstNote) {
				const keyPart = extractKey(firstNote);

				// Only update if the key exists in our options
				if (musicalKeys.some((k) => k.id === keyPart) && keyPart !== selectedKey) {
					selectedKey = keyPart;
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

		<div>
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
					Adjust the key to find comfortable tones for your voice.
				</p>
				<p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
					Higher keys (G, A) are typically better for higher voices, while lower keys (D, E) work well
					for lower voices.
				</p>
			</div>
		</div>

		<div class="mt-2 text-xs text-gray-500 dark:text-gray-400">
			<p>Current pitch pattern: {$soundStore.mantraPitches.join(', ')}</p>
		</div>
	</div>
</div>
