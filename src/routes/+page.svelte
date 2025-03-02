<script>
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

<div class="min-h-screen bg-gradient-to-b from-base-200 to-base-100">
	<main class="container mx-auto max-w-2xl px-4 py-8">
		<header class="mb-8 text-center">
			<h1 class="text-4xl font-bold mb-2">{title}</h1>
			<p class="text-lg opacity-75">{description}</p>
		</header>

		<TimerDisplay />
		<Resources />
	</main>

	<footer class="container mx-auto max-w-2xl px-4 py-6 text-center text-gray-500">
		<p class="mb-2">
			Crafted by <a href="https://www.chrisjmears.com/" class="underline hover:no-underline"
				>Chris J Mears</a
			>
		</p>
		<p>
			Check out the <a
				href="https://meditation.wanderingleafstudios.com/"
				class="underline hover:no-underline">Meditation Timer</a
			> 🧘‍♂️
		</p>
	</footer>
</div>
