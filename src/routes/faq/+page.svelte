<script lang="ts">
	import FaqContent from '$lib/content/faq.md';
	import { onMount } from 'svelte';
	import { timerStore } from '$lib/stores/timerStore';
	import { TimerStatus } from '$lib/stores/timer/types';

	const title = 'Frequently Asked Questions | Kirtan Kriya Timer';
	const description = 'Learn more about Kirtan Kriya meditation and its benefits';
	
	// Store the timer status when this page is loaded
	let wasTimerRunning = false;
	
	onMount(() => {
		// Check if the timer was running when navigating to this page
		// This information will be used when navigating back to the main page
		// to prevent auto-resuming the timer
		wasTimerRunning = timerStore.getStatus() === TimerStatus.RUNNING;
		
		// If the timer is still running (which shouldn't happen but just in case),
		// pause it
		if (wasTimerRunning) {
			console.log('Pausing timer that was still running on FAQ page');
			timerStore.pauseTimer();
		}
	});
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
</svelte:head>

<main class="container mx-auto max-w-2xl px-4 py-8">
	<header class="mb-8">
		<h1 class="text-4xl font-bold mb-2">Frequently Asked Questions</h1>
		<p class="text-lg text-gray-600 dark:text-gray-400">{description}</p>
		<a href="/" class="inline-block mt-4 text-primary hover:underline" tabindex="0">
			&larr; Back to Timer
		</a>
	</header>

	<div class="prose dark:prose-invert prose-lg max-w-none">
		<svelte:component this={FaqContent} />
	</div>
</main>
