<script lang="ts">
	import { toggleSettingsSidebar } from '$lib/stores/uiStore';
	import { Settings } from 'lucide-svelte';
</script>

<button
	class="p-2 rounded-full bg-white dark:bg-gray-800 shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
	on:click={toggleSettingsSidebar}
	aria-label="Toggle settings sidebar"
	tabindex="0"
	on:keydown={(e) => e.key === 'Enter' && toggleSettingsSidebar()}
>
	<Settings class="h-5 w-5" />
</button>
