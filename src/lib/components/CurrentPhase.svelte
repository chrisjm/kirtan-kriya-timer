<script lang="ts">
	import { timerStore } from '$lib/stores/timerStore';
	import { soundStore } from '$lib/stores/soundStore';
	import { fade } from 'svelte/transition';
	import { TimerStatus } from '$lib/stores/timer/types';

	// Define valid mantra types
	type MantraType = 'Saa' | 'Taa' | 'Naa' | 'Maa' | '';

	// Define finger data with associated mantras
	const fingerData = [
		{ finger: 'Index', mantra: 'Saa', description: 'Index finger to thumb' },
		{ finger: 'Middle', mantra: 'Taa', description: 'Middle finger to thumb' },
		{ finger: 'Ring', mantra: 'Naa', description: 'Ring finger to thumb' },
		{ finger: 'Pinky', mantra: 'Maa', description: 'Pinky finger to thumb' }
	];

	// Reactive declarations to compute current state
	$: currentPhaseIndex = $timerStore.currentPhaseIndex;
	$: currentPhase = $timerStore.phases[currentPhaseIndex];
	$: actionLabel = currentPhase?.action || 'Loading...';
	$: currentMantra = $soundStore.currentMantra;
	$: mantraText = $soundStore.currentMantra?.mantra || ('' as MantraType);
	$: isTimerRunning = $timerStore.status === TimerStatus.RUNNING;
	$: activeFingerData = fingerData.find((data) => data.mantra === mantraText);
	$: isAudioInitialized = $soundStore.isInitialized;
</script>

<div class="rounded-lg bg-gray-50 dark:bg-gray-800 p-4 my-4 shadow-sm">
	<div class="flex flex-col md:flex-row md:items-start">
		<!-- Phase Information -->
		<div class="w-full md:w-1/2 text-center md:text-left mb-3 md:mb-0 flex-shrink-0">
			<h3 class="text-xl font-bold">
				Phase {currentPhaseIndex + 1}: {actionLabel}
			</h3>

			{#if isAudioInitialized && currentMantra}
				<div class="mt-2" transition:fade={{ duration: 200 }}>
					<span
						class="inline-flex items-center px-2.5 py-0.5 rounded-full text-base font-medium bg-primary text-white"
						>{currentMantra.mantra}</span
					>
				</div>
			{/if}
		</div>

		<!-- Finger Placement -->
		<div
			class="w-full md:w-1/2 border-t md:border-t-0 md:border-l border-gray-300 dark:border-gray-600 pt-3 md:pt-0 md:pl-4 flex-shrink-0"
		>
			<h4 class="text-center md:text-left text-lg font-semibold mb-2">Finger Placement</h4>

			{#if isAudioInitialized && mantraText}
				<div class="text-center md:text-left" transition:fade={{ duration: 200 }}>
					<p class="font-medium">
						<span class="text-primary font-bold">{mantraText}</span>: Touch
						{#if activeFingerData}
							<span class="text-primary font-bold">{activeFingerData.finger.toLowerCase()}</span> to thumb
						{/if}
					</p>
				</div>
			{:else}
				<p class="text-center md:text-left text-gray-500 dark:text-gray-400">
					Initialize audio to see mantra and finger placements
				</p>
			{/if}
		</div>
	</div>
</div>
