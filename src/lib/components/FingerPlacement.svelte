<script lang="ts">
	import { soundStore } from '$lib/stores/soundStore';
	import { fade } from 'svelte/transition';

	// Define valid mantra types
	type MantraType = 'Saa' | 'Taa' | 'Naa' | 'Maa' | '';

	// Define finger data with associated mantras
	const fingerData = [
		{ finger: 'Index', mantra: 'Saa', description: 'Index finger to thumb' },
		{ finger: 'Middle', mantra: 'Taa', description: 'Middle finger to thumb' },
		{ finger: 'Ring', mantra: 'Naa', description: 'Ring finger to thumb' },
		{ finger: 'Pinky', mantra: 'Maa', description: 'Pinky finger to thumb' }
	];

	// Reactive declaration to access the current mantra
	$: currentMantra = ($soundStore.currentMantra?.mantra || '') as MantraType;
</script>

<div class="my-6 bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
	<h3 class="text-center text-lg font-semibold mb-3">Finger Placement</h3>

	<!-- Current instruction -->
	{#if currentMantra}
		<div class="text-center mb-4" transition:fade={{ duration: 200 }}>
			<p class="font-medium text-lg">
				<span class="text-primary font-bold">{currentMantra}</span>: Touch
				{#each fingerData as data}
					{#if data.mantra === currentMantra}
						<span class="text-primary font-bold">{data.finger.toLowerCase()}</span> to thumb
					{/if}
				{/each}
			</p>
		</div>
	{:else}
		<p class="text-center text-gray-500 dark:text-gray-400 mb-4">
			Start meditation to see finger placements
		</p>
	{/if}
</div>
