<script lang="ts">
	import { uiStore, closeSettingsSidebar } from '$lib/stores/uiStore';
	import IntervalSelector from './IntervalSelector.svelte';
	import MantraPaceControl from './MantraPaceControl.svelte';
	import MantraPitchControl from './MantraPitchControl.svelte';
	import { X } from 'lucide-svelte';
	import { fly } from 'svelte/transition';

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
		role="button"
		tabindex="0"
		aria-label="Close settings"
		class="fixed inset-0 bg-black/30 dark:bg-black/50 z-40 transition-opacity duration-300"
		on:click={handleClickOutside}
		on:keydown={(e) => e.key === 'Escape' && closeSettingsSidebar()}
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
			<MantraPaceControl />

			<!-- Mantra Pitch Control -->
			<MantraPitchControl />
		</div>
	</div>
</aside>
