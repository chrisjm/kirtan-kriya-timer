<script lang="ts">
	import { type TimerPhase } from '$lib/stores/timer/types';
	import { timerStore } from '$lib/stores/timerStore';

	// Helper function to convert minutes to milliseconds
	const minutesToMs = (minutes: number) => minutes * 60 * 1000;

	// Calculate total duration and phase percentages once
	$: {
		// Total duration in minutes for percentage calculations
		const totalMinutes = $timerStore.phases.reduce((sum, p) => sum + p.durationMinutes, 0);
		
		// Calculate each phase's percentage of the total duration
		phasePercentages = $timerStore.phases.map(
			(phase) => (phase.durationMinutes / totalMinutes) * 100
		);
		
		// Total duration in milliseconds for progress calculations
		totalDuration = minutesToMs(totalMinutes);
	}

	// Calculate progress for the progress bar
	$: {
		// Sum up completed phases time
		const completedPhasesTime = $timerStore.phases
			.filter((phase) => phase.completed)
			.reduce((total, phase) => total + minutesToMs(phase.durationMinutes), 0);
		
		// Get current phase progress if not completed
		const currentPhase = $timerStore.phases[$timerStore.currentPhaseIndex];
		let currentPhaseProgress = 0;
		
		if (currentPhase && !currentPhase.completed) {
			const totalCurrentPhaseTime = minutesToMs(currentPhase.durationMinutes);
			currentPhaseProgress = Math.max(0, totalCurrentPhaseTime - $timerStore.timeRemaining);
		}
		
		// Calculate total completed duration and progress percentage
		completedDuration = completedPhasesTime + currentPhaseProgress;
		progressPercentage = Math.min(100, Math.max(0, (completedDuration / totalDuration) * 100));
	}

	// Get phase color with improved contrast for accessibility
	function getPhaseColor(phase: TimerPhase, isActive: boolean, isCompleted?: boolean): string {
		// Base hue for consistent color scheme
		const hue = 215;
		
		// Increase contrast for active and completed states
		const saturation = isActive ? 95 : isCompleted ? 85 : 70;
		
		// Adjust brightness based on volume level with improved range for contrast
		const minBrightness = 35; // Higher minimum for better visibility
		const brightnessRange = 50; // Smaller range for better contrast
		const brightness = minBrightness + (phase.volumeLevel / 100) * brightnessRange;

		return `hsl(${hue}, ${saturation}%, ${isCompleted ? brightness + 10 : brightness}%)`;
	}

	// Handle phase selection
	function handlePhaseClick(_: MouseEvent, index: number) {
		timerStore.selectPhase(index);
	}

	// Track hovered phase for tooltip
	let hoveredPhase: number | null = null;
	
	// Variables for reactive calculations
	let totalDuration: number;
	let completedDuration: number;
	let progressPercentage: number;
	let phasePercentages: number[];
</script>

<div class="w-full my-4 space-y-3">
	<!-- Interactive phase indicators with improved accessibility -->
	<div
		class="w-full h-12 flex rounded-lg overflow-hidden shadow-sm"
		role="tablist"
		aria-label="Meditation phases"
	>
		{#each $timerStore.phases as phase, i}
			{@const isActive = i === $timerStore.currentPhaseIndex}
			{@const isCompleted = phase.completed}
			{@const phaseColor = getPhaseColor(phase, isActive, isCompleted)}
			{@const textColor = phase.volumeLevel > 50 ? 'text-white' : 'text-gray-900 dark:text-white'}
			
			<button
				class="relative flex items-center justify-center transition-all duration-300
					hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
					{textColor}"
				class:ring-2={isActive}
				class:ring-white={isActive}
				class:ring-offset-1={isActive}
				class:shadow-inner={isActive}
				style="width: {phasePercentages[i]}%; background-color: {phaseColor};"
				on:click={(e) => handlePhaseClick(e, i)}
				on:mouseenter={() => (hoveredPhase = i)}
				on:mouseleave={() => (hoveredPhase = null)}
				on:focus={() => (hoveredPhase = i)}
				on:blur={() => (hoveredPhase = null)}
				aria-label="{phase.action} phase, {phase.durationMinutes} minutes, {isCompleted ? 'completed' : isActive ? 'current' : 'upcoming'}"
				aria-current={isActive}
				role="tab"
				tabindex="0"
			>
				<!-- Phase indicator with enhanced visibility -->
				<div class="flex items-center justify-center">
					<span
						class="flex items-center justify-center w-8 h-8 rounded-full font-medium
							{isActive ? 'bg-white/30 shadow-sm' : 
							isCompleted ? 'bg-white/25' : 'bg-black/15'}"
					>
						{#if isCompleted}
							<svg
								class="w-5 h-5 {textColor}"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								xmlns="http://www.w3.org/2000/svg"
								aria-hidden="true"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="3"
									d="M5 13l4 4L19 7"
								/>
							</svg>
						{:else}
							<span class="text-lg">{i + 1}</span>
						{/if}
					</span>
				</div>
			</button>
		{/each}
	</div>

	<!-- Enhanced phase info tooltip -->
	{#if hoveredPhase !== null}
		{@const phase = $timerStore.phases[hoveredPhase]}
		{@const isPhaseCompleted = phase.completed}
		{@const isActive = hoveredPhase === $timerStore.currentPhaseIndex}
		
		<!-- Dynamically generate tooltip classes based on phase state -->
		{@const tooltipClasses = [
			'text-sm font-medium h-8 transition-all duration-200 flex items-center justify-center rounded-md px-3 py-1 shadow-sm',
			isPhaseCompleted ? 'bg-success/10 dark:bg-success/20 text-success' : '',
			isActive && !isPhaseCompleted ? 'bg-primary/10 dark:bg-primary/20 text-primary' : '',
			!isActive && !isPhaseCompleted ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200' : ''
		].join(' ')}
		
		<div
			class={tooltipClasses}
			role="status"
			aria-live="polite"
		>
			<div class="flex items-center gap-1.5">
				{#if isPhaseCompleted}
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
					</svg>
				{:else if isActive}
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
					</svg>
				{/if}
				<span class="font-medium">{phase.action}</span>
				<span class="text-gray-500 dark:text-gray-400">•</span>
				<span>{phase.durationMinutes} {phase.durationMinutes === 1 ? 'minute' : 'minutes'}</span>
				{#if isPhaseCompleted}
					<span class="text-success font-medium">(Completed)</span>
				{:else if isActive}
					<span class="text-primary font-medium">(Current)</span>
				{/if}
			</div>
		</div>
	{:else}
		<div class="h-8" aria-hidden="true" />
	{/if}

	<!-- Enhanced overall progress bar -->
	<div class="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
		<div
			class="h-full bg-primary transition-all duration-1000 ease-linear relative"
			style="width: {progressPercentage}%"
			role="progressbar"
			aria-valuenow={progressPercentage}
			aria-valuemin="0"
			aria-valuemax="100"
			aria-label="Overall meditation progress: {Math.round(progressPercentage)}%"
		>
			<!-- Add subtle gradient overlay for better visual effect -->
			<div class="absolute inset-0 bg-gradient-to-r from-primary/80 to-primary opacity-70"></div>
		</div>
	</div>
	
	<!-- Progress percentage display -->
	<div class="text-xs text-gray-500 dark:text-gray-400 text-right">
		<span class="font-medium">{Math.round(progressPercentage)}%</span> complete
	</div>
</div>
