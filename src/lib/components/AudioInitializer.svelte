<!-- Audio initialization component -->
<script lang="ts">
	import { soundStore, mantraNotes } from '$lib/stores/soundStore';
	import { createAudioEngine } from '$lib/services/audioService';

	let isInitialized = false;
	let isLoading = false;

	async function initializeAudio() {
		if (isInitialized || isLoading) return;

		isLoading = true;
		try {
			const audioEngine = await createAudioEngine(
				$soundStore.volumeLevel,
				mantraNotes,
				(index) => soundStore.updateCurrentMantra(index)
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
				<svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
					<path
						class="opacity-75"
						fill="currentColor"
						d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
					></path>
				</svg>
			{:else}
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-5 w-5"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.414a5 5 0 001.414 1.414m0 0l4.243 4.243-1.414 1.414L4 17.657m13.657 0L13 23.414l-1.414-1.414L15.83 17.757m0 0a9 9 0 001.414-1.414"
					/>
				</svg>
			{/if}
			{isLoading ? 'Initializing...' : 'Initialize Audio'}
		</button>
	</div>
{/if}
