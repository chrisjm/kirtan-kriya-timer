<script lang="ts">
	import { timerStore } from '$lib/stores/timerStore';
	import { soundStore } from '$lib/stores/soundStore';
	import { intervalStore, intervalOptions } from '$lib/stores/intervalStore';
	import { navigationStore } from '$lib/stores/navigationStore';
	import { uiStore } from '$lib/stores/uiStore';
	import { TimerStatus } from '$lib/stores/timer/types';

	// State for section visibility
	const createSectionState = () => {
		const sections = [
			'timerState',
			'soundState',
			'phaseProgress',
			'intervalSettings',
			'navigationState',
			'uiState',
			'timerStatusValues'
		];

		const state: Record<string, boolean> = {};

		// Initialize all sections as collapsed
		sections.forEach((section) => {
			state[section] = false;
		});

		return state;
	};

	let sectionVisibility = createSectionState();

	const toggleSection = (section: string) => {
		sectionVisibility[section] = !sectionVisibility[section];
	};
</script>

<div
	class="p-4 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 space-y-2"
>
	<!-- Timer State -->
	<div class="border-b pb-2 dark:border-gray-600">
		<div
			class="font-medium mb-1 flex items-center cursor-pointer"
			on:click={() => toggleSection('timerState')}
			on:keydown={(e) => e.key === 'Enter' && toggleSection('timerState')}
			tabindex="0"
			role="button"
			aria-expanded={sectionVisibility.timerState}
		>
			<span class="mr-1">{sectionVisibility.timerState ? '▼' : '►'}</span>
			Timer State
		</div>
		{#if sectionVisibility.timerState}
			<div>Status: {$timerStore.status}</div>
			<div>Current Phase: {$timerStore.currentPhaseIndex + 1} of {$timerStore.phases.length}</div>
			<div>Time Remaining: {$timerStore.timeRemaining}ms</div>
			<div>
				Phase Duration: {$timerStore.phases[$timerStore.currentPhaseIndex].durationMinutes}min
			</div>
			<div>Phase Volume: {$timerStore.phases[$timerStore.currentPhaseIndex].volumeLevel}%</div>
			<div>Interval Multiplier: {$timerStore.intervalMultiplier}x</div>
			<div>Meditation Completed: {$timerStore.meditationCompleted ? 'Yes' : 'No'}</div>
			<div>Active Timer ID: {$timerStore.activeTimerId ?? 'None'}</div>
		{/if}
	</div>

	<!-- Sound State -->
	<div class="border-b pb-2 dark:border-gray-600">
		<div
			class="font-medium mb-1 flex items-center cursor-pointer"
			on:click={() => toggleSection('soundState')}
			on:keydown={(e) => e.key === 'Enter' && toggleSection('soundState')}
			tabindex="0"
			role="button"
			aria-expanded={sectionVisibility.soundState}
		>
			<span class="mr-1">{sectionVisibility.soundState ? '▼' : '►'}</span>
			Sound State
		</div>
		{#if sectionVisibility.soundState}
			<div>Initialized: {$soundStore.isInitialized ? 'Yes' : 'No'}</div>
			<div>Volume: {$soundStore.volumeLevel}%</div>
			<div>Muted: {$soundStore.isMuted ? 'Yes' : 'No'}</div>
			<div>Current Mantra: {$soundStore.currentMantra?.mantra ?? 'None'}</div>
			<div>Current Pitch: {$soundStore.currentMantra?.pitch ?? 'None'}</div>
			<div>Mantra Pace: {$soundStore.mantraPace} BPM</div>
			<div>Timer Running: {$soundStore.isTimerRunning ? 'Yes' : 'No'}</div>
			<div>Current Phase Volume: {$soundStore.currentPhaseVolumeLevel ?? 'N/A'}%</div>
		{/if}
	</div>

	<!-- Phase Progress -->
	<div class="border-b pb-2 dark:border-gray-600">
		<div
			class="font-medium mb-1 flex items-center cursor-pointer"
			on:click={() => toggleSection('phaseProgress')}
			on:keydown={(e) => e.key === 'Enter' && toggleSection('phaseProgress')}
			tabindex="0"
			role="button"
			aria-expanded={sectionVisibility.phaseProgress}
		>
			<span class="mr-1">{sectionVisibility.phaseProgress ? '▼' : '►'}</span>
			Phase Progress
		</div>
		{#if sectionVisibility.phaseProgress}
			{#each $timerStore.phases as phase, i}
				<div class="flex items-center gap-2">
					<span class={i === $timerStore.currentPhaseIndex ? 'text-primary' : ''}>
						{i + 1}.
					</span>
					<span>{phase.action}</span>
					{#if phase.completed}
						<span class="text-success">✓</span>
					{/if}
				</div>
			{/each}
		{/if}
	</div>

	<!-- Interval Store -->
	<div class="border-b pb-2 dark:border-gray-600">
		<div
			class="font-medium mb-1 flex items-center cursor-pointer"
			on:click={() => toggleSection('intervalSettings')}
			on:keydown={(e) => e.key === 'Enter' && toggleSection('intervalSettings')}
			tabindex="0"
			role="button"
			aria-expanded={sectionVisibility.intervalSettings}
		>
			<span class="mr-1">{sectionVisibility.intervalSettings ? '▼' : '►'}</span>
			Interval Settings
		</div>
		{#if sectionVisibility.intervalSettings}
			<div>Current Multiplier: {$intervalStore}</div>
			<div>
				Label: {intervalOptions.find((opt) => opt.value === $intervalStore)?.label ?? 'Custom'}
			</div>
		{/if}
	</div>

	<!-- Navigation Store -->
	<div class="border-b pb-2 dark:border-gray-600">
		<div
			class="font-medium mb-1 flex items-center cursor-pointer"
			on:click={() => toggleSection('navigationState')}
			on:keydown={(e) => e.key === 'Enter' && toggleSection('navigationState')}
			tabindex="0"
			role="button"
			aria-expanded={sectionVisibility.navigationState}
		>
			<span class="mr-1">{sectionVisibility.navigationState ? '▼' : '►'}</span>
			Navigation State
		</div>
		{#if sectionVisibility.navigationState}
			<div>Audio Was Initialized: {$navigationStore.audioWasInitialized ? 'Yes' : 'No'}</div>
			<div>Timer Was Running: {$navigationStore.timerWasRunning ? 'Yes' : 'No'}</div>
		{/if}
	</div>

	<!-- UI Store -->
	<div class="border-b pb-2 dark:border-gray-600">
		<div
			class="font-medium mb-1 flex items-center cursor-pointer"
			on:click={() => toggleSection('uiState')}
			on:keydown={(e) => e.key === 'Enter' && toggleSection('uiState')}
			tabindex="0"
			role="button"
			aria-expanded={sectionVisibility.uiState}
		>
			<span class="mr-1">{sectionVisibility.uiState ? '▼' : '►'}</span>
			UI State
		</div>
		{#if sectionVisibility.uiState}
			<div>Settings Sidebar Open: {$uiStore.isSettingsSidebarOpen ? 'Yes' : 'No'}</div>
		{/if}
	</div>

	<!-- Timer Status Values (for reference) -->
	<div>
		<div
			class="font-medium mb-1 flex items-center cursor-pointer"
			on:click={() => toggleSection('timerStatusValues')}
			on:keydown={(e) => e.key === 'Enter' && toggleSection('timerStatusValues')}
			tabindex="0"
			role="button"
			aria-expanded={sectionVisibility.timerStatusValues}
		>
			<span class="mr-1">{sectionVisibility.timerStatusValues ? '▼' : '►'}</span>
			Timer Status Values
		</div>
		{#if sectionVisibility.timerStatusValues}
			{#each Object.entries(TimerStatus) as [key, value]}
				<div>
					<span class="font-mono">{key}</span>: <span class="text-gray-500">{value}</span>
					{#if value === $timerStore.status}
						<span class="text-primary ml-2">(current)</span>
					{/if}
				</div>
			{/each}
		{/if}
	</div>
</div>
