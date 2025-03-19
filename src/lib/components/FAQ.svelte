<script lang="ts">
	import FaqContent from '$lib/content/faq.md';
</script>

<!-- FAQ Section -->
<section class="my-6">
	<div
		class="border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden p-4"
	>
		<div class="text-xl font-medium mb-4">Frequently Asked Questions</div>

		<div class="prose dark:prose-invert prose-sm max-w-none">
			<svelte:component this={FaqContent} />
		</div>
	</div>
</section>
