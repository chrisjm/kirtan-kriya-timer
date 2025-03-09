<script lang="ts">
	import { soundStore } from '$lib/stores/soundStore';
	import { Clock } from 'lucide-svelte';

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

<div class="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
	<h3 class="text-lg font-medium mb-2">Mantra Pace</h3>
	<div class="flex flex-col gap-2 w-full">
		<div class="flex items-center justify-between">
			<label for="mantra-pace" class="flex items-center gap-2 text-sm font-medium">
				<Clock class="h-4 w-4" />
				<span>Speed</span>
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
