<script lang="ts">
	import { timerStore } from '$lib/stores/timerStore';
	import { soundStore } from '$lib/stores/soundStore';

	// Reactive declarations to compute current state
	$: currentPhaseIndex = $timerStore.currentPhaseIndex;
	$: currentPhase = $timerStore.phases[currentPhaseIndex];
	$: actionLabel = currentPhase?.action || 'Loading...';
	$: currentMantra = $soundStore.currentMantra;
</script>

<div class="rounded-lg bg-gray-100 dark:bg-gray-700 p-4 my-4">
	<div class="flex justify-center">
		<h3 class="text-xl font-bold">
			Phase {currentPhaseIndex + 1}: {actionLabel}
		</h3>
	</div>

	{#if currentMantra}
		<div class="mt-2">
			<span
				class="inline-flex items-center px-2.5 py-0.5 rounded-full text-base font-medium bg-primary text-white"
				>{currentMantra.mantra}</span
			>
		</div>
	{/if}
</div>
