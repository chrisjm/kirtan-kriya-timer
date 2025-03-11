<script lang="ts">
	import { soundStore, mantraNotes } from '$lib/stores/soundStore';
	import { createAudioEngine } from '$lib/services/audioService';
	import { onDestroy } from 'svelte';
	import { browser } from '$app/environment';

	// Import the new components
	import AudioInitializer from '$lib/components/audio/AudioInitializer.svelte';
	import VolumeControls from '$lib/components/audio/VolumeControls.svelte';

	let isInitialized = false;

	/**
	 * Handle audio initialization event from AudioInitializer component
	 */
	const handleAudioInitialized = async (event: CustomEvent<{ success: boolean }>) => {
		if (!event.detail.success || !browser) return;

		try {
			// Create the audio engine with the current sound settings
			const audioEngine = await createAudioEngine(
				$soundStore.volumeLevel,
				mantraNotes,
				$soundStore.mantraPace,
				(index) => soundStore.updateCurrentMantra(index)
			);

			// Set the audio engine in the sound store
			soundStore.setAudioEngine(audioEngine);
			isInitialized = true;
		} catch (error) {
			console.error('Failed to create audio engine:', error);
			isInitialized = false;
		}
	};

	// Clean up on component destruction
	onDestroy(() => {
		if (browser && isInitialized) {
			soundStore.cleanup();
		}
	});
</script>

<div class="flex flex-col gap-4 p-4 bg-base-200 rounded-lg shadow-sm">
	<!-- Sound Controls Section -->
	{#if isInitialized}
		<VolumeControls />
	{/if}

	<!-- Audio Initialization Section -->
	<AudioInitializer {isInitialized} on:initialized={handleAudioInitialized} />
</div>
