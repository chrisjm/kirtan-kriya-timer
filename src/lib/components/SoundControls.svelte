<script lang="ts">
	import { timerStore } from '$lib/stores/timerStore';
	import { soundManager } from '$lib/utils/soundUtils';

	// Initialize sound when enabling
	async function toggleSound() {
		if (!$timerStore.soundEnabled) {
			try {
				await soundManager.initialize();
				timerStore.toggleSound();
			} catch (error) {
				console.error('Failed to initialize sound:', error);
			}
		} else {
			timerStore.toggleSound();
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
				checked={$timerStore.soundEnabled}
				on:click={toggleSound}
			/>
		</label>
		{#if $timerStore.soundEnabled}
			<label class="label flex-1 flex items-center gap-2">
				<span class="label-text">Volume: {$timerStore.volumeLevel}</span>
				<input
					type="range"
					min="0"
					max="100"
					value={$timerStore.volumeLevel}
					class="range"
					step="1"
					on:input={(e) => {
						if (e.target instanceof HTMLInputElement) {
							timerStore.setVolumeLevel(parseInt(e.target.value));
						}
					}}
				/>
			</label>
		{/if}
	</div>
</section>
