<script lang="ts">
	import { onMount } from 'svelte';
	import { getTheme, setTheme } from '../services/storageService';
	import { Moon, Sun, Monitor } from 'lucide-svelte';

	type Theme = 'light' | 'dark' | 'auto';
	let theme: Theme = 'auto';
	let mounted = false;

	function getSystemTheme(): 'light' | 'dark' {
		return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
	}

	function updateTheme(newTheme: Theme) {
		const effectiveTheme = newTheme === 'auto' ? getSystemTheme() : newTheme;
		document.documentElement.classList.remove('light', 'dark');
		document.documentElement.classList.add(effectiveTheme);
	}

	function handleSystemThemeChange() {
		if (theme === 'auto') {
			updateTheme('auto');
		}
	}

	onMount(() => {
		theme = getTheme();
		updateTheme(theme);

		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
		mediaQuery.addEventListener('change', handleSystemThemeChange);
		mounted = true;

		return () => {
			mediaQuery.removeEventListener('change', handleSystemThemeChange);
		};
	});

	function cycleTheme() {
		const themes: Theme[] = ['light', 'dark', 'auto'];
		const currentIndex = themes.indexOf(theme);
		theme = themes[(currentIndex + 1) % themes.length];
		updateTheme(theme);
		setTheme(theme);
	}
</script>

{#if mounted}
	<button
		type="button"
		class="rounded-lg p-2.5 text-sm hover:bg-gray-100 focus:outline-none focus:ring-4 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-700"
		on:click={cycleTheme}
		aria-label="Toggle theme"
	>
		{#if theme === 'dark' || (theme === 'auto' && getSystemTheme() === 'dark')}
			<Moon class="h-5 w-5" />
		{:else if theme === 'light' || (theme === 'auto' && getSystemTheme() === 'light')}
			<Sun class="h-5 w-5" />
		{:else}
			<Monitor class="h-5 w-5" />
		{/if}
	</button>
{/if}
