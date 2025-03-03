<script lang="ts">
	import { timerStore } from '$lib/stores/timerStore';

	function startTimer() {
		timerStore.startTimer();
	}

	function pauseTimer() {
		timerStore.pauseTimer();
	}

	function resetTimer() {
		timerStore.resetTimer();
	}
</script>

<div class="my-4 flex justify-center gap-2">
	{#if $timerStore.isRunning}
		<button
			class="inline-flex items-center px-4 py-2 rounded-lg bg-warning text-white hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
			on:click={pauseTimer}
			disabled={!$timerStore.isRunning}
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
			disabled={$timerStore.isRunning}
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
		disabled={$timerStore.isRunning}
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
