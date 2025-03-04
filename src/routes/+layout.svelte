<script>
	import '../app.css';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import { dev } from '$app/environment';
	import { injectAnalytics } from '@vercel/analytics/sveltekit';

	injectAnalytics({ mode: dev ? 'development' : 'production' });
</script>

<svelte:head>
	<title>Kirtan Kriya Timer</title>
	<meta name="color-scheme" content="light dark" />
</svelte:head>

<div
	class="min-h-screen bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100 transition-colors duration-200"
>
	<div class="fixed top-4 right-4 z-50">
		<ThemeToggle />
	</div>
	<slot />
	<Footer />
</div>
