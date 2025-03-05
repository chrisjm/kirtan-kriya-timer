<script lang="ts">
	import { type TimerPhase } from '$lib/stores/timer/types';
	import { timerStore } from '$lib/stores/timerStore';

	// Calculate total duration in milliseconds
	$: totalDuration = $timerStore.phases.reduce(
		(total, phase) => total + phase.durationMinutes * 60 * 1000,
		0
	);

	// Calculate completed duration based on completed phases and current phase progress
	$: completedDuration = calculateCompletedDuration();

	// Calculate overall progress percentage
	$: progressPercentage = Math.min(100, Math.max(0, (completedDuration / totalDuration) * 100));

	// Get phase durations as percentages of total duration
	$: phasePercentages = $timerStore.phases.map(
		(phase) =>
			(phase.durationMinutes / $timerStore.phases.reduce((sum, p) => sum + p.durationMinutes, 0)) *
			100
	);

	// Calculate completed duration taking into account phase completion status
	function calculateCompletedDuration(): number {
		// Get total time for fully completed phases
		const completedPhasesTime = $timerStore.phases
			.filter((phase) => phase.completed)
			.reduce((total, phase) => total + phase.durationMinutes * 60 * 1000, 0);

		// For the current phase, calculate progress if it's not completed
		const currentPhase = $timerStore.phases[$timerStore.currentPhaseIndex];
		if (!currentPhase || currentPhase.completed) {
			return completedPhasesTime;
		}

		// Calculate current phase progress
		const totalCurrentPhaseTime = currentPhase.durationMinutes * 60 * 1000;
		const currentPhaseElapsed = totalCurrentPhaseTime - $timerStore.timeRemaining;

		return completedPhasesTime + Math.max(0, currentPhaseElapsed);
	}

	// Get phase color based on volume level and state
	function getPhaseColor(phase: TimerPhase, isActive: boolean, isCompleted?: boolean): string {
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
	<!-- Interactive phase indicators -->
	<div
		class="w-full h-10 flex rounded-lg overflow-hidden"
		role="tablist"
		aria-label="Meditation phases"
	>
		{#each $timerStore.phases as phase, i}
			{@const isActive = i === $timerStore.currentPhaseIndex}
			{@const isCompleted = phase.completed}
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
                   {isActive
							? 'bg-black/20'
							: isCompleted
							? 'bg-success/20'
							: 'bg-black/10'} font-medium"
					>
						{#if isCompleted}
							<svg
								class="w-4 h-4 text-white"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2.5"
									d="M5 13l4 4L19 7"
								/>
							</svg>
						{:else}
							{i + 1}
						{/if}
					</span>
				</div>
			</button>
		{/each}
	</div>

	<!-- Phase info tooltip -->
	{#if hoveredPhase !== null}
		{@const phase = $timerStore.phases[hoveredPhase]}
		{@const isPhaseCompleted = phase.completed}
		<div
			class="text-sm text-center font-medium h-6 transition-opacity duration-200 flex items-center justify-center"
			class:text-success={isPhaseCompleted}
			class:text-gray-700={!isPhaseCompleted}
			class:dark:text-success={isPhaseCompleted}
			class:dark:text-gray-300={!isPhaseCompleted}
			role="status"
		>
			{#if isPhaseCompleted}
				<svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M5 13l4 4L19 7"
					/>
				</svg>
			{/if}
			{phase.action} • {phase.durationMinutes}
			{phase.durationMinutes === 1 ? 'minute' : 'minutes'}
			{#if isPhaseCompleted}
				(Completed)
			{/if}
		</div>
	{:else}
		<div class="h-6" aria-hidden="true" />
	{/if}

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
