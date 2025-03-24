<script>
	import '../app.css';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import SettingsToggle from '$lib/components/SettingsToggle.svelte';
	import SettingsSidebar from '$lib/components/SettingsSidebar.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import { dev } from '$app/environment';
	import { injectAnalytics } from '@vercel/analytics/sveltekit';
	import { injectSpeedInsights } from '@vercel/speed-insights/sveltekit';

	// Only inject analytics and speed insights in production and not during testing
	const isTestEnvironment = process.env.TEST;
	if (!isTestEnvironment) {
		injectAnalytics({ mode: dev ? 'development' : 'production' });
		injectSpeedInsights();
	}
</script>

<svelte:head>
	<title>Kirtan Kriya Timer</title>
	<meta name="color-scheme" content="light dark" />
</svelte:head>

<div
	class="min-h-screen bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100 transition-colors duration-200"
>
	<div class="fixed top-4 left-4 z-50">
		<ThemeToggle />
	</div>
	<div class="fixed top-4 right-4 z-50">
		<SettingsToggle />
	</div>
	<SettingsSidebar />
	<slot />
	<Footer />
</div>
