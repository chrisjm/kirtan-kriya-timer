<script lang="ts">
	import { timerStore } from '$lib/stores/timerStore';
	import ProgressIndicator from './ProgressIndicator.svelte';
	import TimerControls from './TimerControls.svelte';
	import PhaseSelection from './PhaseSelection.svelte';
	import CurrentPhase from './CurrentPhase.svelte';
	import SoundControls from './SoundControls.svelte';
	import DebugPanel from './DebugPanel.svelte';
	import { millisecondsToSeconds, secondsToMinutes, padWithZeroes } from '$lib/utils/formatUtils';
	import { Confetti } from 'svelte-confetti';
</script>

{#if $timerStore.meditationCompleted}
	<div
		class="fixed -top-[50px] left-0 h-screen w-screen flex justify-center overflow-hidden pointer-events-none"
	>
		<Confetti
			x={[-5, 5]}
			y={[0, 0.1]}
			delay={[500, 2000]}
			infinite={true}
			duration={5000}
			amount={500}
			fallDistance="100vh"
		/>
	</div>
{/if}

<div class="rounded-lg bg-white shadow-xl dark:bg-gray-800">
	<!-- Progress Indicator Component -->
	<section class="px-6 py-4">
		<ProgressIndicator />
	</section>

	<!-- Timer Display -->
	<section class="text-center px-6">
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
	<section class="px-6 pb-4">
		<PhaseSelection />
	</section>

	<!-- Sound Controls -->
	<section class="px-6 pb-4">
		<SoundControls />
	</section>

	{#if import.meta.env.DEV}
		<!-- Debug Panel Component -->
		<section class="px-6 pb-4">
			<DebugPanel />
		</section>
	{/if}
</div>
