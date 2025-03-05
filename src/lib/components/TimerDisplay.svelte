<script lang="ts">
	import { timerStore } from '$lib/stores/timerStore';
	import { soundStore } from '$lib/stores/soundStore';
	import ProgressIndicator from './ProgressIndicator.svelte';
	import TimerControls from './TimerControls.svelte';
	import PhaseSelection from './PhaseSelection.svelte';
	import CurrentPhase from './CurrentPhase.svelte';
	import SoundControls from './SoundControls.svelte';
	import { millisecondsToSeconds, secondsToMinutes, padWithZeroes } from '$lib/utils/formatUtils';
</script>

<div class="rounded-lg bg-white shadow-xl dark:bg-gray-800">
	<!-- Progress Indicator Component -->
	<ProgressIndicator />

	<!-- Timer Display -->
	<section class="text-center p-6">
		<!-- Timer status indicator -->

		<!-- Time remaining display -->
		<div class="font-mono text-5xl tabular-nums tracking-wider">
			{padWithZeroes(
				secondsToMinutes(millisecondsToSeconds($timerStore.timeRemaining))
			)}:{padWithZeroes(millisecondsToSeconds($timerStore.timeRemaining) % 60)}
		</div>

		<!-- Timer Controls - Will auto-update based on timer status -->
		<TimerControls />

		<!-- Current Phase Info - Will auto-update based on current phase -->
		<CurrentPhase />
	</section>

	<!-- Phase Selection with completion indicators -->
	<PhaseSelection />

	<!-- Sound Controls -->
	<SoundControls />

	<!-- Debug info during development -->
	{#if import.meta.env.DEV}
		<div
			class="p-4 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 space-y-2"
		>
			<!-- Timer State -->
			<div class="border-b pb-2 dark:border-gray-600">
				<div class="font-medium mb-1">Timer State</div>
				<div>Status: {$timerStore.status}</div>
				<div>Current Phase: {$timerStore.currentPhaseIndex + 1} of {$timerStore.phases.length}</div>
				<div>Time Remaining: {$timerStore.timeRemaining}ms</div>
				<div>Phase Duration: {$timerStore.phases[$timerStore.currentPhaseIndex].durationMinutes}min</div>
				<div>Phase Volume: {$timerStore.phases[$timerStore.currentPhaseIndex].volumeLevel}%</div>
			</div>

			<!-- Sound State -->
			<div class="border-b pb-2 dark:border-gray-600">
				<div class="font-medium mb-1">Sound State</div>
				<div>Initialized: {$soundStore.isInitialized ? 'Yes' : 'No'}</div>
				<div>Volume: {$soundStore.volumeLevel}%</div>
				<div>Muted: {$soundStore.isMuted ? 'Yes' : 'No'}</div>
				<div>Current Mantra: {$soundStore.currentMantra?.mantra ?? 'None'}</div>
				<div>Current Pitch: {$soundStore.currentMantra?.pitch ?? 'None'}</div>
			</div>

			<!-- Phase Progress -->
			<div>
				<div class="font-medium mb-1">Phase Progress</div>
				{#each $timerStore.phases as phase, i}
					<div class="flex items-center gap-2">
						<span class="{i === $timerStore.currentPhaseIndex ? 'text-primary' : ''}">
							{i + 1}.
						</span>
						<span>{phase.action}</span>
						{#if phase.completed}
							<span class="text-success">✓</span>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>
