<script lang="ts">
	import { soundStore, mantraNotes } from '$lib/stores/soundStore';
	import { createAudioEngine } from '$lib/services/audioService';
	import { Loader2, Speaker } from 'lucide-svelte';

	let isInitialized = false;
	let isLoading = false;

	async function initializeAudio() {
		if (isInitialized || isLoading) return;

		isLoading = true;
		try {
			const audioEngine = await createAudioEngine($soundStore.volumeLevel, mantraNotes, (index) =>
				soundStore.updateCurrentMantra(index)
			);
			soundStore.setAudioEngine(audioEngine);
			isInitialized = true;
		} catch (error) {
			console.error('Failed to initialize audio:', error);
		} finally {
			isLoading = false;
		}
	}
</script>

{#if !isInitialized}
	<div class="fixed bottom-4 right-4 z-50">
		<button
			class="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
			on:click={initializeAudio}
			disabled={isLoading}
			title="Initialize audio for meditation"
		>
			{#if isLoading}
				<Loader2 class="animate-spin h-5 w-5" />
			{:else}
				<Speaker class="h-5 w-5" />
			{/if}
			{isLoading ? 'Initializing...' : 'Initialize Audio'}
		</button>
	</div>
{/if}
