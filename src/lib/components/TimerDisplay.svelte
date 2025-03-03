<script lang="ts">
	import { onMount } from 'svelte';
	import { timerStore } from '$lib/stores/timerStore';
	import { soundManager } from '$lib/utils/soundUtils';
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

	onMount(() => {
		soundInitialized = true;
		// Subscribe to store changes to handle timer start/stop
		timerStore.subscribe(state => {
			if (state.isRunning && !timerId) {
				timerEndTime = Date.now() + state.timeRemaining;
				updateCountdown();
			}
		});
	});

	// Update sound manager volume when store volume changes
	$: if (soundInitialized && soundManager) {
		soundManager.volumeLevel = $timerStore.volumeLevel;
	}

	// Manage sound based on timer state
	$: {
		if (soundInitialized && $timerStore.isRunning && $timerStore.soundEnabled) {
			soundManager.resume();
		} else if (soundInitialized && $timerStore.soundEnabled) {
			soundManager.pause();
		} else if (soundInitialized) {
			soundManager.stop();
		}
	}

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
			// Play notification sound at phase change
			if (soundInitialized && $timerStore.soundEnabled) {
				soundManager.playNotification();
			}

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
		if (soundInitialized) {
			soundManager.pause();
		}
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
