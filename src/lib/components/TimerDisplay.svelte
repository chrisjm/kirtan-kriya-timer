<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { timerStore } from '$lib/stores/timerStore';
	import { soundStore } from '$lib/stores/soundStore';
	import ProgressIndicator from './ProgressIndicator.svelte';
	import TimerControls from './TimerControls.svelte';
	import PhaseSelection from './PhaseSelection.svelte';
	import CurrentPhase from './CurrentPhase.svelte';
	import SoundControls from './SoundControls.svelte';
	import { millisecondsToSeconds, secondsToMinutes, padWithZeroes } from '$lib/utils/formatUtils';

	// Timer state
	let timerEndTime: number;
	let timerId: NodeJS.Timer | undefined;
	let soundInitialized = false;

	onMount(async () => {
		try {
			// Initialize sound store first, ensuring mantras are ready
			await soundStore.initialize();
			soundInitialized = true;
			console.log('Sound system initialized successfully');

			// Now that sound is initialized, check if timer should be running
			const timerState = $timerStore;
			if (timerState.isRunning && !timerId) {
				timerEndTime = Date.now() + timerState.timeRemaining;
				updateCountdown();
			}
		} catch (error) {
			console.error('Failed to initialize sound system:', error);
		}

		// Subscribe to timer store changes to handle timer start/stop
		timerStore.subscribe((state) => {
			if (state.isRunning && !timerId) {
				timerEndTime = Date.now() + state.timeRemaining;
				updateCountdown();
			}
		});
	});

	onDestroy(() => {
		// Clean up any timers to prevent memory leaks
		if (timerId) {
			clearTimeout(timerId);
			timerId = undefined;
		}
	});

	// Timer countdown function
	function updateCountdown() {
		clearTimeout(timerId);
		timerId = undefined;

		let now = Date.now();
		const newTimeRemaining = timerEndTime - now;

		// Update the store with the new time
		timerStore.updateTimeRemaining(Math.max(0, newTimeRemaining));

		if (newTimeRemaining > 0 && $timerStore.isRunning) {
			timerId = setTimeout(updateCountdown, 1000);
		} else if (newTimeRemaining <= 0) {
			// Check if we're at the last phase
			if ($timerStore.currentPhaseIndex >= $timerStore.phases.length - 1) {
				pauseTimer();
				resetTimer();
			} else {
				nextPhase();
			}
		}
	}

	function nextPhase() {
		timerStore.nextPhase();
		timerEndTime = Date.now() + $timerStore.timeRemaining;
		updateCountdown();
	}

	function resetTimer() {
		clearTimeout(timerId);
		timerStore.resetTimer();
	}

	function pauseTimer() {
		clearTimeout(timerId);
		timerId = undefined;
		timerStore.pauseTimer();
	}
</script>

<div class="rounded-lg bg-white shadow-xl dark:bg-gray-800">
	<!-- Progress Indicator Component -->
	<ProgressIndicator />

	<!-- Timer Display -->
	<section class="text-center p-6">
		<div class="font-mono text-5xl tabular-nums tracking-wider">
			{padWithZeroes(
				secondsToMinutes(millisecondsToSeconds($timerStore.timeRemaining))
			)}:{padWithZeroes(millisecondsToSeconds($timerStore.timeRemaining) % 60)}
		</div>

		<!-- Timer Controls -->
		<TimerControls />

		<!-- Current Phase Info -->
		<CurrentPhase />
	</section>

	<!-- Phase Selection -->
	<PhaseSelection />

	<!-- Sound Controls -->
	<SoundControls />
</div>
