<script lang="ts">
	import { timerStore, TimerStatus } from '$lib/stores/timerStore';
	import { formatTime } from '$lib/utils/formatUtils';
	import { soundStore } from '$lib/stores/soundStore';

	// Reactive declarations to compute current state
	$: currentPhaseIndex = $timerStore.currentPhaseIndex;
	$: currentPhase = $timerStore.phases[currentPhaseIndex];
	$: actionLabel = currentPhase?.action || 'Loading...';
	$: currentMantra = $soundStore.currentMantra;
	$: phaseProgress = getPhaseProgressPercentage();
	$: isCompleted = currentPhase?.completed || false;
	$: isTransitioning = $timerStore.status === TimerStatus.TRANSITIONING;

	// Calculate progress percentage of current phase
	function getPhaseProgressPercentage(): number {
		if (!currentPhase) return 0;
		
		const totalTime = currentPhase.durationMinutes * 60 * 1000;
		const remaining = $timerStore.timeRemaining;
		
		// Avoid division by zero
		if (totalTime <= 0) return 0;
		
		const elapsed = totalTime - remaining;
		const percentage = Math.min(100, Math.max(0, (elapsed / totalTime) * 100));
		
		return Math.round(percentage);
	}
</script>

<div class="rounded-lg bg-gray-100 dark:bg-gray-700 p-4 my-4">
	<div class="flex justify-between items-start">
		<h3 class="text-xl font-bold">
			Phase {currentPhaseIndex + 1}: {actionLabel}
			
			{#if isCompleted}
				<span class="ml-2 text-success">
					<svg class="w-6 h-6 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
					</svg>
				</span>
			{:else if isTransitioning}
				<span class="ml-2 text-sm text-primary">transitioning...</span>
			{/if}
		</h3>
		
		<div class="text-right">
			<span class="text-lg font-medium">
				{formatTime($timerStore.timeRemaining)}
			</span>
			<span class="text-xs text-gray-500 dark:text-gray-400 block">
				/ {formatTime(currentPhase?.durationMinutes * 60 * 1000 || 0)}
			</span>
		</div>
	</div>
	
	<!-- Progress bar -->
	<div class="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5 mt-2">
		<div 
			class="bg-primary h-2.5 rounded-full transition-all duration-300 ease-in-out" 
			style="width: {phaseProgress}%"
		></div>
	</div>
	
	{#if currentMantra !== ''}
		<div class="mt-2">
			<span
				class="inline-flex items-center px-2.5 py-0.5 rounded-full text-base font-medium bg-primary text-white"
				>{currentMantra}</span
			>
		</div>
	{/if}
</div>
