<script lang="ts">
	import { timerStore } from '$lib/stores/timerStore';
	import { soundManager } from '$lib/utils/soundUtils';
	import ProgressIndicator from './ProgressIndicator.svelte';

	// Time formatting utilities
	const millisecondsToSeconds = (milliseconds: number): number => Math.round(milliseconds / 1000);
	const secondsToMinutes = (seconds: number): number => Math.floor(seconds / 60);
	const padWithZeroes = (number: number): string => number.toString().padStart(2, '0');

	function formatTime(milliseconds: number): string {
		const seconds = millisecondsToSeconds(milliseconds);
		return `${padWithZeroes(secondsToMinutes(seconds))}:${padWithZeroes(seconds % 60)}`;
	}

	// Timer state
	let timerEndTime: number;
	let timerId: NodeJS.Timer;
	let mantra = '';
	let soundInitialized = false;

	// Reactive values from the store
	$: isRunning = $timerStore.isRunning;
	$: timeRemaining = $timerStore.timeRemaining;
	$: currentPhaseIndex = $timerStore.currentPhaseIndex;
	$: currentPhase = $timerStore.phases[currentPhaseIndex];
	$: actionLabel = currentPhase.action;
	$: soundEnabled = $timerStore.soundEnabled;
	$: volumeLevel = $timerStore.volumeLevel;

	// Update sound manager volume when store volume changes
	$: if (soundInitialized && soundManager) {
		soundManager.volumeLevel = volumeLevel;
	}

	// Manage sound based on timer state
	$: if (soundInitialized && isRunning && soundEnabled) {
		soundManager.start();
	} else if (soundInitialized) {
		soundManager.stop();
	}

	// Subscribe to mantra changes
	$: if (soundInitialized && soundManager) {
		soundManager.onMantraChange((newMantra) => {
			mantra = newMantra;
		});
		// Set initial mantra
		mantra = soundManager.currentMantra;
	}

	// Timer countdown function
	function updateCountdown() {
		clearTimeout(timerId);

		let now = Date.now();
		const newTimeRemaining = timerEndTime - now;

		// Update the store with the new time
		timerStore.updateTimeRemaining(Math.max(0, newTimeRemaining));

		if (newTimeRemaining > 0) {
			timerId = setTimeout(updateCountdown, 1000);
		} else {
			// Play notification sound at phase change
			if (soundInitialized && soundEnabled) {
				soundManager.playNotification();
			}

			// Check if we're at the last phase
			if (currentPhaseIndex >= $timerStore.phases.length - 1) {
				pauseTimer();
				resetTimer();
			} else {
				nextPhase();
			}
		}
	}

	// Timer control functions
	async function startTimer() {
		// Initialize sound if not already done
		if (!soundInitialized && soundEnabled) {
			try {
				await soundManager.initialize();
				soundInitialized = true;
			} catch (error) {
				console.error('Failed to initialize sound:', error);
			}
		}

		// Update the store
		timerStore.startTimer();

		// Set the end time and start countdown
		timerEndTime = Date.now() + timeRemaining;
		updateCountdown();
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
		timerStore.pauseTimer();
		if (soundInitialized) {
			soundManager.pause();
		}
	}

	function handleTimerSelect(index: number) {
		if (isRunning) {
			pauseTimer();
		}
		timerStore.selectPhase(index);
	}

	function handleSoundToggle() {
		timerStore.toggleSound();

		// Initialize sound if enabling and not already initialized
		if (!soundInitialized && $timerStore.soundEnabled) {
			soundManager
				.initialize()
				.then(() => {
					soundInitialized = true;
				})
				.catch((error) => {
					console.error('Failed to initialize sound:', error);
				});
		}
	}
</script>

<div class="rounded-lg bg-white shadow-xl dark:bg-gray-800">
	<!-- Progress Indicator Component -->
	<ProgressIndicator />

	<!-- Timer Display -->
	<section class="text-center p-6">
		<div class="font-mono text-5xl tabular-nums tracking-wider">
			{padWithZeroes(secondsToMinutes(millisecondsToSeconds(timeRemaining)))}:{padWithZeroes(
				millisecondsToSeconds(timeRemaining) % 60
			)}
		</div>

		<!-- Timer Controls -->
		<div class="my-4 flex justify-center gap-2">
			{#if isRunning}
				<button
					class="inline-flex items-center px-4 py-2 rounded-lg bg-warning text-white hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
					on:click={pauseTimer}
					disabled={!isRunning}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-5 w-5 mr-1"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M10 9v6m4-6v6M9 9h1v6H9V9zm5 0h1v6h-1V9z"
						/>
					</svg>
					PAUSE
				</button>
			{:else}
				<button
					class="inline-flex items-center px-4 py-2 rounded-lg bg-success text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
					on:click={startTimer}
					disabled={isRunning}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-5 w-5 mr-1"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
						/>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
					START
				</button>
			{/if}
			<button
				class="inline-flex items-center px-4 py-2 rounded-lg bg-error text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
				on:click={resetTimer}
				disabled={isRunning}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-5 w-5 mr-1"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
					/>
				</svg>
				RESET
			</button>
		</div>

		<!-- Current Phase Info -->
		<div class="rounded-lg bg-gray-100 dark:bg-gray-700 p-4 my-4">
			<h3 class="text-xl font-bold">
				Phase {currentPhaseIndex + 1}: {actionLabel}
			</h3>
			<p class="text-lg">
				{formatTime($timerStore.phases[currentPhaseIndex].durationMinutes * 60 * 1000)}
				{#if mantra}
					<span
						class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary text-white ml-2"
						>{mantra}</span
					>
				{/if}
			</p>
		</div>
	</section>

	<!-- Phase Selection -->
	<section class="px-6 pb-4">
		<div class="flex flex-wrap gap-2 justify-center">
			{#each $timerStore.phases as phase, index (index)}
				<button
					class="inline-flex items-center px-3 py-1.5 text-sm rounded-lg transition-colors {index ===
					currentPhaseIndex
						? 'bg-primary text-white hover:bg-emerald-600'
						: 'border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'}"
					on:click={() => handleTimerSelect(index)}
				>
					{index + 1}. {phase.action}
				</button>
			{/each}
		</div>
	</section>

	<!-- Sound Controls -->
	<section class="px-6 pb-6">
		<div class="flex gap-3 items-center">
			<label class="cursor-pointer label flex items-center gap-2">
				<span class="label-text font-medium">Sound</span>
				<input
					type="checkbox"
					class="toggle toggle-primary"
					checked={soundEnabled}
					on:click={handleSoundToggle}
				/>
			</label>
			{#if soundEnabled}
				<label class="label flex-1 flex items-center gap-2">
					<span class="label-text">Volume: {volumeLevel}</span>
					<input
						type="range"
						min="0"
						max="100"
						value={volumeLevel}
						class="range"
						step="1"
						on:input={(e) => {
							if (e.target instanceof HTMLInputElement) {
								timerStore.setVolumeLevel(parseInt(e.target.value));
							}
						}}
					/>
				</label>
			{/if}
		</div>
	</section>
</div>
