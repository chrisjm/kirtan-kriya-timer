<script lang="ts">
	import { soundStore } from '$lib/stores/soundStore';
	import { Volume2, VolumeX, Clock } from 'lucide-svelte';
	
	// Calculate seconds per mantra cycle based on BPM
	$: secondsPerCycle = Math.round((60 / $soundStore.mantraPace) * 4 * 10) / 10;
	
	// Handle pace change from slider
	const handlePaceChange = (event: Event) => {
		if (event.target instanceof HTMLInputElement) {
			const value = parseInt(event.target.value, 10);
			soundStore.setPace(value);
		}
	};
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
		
		<!-- Mantra Pace Control -->
		<div class="flex flex-col gap-2 w-full">
			<div class="flex items-center justify-between">
				<label for="mantra-pace" class="flex items-center gap-2 text-sm font-medium">
					<Clock class="h-4 w-4" />
					<span>Mantra Pace</span>
				</label>
				<span class="text-xs text-gray-500">
					{secondsPerCycle}s per cycle
				</span>
			</div>
			
			<input
				id="mantra-pace"
				type="range"
				min="24"
				max="120"
				step="4"
				value={$soundStore.mantraPace}
				on:input={handlePaceChange}
				class="range"
				tabindex="0"
				aria-label="Adjust mantra pace"
			/>
			
			<div class="flex justify-between text-xs text-gray-500">
				<span>Slower</span>
				<span>Faster</span>
			</div>
		</div>
	</div>
</section>
