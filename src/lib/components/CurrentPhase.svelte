<script lang="ts">
	import { onMount } from 'svelte';
	import { timerStore } from '$lib/stores/timerStore';
	import { formatTime } from '$lib/utils/formatUtils';
	import { soundManager } from '$lib/utils/soundUtils';

	$: currentPhaseIndex = $timerStore.currentPhaseIndex;
	$: actionLabel = $timerStore.phases[currentPhaseIndex].action;
	let currentMantra = '';

	onMount(() => {
		// Subscribe to mantra changes
		soundManager.onMantraChange((newMantra) => {
			currentMantra = newMantra;
		});
		// Set initial mantra if available
		if (soundManager.currentMantra) {
			currentMantra = soundManager.currentMantra;
		}
	});
</script>

<div class="rounded-lg bg-gray-100 dark:bg-gray-700 p-4 my-4">
	<h3 class="text-xl font-bold">
		Phase {currentPhaseIndex + 1}: {actionLabel}
	</h3>
	<p class="text-lg">
		{formatTime($timerStore.phases[currentPhaseIndex].durationMinutes * 60 * 1000)}
		{#if currentMantra !== ''}
			<span
				class="inline-flex items-center px-2.5 py-0.5 rounded-full text-base font-medium bg-primary text-white ml-2"
				>{currentMantra}</span
			>
		{/if}
	</p>
</div>
