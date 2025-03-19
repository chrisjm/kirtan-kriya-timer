<script lang="ts">
	import TimerDisplay from '$lib/components/TimerDisplay.svelte';
	import { onDestroy } from 'svelte';
	import { timerStore } from '$lib/stores/timerStore';
	import { TimerStatus } from '$lib/stores/timer/types';

	let title = 'Kirtan Kriya Timer';
	let description =
		'A 12-minute meditation practice for improved brain function and spiritual growth';
	
	// Pause the timer when navigating away from the main page
	onDestroy(() => {
		// Only pause if the timer is running
		if (timerStore.getStatus() === TimerStatus.RUNNING) {
			console.log('Pausing timer due to navigation');
			timerStore.pauseTimer();
		}
	});
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
</svelte:head>

<main class="container mx-auto max-w-2xl px-4 py-8">
	<header class="mb-8 text-center">
		<h1 class="text-4xl font-bold mb-2">{title}</h1>
		<p class="text-lg text-gray-600 dark:text-gray-400">{description}</p>
	</header>

	<TimerDisplay />

	<!-- FAQ Link Section -->
	<section class="my-6">
		<div
			class="border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden p-4 text-center"
		>
			<p class="mb-3">Have questions about Kirtan Kriya meditation?</p>
			<a
				href="/faq"
				class="inline-block px-4 py-2 bg-primary text-white rounded-md hover:bg-success transition-colors"
			>
				View Frequently Asked Questions
			</a>
		</div>
	</section>
</main>
