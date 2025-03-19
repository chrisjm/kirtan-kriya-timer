<script lang="ts">
	import FaqContent from '$lib/content/faq.md';

	const title = 'Frequently Asked Questions | Kirtan Kriya Timer';
	const description = 'Learn more about Kirtan Kriya meditation and its benefits';
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
