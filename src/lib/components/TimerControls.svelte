<script lang="ts">
	import { TimerStatus } from '$lib/stores/timer/types';
	import { timerStore } from '$lib/stores/timerStore';
	import { Pause, Play, RotateCcw } from 'lucide-svelte';
	import { initializeStorage } from '$lib/services/storageService';

	function startTimer(): void {
		// Ensure storage is initialized before starting the timer
		initializeStorage();
		timerStore.startTimer();
	}

	function pauseTimer(): void {
		timerStore.pauseTimer();
	}

	function resetTimer(): void {
		timerStore.resetTimer();
	}

	// Compute if buttons should be disabled based on current status
	$: isRunning = $timerStore.status === TimerStatus.RUNNING;
	$: isResetDisabled = isRunning;
</script>

<div class="my-4 flex justify-center gap-2">
	{#if isRunning}
		<button
			class="inline-flex items-center px-4 py-2 rounded-lg bg-warning text-white hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
			on:click={pauseTimer}
			disabled={!isRunning}
			title="Pause the meditation timer"
			aria-label="Pause"
			data-testid="pause-button"
			tabindex="0"
			on:keydown={(e) => e.key === 'Enter' && pauseTimer()}
		>
			<Pause class="h-5 w-5 mr-1" />
			PAUSE
		</button>
	{:else}
		<button
			class="inline-flex items-center px-4 py-2 rounded-lg bg-success text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
			on:click={startTimer}
			disabled={isRunning}
			title="Start the meditation timer"
			aria-label={$timerStore.status === TimerStatus.PAUSED ? 'Resume' : 'Start'}
			data-testid={$timerStore.status === TimerStatus.PAUSED ? 'resume-button' : 'start-button'}
			tabindex="0"
			on:keydown={(e) => e.key === 'Enter' && startTimer()}
		>
			<Play class="h-5 w-5 mr-1" />
			{$timerStore.status === TimerStatus.PAUSED ? 'RESUME' : 'START'}
		</button>
	{/if}
	<button
		class="inline-flex items-center px-4 py-2 rounded-lg bg-error text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
		on:click={resetTimer}
		disabled={isResetDisabled}
		title="Reset the meditation timer"
		aria-label="Reset"
		data-testid="reset-button"
		tabindex="0"
		on:keydown={(e) => e.key === 'Enter' && resetTimer()}
	>
		<RotateCcw class="h-5 w-5 mr-1" />
		RESET
	</button>
</div>
