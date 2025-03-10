<script lang="ts">
	import { onMount } from 'svelte';
	import { getTheme, setTheme } from '../services/storageService';
	import { Moon, Sun, SunMoon } from 'lucide-svelte';

	type Theme = 'light' | 'dark' | 'auto';
	let theme: Theme = 'auto';
	let mounted = false;

	const themes: Theme[] = ['light', 'dark', 'auto'];

	const getSystemTheme = (): 'light' | 'dark' => {
		return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
	};

	const updateTheme = (newTheme: Theme): void => {
		const effectiveTheme = newTheme === 'auto' ? getSystemTheme() : newTheme;
		document.documentElement.classList.remove('light', 'dark');
		document.documentElement.classList.add(effectiveTheme);
	};

	const handleThemeToggle = (): void => {
		const currentIndex = themes.indexOf(theme);
		theme = themes[(currentIndex + 1) % themes.length];
		updateTheme(theme);
		setTheme(theme);
	};

	const handleKeyDown = (e: KeyboardEvent): void => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			handleThemeToggle();
		}
	};

	onMount(() => {
		// Initialize theme from storage
		theme = getTheme();
		updateTheme(theme);

		// Set up system theme change listener
		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
		const handleSystemThemeChange = () => theme === 'auto' && updateTheme('auto');
		mediaQuery.addEventListener('change', handleSystemThemeChange);
		mounted = true;

		return () => {
			mediaQuery.removeEventListener('change', handleSystemThemeChange);
		};
	});
</script>

{#if mounted}
	<button
		type="button"
		class="p-2 rounded-full bg-white dark:bg-gray-800 shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
		on:click={handleThemeToggle}
		on:keydown={handleKeyDown}
		aria-label="Toggle theme mode: {theme} mode"
		tabindex="0"
	>
		{#if theme === 'dark'}
			<Moon class="h-5 w-5" />
		{:else if theme === 'light'}
			<Sun class="h-5 w-5" />
		{:else}
			<SunMoon class="h-5 w-5" />
		{/if}
	</button>
{/if}
