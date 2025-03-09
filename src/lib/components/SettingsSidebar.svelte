<script lang="ts">
	import { uiStore, closeSettingsSidebar } from '$lib/stores/uiStore';
	import IntervalSelector from './IntervalSelector.svelte';
	import { soundStore } from '$lib/stores/soundStore';
	import { Clock, X } from 'lucide-svelte';
	import { fly } from 'svelte/transition';

	// Calculate seconds per mantra cycle based on BPM
	$: secondsPerCycle = Math.round((60 / $soundStore.mantraPace) * 4 * 10) / 10;

	// Handle pace change from slider
	const handlePaceChange = (event: Event) => {
		if (event.target instanceof HTMLInputElement) {
			const value = parseInt(event.target.value, 10);
			soundStore.setPace(value);
		}
	};

	// Handle click outside to close sidebar
	const handleClickOutside = (event: MouseEvent) => {
		const target = event.target as HTMLElement;
		if (target.closest('.settings-sidebar-content') === null) {
			closeSettingsSidebar();
		}
	};
</script>

<!-- Backdrop overlay when sidebar is open -->
{#if $uiStore.isSettingsSidebarOpen}
	<div
		class="fixed inset-0 bg-black/30 dark:bg-black/50 z-40 transition-opacity duration-300"
		on:click={handleClickOutside}
		transition:fly={{ duration: 200, x: 0, opacity: 1 }}
	/>
{/if}

<!-- Sidebar container -->
<aside
	class="fixed top-0 right-0 h-full w-80 max-w-[80vw] z-50 transform transition-transform duration-300 ease-out"
	class:translate-x-0={$uiStore.isSettingsSidebarOpen}
	class:translate-x-full={!$uiStore.isSettingsSidebarOpen}
>
	<!-- Sidebar content -->
	<div
		class="settings-sidebar-content h-full bg-white dark:bg-gray-800 shadow-xl flex flex-col overflow-y-auto"
	>
		<!-- Header -->
		<div
			class="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center"
		>
			<h2 class="text-xl font-bold">Settings</h2>
			<button
				class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
				on:click={closeSettingsSidebar}
				aria-label="Close settings"
				tabindex="0"
				on:keydown={(e) => e.key === 'Enter' && closeSettingsSidebar()}
			>
				<X class="h-5 w-5" />
			</button>
		</div>

		<!-- Settings content -->
		<div class="p-4 flex-1 overflow-y-auto">
			<!-- Interval Selector -->
			<IntervalSelector />

			<!-- Mantra Pace Control -->
			<div class="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
				<h3 class="text-lg font-medium mb-2">Mantra Pace</h3>
				<div class="flex flex-col gap-2 w-full">
					<div class="flex items-center justify-between">
						<label for="mantra-pace" class="flex items-center gap-2 text-sm font-medium">
							<Clock class="h-4 w-4" />
							<span>Speed</span>
						</label>
						<span class="text-xs text-gray-500">
							{secondsPerCycle}s per cycle
						</span>
					</div>

					<input
						id="mantra-pace"
						type="range"
						min="24"
						max="120"
						step="4"
						value={$soundStore.mantraPace}
						on:input={handlePaceChange}
						class="range"
						tabindex="0"
						aria-label="Adjust mantra pace"
					/>

					<div class="flex justify-between text-xs text-gray-500">
						<span>Slower</span>
						<span>Faster</span>
					</div>
				</div>
			</div>
		</div>
	</div>
</aside>
