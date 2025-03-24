<script lang="ts">
	import { soundStore, mantraNotes } from '$lib/stores/soundStore';
	import { createAudioEngine } from '$lib/services/audioService';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { navigationStore } from '$lib/stores/navigationStore';
	import AudioInitializer from '$lib/components/audio/AudioInitializer.svelte';
	import VolumeControls from '$lib/components/audio/VolumeControls.svelte';

	let isInitialized = false;

	onMount(() => {
		const unsubscribe = navigationStore.subscribe((state) => {
			if (state.audioWasInitialized && !isInitialized && browser) {
				console.log('Restoring audio initialization state');
				initializeAudio();
			}
		});

		return unsubscribe;
	});

	const initializeAudio = async () => {
		if (!browser || isInitialized) return;

		try {
			const audioEngine = await createAudioEngine(
				$soundStore.volumeLevel,
				mantraNotes,
				$soundStore.mantraPace,
				(index) => soundStore.updateCurrentMantra(index)
			);

			soundStore.setAudioEngine(audioEngine);
			isInitialized = true;

			navigationStore.setAudioInitialized(true);
			return true;
		} catch (error) {
			console.error('Failed to create audio engine:', error);
			isInitialized = false;
			return false;
		}
	};

	const handleAudioInitialized = async (event: CustomEvent<{ success: boolean }>) => {
		if (!event.detail.success || !browser) return;
		await initializeAudio();
	};
</script>

<div class="flex flex-col gap-4 p-4 bg-base-200 rounded-lg shadow-sm">
	{#if isInitialized}
		<VolumeControls />
	{/if}

	<AudioInitializer {isInitialized} on:initialized={handleAudioInitialized} />
</div>
