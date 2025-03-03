<script lang="ts">
	import { soundStore } from '$lib/stores/soundStore';
	let isInitializing = false;

	// Initialize sound when enabling
	async function toggleSound() {
		// Prevent multiple initialization attempts
		if (isInitializing) return;
		
		if (!$soundStore.isInitialized) {
			isInitializing = true;
			try {
				await soundStore.initialize();
			} catch (error) {
				console.error('Failed to initialize sound:', error);
			} finally {
				isInitializing = false;
			}
		}
		
		// Only toggle mute if initialization succeeded
		if ($soundStore.isInitialized) {
			soundStore.toggleMute();
		}
	}
</script>

<section class="px-6 pb-6">
	<div class="flex gap-3 items-center">
		<label class="cursor-pointer label flex items-center gap-2">
			<span class="label-text font-medium">Sound</span>
			<input
				type="checkbox"
				class="toggle toggle-primary"
				checked={!$soundStore.isMuted}
				on:click={toggleSound}
			/>
		</label>
		{#if !$soundStore.isMuted}
			<label class="label flex-1 flex items-center gap-2">
				<span class="label-text">Volume: {$soundStore.volumeLevel}</span>
				<input
					type="range"
					min="0"
					max="100"
					value={$soundStore.volumeLevel}
					class="range"
					step="1"
					on:input={(e) => {
						if (e.target instanceof HTMLInputElement) {
							soundStore.setVolume(parseInt(e.target.value));
						}
					}}
				/>
			</label>
		{/if}
	</div>
	{#if !$soundStore.isMuted && $soundStore.currentMantra}
		<div class="text-sm text-center mt-2 text-base-content/70">
			Current Mantra: {$soundStore.currentMantra}
		</div>
	{/if}
</section>
