<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { timerStore, TimerStatus, TimerEventType } from '$lib/stores/timerStore';
	import { soundStore } from '$lib/stores/soundStore';
	import ProgressIndicator from './ProgressIndicator.svelte';
	import TimerControls from './TimerControls.svelte';
	import PhaseSelection from './PhaseSelection.svelte';
	import CurrentPhase from './CurrentPhase.svelte';
	import SoundControls from './SoundControls.svelte';
	import { millisecondsToSeconds, secondsToMinutes, padWithZeroes } from '$lib/utils/formatUtils';

	// Enhanced timer state management
	let timerEndTime: number;
	let activeTimerId: string | undefined;
	let phaseTimers: Map<string, NodeJS.Timer> = new Map(); // Track timers by ID
	let soundInitialized = false;

	// Helper for logging
	const debug = (message: string, data?: Record<string, unknown>): void => {
		console.log(`[TimerDisplay] ${message}`, data || '');
	};

	onMount(async () => {
		try {
			// Initialize sound store first, ensuring mantras are ready
			await soundStore.initialize();
			soundInitialized = true;
			debug('Sound system initialized successfully');
		} catch (error) {
			console.error('Failed to initialize sound system:', error);
		}
	});

	// Store all the unsubscribe functions for cleanup
	// Listen for timer start events
	const unsubscribeStartEvent = timerStore.addEventListener(TimerEventType.START, (event) => {
		if (!event.timerId) return;
		activateTimer(event.timerId);
	});

	// Listen for timer pause events
	const unsubscribePauseEvent = timerStore.addEventListener(TimerEventType.PAUSE, (event) => {
		if (!event.timerId) return;

		clearTimerById(event.timerId);
	});

	// Listen for timer reset events
	const unsubscribeResetEvent = timerStore.addEventListener(TimerEventType.RESET, (event) => {
		clearAllTimers();

		if (event.timerId) {
			activeTimerId = event.timerId;
		}
	});

	// Watch for timer state changes
	const unsubscribeStore = timerStore.subscribe((state) => {
		debug('Timer state changed', {
			status: state.status,
			activeTimerId: state.activeTimerId,
			currentPhase: state.currentPhaseIndex
		});

		// Sync our local activeTimerId with store
		if (state.activeTimerId !== activeTimerId) {
			activeTimerId = state.activeTimerId;
		}

		// If timer just started running and we don't have a timer for this phase
		if (
			state.status === TimerStatus.RUNNING &&
			state.activeTimerId &&
			!phaseTimers.has(state.activeTimerId)
		) {
			timerEndTime = Date.now() + state.timeRemaining;
			activeTimerId = state.activeTimerId;
			activateTimer(state.activeTimerId);
		}
	});

	onDestroy(() => {
		unsubscribeStartEvent();
		unsubscribePauseEvent();
		unsubscribeResetEvent();
		unsubscribeStore();
		clearAllTimers();
	});

	// Helper to clear a specific timer by ID
	function clearTimerById(timerId: string): void {
		if (phaseTimers.has(timerId)) {
			debug(`Clearing timer: ${timerId}`);
			clearTimeout(phaseTimers.get(timerId));
			phaseTimers.delete(timerId);
		}
	}

	// Helper to clear all active timers
	function clearAllTimers(): void {
		debug(`Clearing all timers, count: ${phaseTimers.size}`);
		phaseTimers.forEach((timer) => clearTimeout(timer));
		phaseTimers.clear();
	}

	// Helper to activate a timer with specific ID
	function activateTimer(timerId: string): void {
		// First clear any existing timer with this ID
		clearTimerById(timerId);

		// Only proceed if this is the active timer ID
		if (timerId !== activeTimerId) {
			debug('Ignoring activation of non-active timer', {
				requested: timerId,
				active: activeTimerId
			});
			return;
		}

		timerEndTime = Date.now() + $timerStore.timeRemaining;
		debug('Timer activated', { timerId, endTime: timerEndTime });

		// Start the countdown with the specific timer ID
		updateCountdown(timerId);
	}

	// Timer countdown function with specific timer ID
	function updateCountdown(timerId: string): void {
		// Don't update if the timer is no longer active or we're transitioning
		if (
			timerId !== activeTimerId ||
			$timerStore.status !== TimerStatus.RUNNING ||
			$timerStore.status === TimerStatus.TRANSITIONING
		) {
			debug('Timer not active or transitioning, skipping update', {
				timerId,
				status: $timerStore.status
			});
			clearTimerById(timerId);
			return;
		}

		debug('Updating countdown', {
			timerId,
			currentPhase: $timerStore.currentPhaseIndex,
			status: $timerStore.status
		});

		const now = Date.now();
		const newTimeRemaining = timerEndTime - now;

		// Update the store with the new time and timer ID
		timerStore.updateTimeRemaining(Math.max(0, newTimeRemaining), timerId);

		if (newTimeRemaining > 0) {
			// Set up the next tick with the same timer ID
			const timer = setTimeout(() => updateCountdown(timerId), 1000);
			phaseTimers.set(timerId, timer);
			debug('Scheduled next tick', { timerId });
		} else {
			debug('Phase time completed', {
				phaseIndex: $timerStore.currentPhaseIndex,
				totalPhases: $timerStore.phases.length
			});

			// Clear this timer as it's complete
			clearTimerById(timerId);

			// Mark the current phase as completed
			timerStore.completeCurrentPhase();

			// Wait a short moment before transitioning to next phase
			setTimeout(() => {
				// Check if this was the last phase
				if ($timerStore.currentPhaseIndex >= $timerStore.phases.length - 1) {
					debug('Last phase complete, meditation cycle finished');
					// The store will handle resetting to IDLE state
				} else {
					debug('Moving to next phase');
					nextPhase();
				}
			}, 250); // Short delay for smooth transition
		}
	}

	function nextPhase(): void {
		debug('Moving to next phase', {
			currentPhase: $timerStore.currentPhaseIndex,
			activeTimerId
		});

		// Request the store to move to the next phase
		// This will generate a new timer ID and update the state
		timerStore.nextPhase();

		// The store subscription will handle activating the new timer
		// as it will detect the new active timer ID
	}
</script>

<div class="rounded-lg bg-white shadow-xl dark:bg-gray-800">
	<!-- Progress Indicator Component -->
	<ProgressIndicator />

	<!-- Timer Display -->
	<section class="text-center p-6">
		<!-- Timer status indicator -->
		{#if $timerStore.status === TimerStatus.TRANSITIONING}
			<div class="text-sm text-primary mb-1">Transitioning to next phase...</div>
		{/if}

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
			class="p-2 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700"
		>
			<div>Status: {$timerStore.status}</div>
			<div>Phase: {$timerStore.currentPhaseIndex + 1}/{$timerStore.phases.length}</div>
			<div>Timer ID: {activeTimerId ? activeTimerId.substring(0, 8) + '...' : 'none'}</div>
		</div>
	{/if}
</div>
