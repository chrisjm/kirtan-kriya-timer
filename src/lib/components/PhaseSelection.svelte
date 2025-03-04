<script lang="ts">
	import { timerStore, TimerStatus } from '$lib/stores/timerStore';

	// Helper to determine if a phase button should be disabled
	$: isTransitioning = $timerStore.status === TimerStatus.TRANSITIONING;
</script>

<section class="px-6 pb-4">
	<div class="flex flex-wrap gap-2 justify-center">
		{#each $timerStore.phases as phase, index (phase.id)}
			<!-- Using phase.id as the key ensures stable rendering when phases update -->
			<button
				class="inline-flex items-center px-3 py-1.5 text-sm rounded-lg transition-colors 
					{index === $timerStore.currentPhaseIndex
						? 'bg-primary text-white hover:bg-emerald-600'
						: phase.completed 
							? 'bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 border-0'
							: 'border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'}"
				on:click={() => timerStore.selectPhase(index)}
				disabled={isTransitioning}
				title={phase.completed ? 'Phase completed' : `Switch to phase ${index + 1}`}
			>
				<!-- Include completion indicator -->
				{#if phase.completed}
					<svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
					</svg>
				{/if}
				
				{index + 1}. {phase.action}
			</button>
		{/each}
	</div>
</section>
