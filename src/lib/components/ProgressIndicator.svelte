<script lang="ts">
	import { timerStore, type TimerPhase } from '$lib/stores/timerStore';

	// Calculate total duration in milliseconds
	$: totalDuration = $timerStore.phases.reduce(
		(total, phase) => total + phase.durationMinutes * 60 * 1000,
		0
	);

	// Calculate completed duration based on completed phases and current phase progress
	$: completedDuration =
		$timerStore.phases
			.slice(0, $timerStore.currentPhaseIndex)
			.reduce((total, phase) => total + phase.durationMinutes * 60 * 1000, 0) +
		($timerStore.phases[$timerStore.currentPhaseIndex].durationMinutes * 60 * 1000 -
			$timerStore.timeRemaining);

	// Calculate overall progress percentage
	$: progressPercentage = Math.min(100, Math.max(0, (completedDuration / totalDuration) * 100));

	// Get phase durations as percentages of total duration
	$: phasePercentages = $timerStore.phases.map(
		(phase) =>
			(phase.durationMinutes / $timerStore.phases.reduce((sum, p) => sum + p.durationMinutes, 0)) *
			100
	);

	// Get phase color based on volume level and state
	function getPhaseColor(phase: TimerPhase, isActive: boolean, isCompleted: boolean): string {
		const hue = 215;
		const saturation = isActive ? 90 : 70;
		const brightness = 30 + (phase.volumeLevel / 100) * 60;

		if (isCompleted) {
			return `hsl(${hue}, ${saturation}%, ${brightness + 10}%)`;
		}
		return `hsl(${hue}, ${saturation}%, ${brightness}%)`;
	}

	function handlePhaseClick(event: MouseEvent, index: number) {
		if (event.target instanceof HTMLElement) {
			timerStore.selectPhase(index);
		}
	}

	let hoveredPhase: number | null = null;
</script>

<div class="w-full my-4 space-y-2">
	<!-- Phase info tooltip -->
	{#if hoveredPhase !== null}
		{@const phase = $timerStore.phases[hoveredPhase]}
		<div
			class="text-sm text-center font-medium text-gray-700 dark:text-gray-300 h-6 transition-opacity duration-200"
			role="status"
		>
			{phase.action} • {phase.durationMinutes}
			{phase.durationMinutes === 1 ? 'minute' : 'minutes'}
		</div>
	{:else}
		<div class="h-6" aria-hidden="true" />
	{/if}

	<!-- Interactive phase indicators -->
	<div
		class="w-full h-10 flex rounded-lg overflow-hidden"
		role="tablist"
		aria-label="Meditation phases"
	>
		{#each $timerStore.phases as phase, i}
			{@const isActive = i === $timerStore.currentPhaseIndex}
			{@const isCompleted = i < $timerStore.currentPhaseIndex}
			<button
				class="group relative flex items-center justify-center transition-all duration-300
  hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
				class:border-2={isActive}
				class:border-white={isActive}
				style="
          width: {phasePercentages[i]}%;
          background-color: {getPhaseColor(phase, isActive, isCompleted)};
          color: {phase.volumeLevel > 50 ? 'white' : 'black'};
        "
				on:click={(e) => handlePhaseClick(e, i)}
				on:mouseenter={() => (hoveredPhase = i)}
				on:mouseleave={() => (hoveredPhase = null)}
				on:focus={() => (hoveredPhase = i)}
				on:blur={() => (hoveredPhase = null)}
				aria-label="{phase.action} phase, {phase.durationMinutes} minutes"
				aria-current={isActive}
				role="tab"
			>
				<div class="relative flex items-center justify-center">
					<span
						class="flex items-center justify-center w-7 h-7 rounded-full
                   {isActive ? 'bg-black/20' : 'bg-black/10'} font-medium"
					>
						{i + 1}
					</span>
				</div>
			</button>
		{/each}
	</div>

	<!-- Overall progress bar -->
	<div class="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
		<div
			class="h-full bg-primary transition-all duration-1000 ease-linear"
			style="width: {progressPercentage}%"
			role="progressbar"
			aria-valuenow={progressPercentage}
			aria-valuemin="0"
			aria-valuemax="100"
		/>
	</div>
</div>
