<script lang="ts">
	import { Volume2, VolumeX } from 'lucide-svelte';
	import { soundStore } from '$lib/stores/soundStore';

	export let disabled = false;
</script>

<div class="flex flex-col gap-2">
	<!-- Volume control header -->
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-1">
			{#if $soundStore.isMuted}
				<VolumeX class="h-5 w-5" />
			{:else}
				<Volume2 class="h-5 w-5" />
			{/if}
			<span class="font-medium">Volume</span>
		</div>
		<button
			type="button"
			class="px-3 py-1 text-sm font-medium rounded-md {$soundStore.isMuted
				? 'bg-red-600 text-white hover:bg-red-700'
				: 'border border-gray-300 text-gray-700 bg-gray-50'} transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
			on:click={() => soundStore.toggleMute()}
			{disabled}
			aria-label={$soundStore.isMuted ? 'Unmute sound' : 'Mute sound'}
			tabindex="0"
			on:keydown={(e) => e.key === 'Enter' && soundStore.toggleMute()}
		>
			{$soundStore.isMuted ? 'Unmute' : 'Mute'}
		</button>
	</div>

	<!-- Volume slider -->
	<div class="flex items-center gap-2">
		<span class="text-xs font-medium min-w-[35px]">{$soundStore.volumeLevel}%</span>
		<input
			type="range"
			min="0"
			max="100"
			value={$soundStore.volumeLevel}
			class="range range-primary range-sm flex-1"
			step="1"
			disabled={$soundStore.isMuted || disabled}
			on:input={(e) => {
				if (e.target instanceof HTMLInputElement) {
					soundStore.setVolume(parseInt(e.target.value));
				}
			}}
			aria-label="Adjust volume level"
		/>
	</div>
</div>
