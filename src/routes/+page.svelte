<script lang="ts">
	import Resources from '$lib/components/Resources.svelte';
	import TimerDisplay from '$lib/components/TimerDisplay.svelte';

	let title = 'Kirtan Kriya Timer';
	let description =
		'A 12-minute meditation practice for improved brain function and spiritual growth';
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
	<Resources />
</main>
