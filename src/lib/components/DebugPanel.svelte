<script lang="ts">
	import { timerStore } from '$lib/stores/timerStore';
	import { soundStore } from '$lib/stores/soundStore';
	import { intervalStore, intervalOptions } from '$lib/stores/intervalStore';
	import { navigationStore } from '$lib/stores/navigationStore';
	import { uiStore } from '$lib/stores/uiStore';
	import { TimerStatus } from '$lib/stores/timer/types';
</script>

<div
	class="p-4 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 space-y-2"
>
	<!-- Timer State -->
	<div class="border-b pb-2 dark:border-gray-600">
		<div class="font-medium mb-1">Timer State</div>
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
	</div>

	<!-- Sound State -->
	<div class="border-b pb-2 dark:border-gray-600">
		<div class="font-medium mb-1">Sound State</div>
		<div>Initialized: {$soundStore.isInitialized ? 'Yes' : 'No'}</div>
		<div>Volume: {$soundStore.volumeLevel}%</div>
		<div>Muted: {$soundStore.isMuted ? 'Yes' : 'No'}</div>
		<div>Current Mantra: {$soundStore.currentMantra?.mantra ?? 'None'}</div>
		<div>Current Pitch: {$soundStore.currentMantra?.pitch ?? 'None'}</div>
		<div>Mantra Pace: {$soundStore.mantraPace} BPM</div>
		<div>Timer Running: {$soundStore.isTimerRunning ? 'Yes' : 'No'}</div>
		<div>Current Phase Volume: {$soundStore.currentPhaseVolumeLevel ?? 'N/A'}%</div>
	</div>

	<!-- Phase Progress -->
	<div class="border-b pb-2 dark:border-gray-600">
		<div class="font-medium mb-1">Phase Progress</div>
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
	</div>

	<!-- Interval Store -->
	<div class="border-b pb-2 dark:border-gray-600">
		<div class="font-medium mb-1">Interval Settings</div>
		<div>Current Multiplier: {$intervalStore}</div>
		<div>
			Label: {intervalOptions.find((opt) => opt.value === $intervalStore)?.label ?? 'Custom'}
		</div>
	</div>

	<!-- Navigation Store -->
	<div class="border-b pb-2 dark:border-gray-600">
		<div class="font-medium mb-1">Navigation State</div>
		<div>Audio Was Initialized: {$navigationStore.audioWasInitialized ? 'Yes' : 'No'}</div>
		<div>Timer Was Running: {$navigationStore.timerWasRunning ? 'Yes' : 'No'}</div>
	</div>

	<!-- UI Store -->
	<div class="border-b pb-2 dark:border-gray-600">
		<div class="font-medium mb-1">UI State</div>
		<div>Settings Sidebar Open: {$uiStore.isSettingsSidebarOpen ? 'Yes' : 'No'}</div>
	</div>

	<!-- Timer Status Values (for reference) -->
	<div>
		<div class="font-medium mb-1">Timer Status Values</div>
		{#each Object.entries(TimerStatus) as [key, value]}
			<div>
				<span class="font-mono">{key}</span>: <span class="text-gray-500">{value}</span>
				{#if value === $timerStore.status}
					<span class="text-primary ml-2">(current)</span>
				{/if}
			</div>
		{/each}
	</div>
</div>
