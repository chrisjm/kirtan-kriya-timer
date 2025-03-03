<script lang="ts">
	import { timerStore } from '$lib/stores/timerStore';
</script>

<section class="px-6 pb-4">
	<div class="flex flex-wrap gap-2 justify-center">
		{#each $timerStore.phases as phase, index (index)}
			<button
				class="inline-flex items-center px-3 py-1.5 text-sm rounded-lg transition-colors {index ===
				$timerStore.currentPhaseIndex
					? 'bg-primary text-white hover:bg-emerald-600'
					: 'border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'}"
				on:click={() => timerStore.selectPhase(index)}
			>
				{index + 1}. {phase.action}
			</button>
		{/each}
	</div>
</section>
