<script lang="ts">
	import { onMount } from 'svelte';

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
		const savedTheme = (localStorage.getItem('theme') as Theme) || 'auto';
		theme = savedTheme;
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
		localStorage.setItem('theme', theme);
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
			<svg
				class="h-5 w-5"
				fill="currentColor"
				viewBox="0 0 20 20"
				xmlns="http://www.w3.org/2000/svg"
			>
				<path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
			</svg>
		{:else if theme === 'light' || (theme === 'auto' && getSystemTheme() === 'light')}
			<svg
				class="h-5 w-5"
				fill="currentColor"
				viewBox="0 0 20 20"
				xmlns="http://www.w3.org/2000/svg"
			>
				<path
					fill-rule="evenodd"
					d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
					clip-rule="evenodd"
				/>
			</svg>
		{:else}
			<svg
				class="h-5 w-5"
				fill="currentColor"
				viewBox="0 0 20 20"
				xmlns="http://www.w3.org/2000/svg"
			>
				<path d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12z" />
			</svg>
		{/if}
	</button>
{/if}
