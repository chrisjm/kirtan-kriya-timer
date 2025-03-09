<script lang="ts">
	import { soundStore } from '$lib/stores/soundStore';
	import { Volume2, VolumeX } from 'lucide-svelte';
</script>

<section class="px-6 pb-6">
	<div class="flex flex-col gap-4">
		<div class="flex gap-3 items-center">
			<label class="cursor-pointer label flex items-center gap-2">
				<span class="label-text font-medium flex items-center gap-1">
					{#if $soundStore.isMuted}
						<VolumeX class="h-5 w-5" />
					{:else}
						<Volume2 class="h-5 w-5" />
					{/if}
					Sound
				</span>
				<input
					type="checkbox"
					class="toggle toggle-primary"
					checked={!$soundStore.isMuted}
					on:click={soundStore.toggleMute}
					title="Toggle sound on/off"
				/>
			</label>
			<label class="label flex-1 flex items-center gap-2">
				<span class="label-text">Volume: {$soundStore.volumeLevel}</span>
				<input
					type="range"
					min="0"
					max="100"
					value={$soundStore.volumeLevel}
					class="range"
					step="1"
					disabled={$soundStore.isMuted}
					on:input={(e) => {
						if (e.target instanceof HTMLInputElement) {
							soundStore.setVolume(parseInt(e.target.value));
						}
					}}
				/>
			</label>
		</div>
	</div>
</section>
