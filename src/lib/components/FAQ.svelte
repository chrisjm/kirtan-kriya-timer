<script lang="ts">
  import { onMount } from 'svelte';
  import FaqContent from '$lib/content/faq.md';
  
  // Track if the component is mounted
  let mounted = false;
  
  onMount(() => {
    mounted = true;
  });
</script>

<!-- FAQ Section -->
<section class="my-6">
  <div
    class="border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden p-4"
  >
    <div class="text-xl font-medium mb-4">Frequently Asked Questions</div>
    
    {#if mounted}
      <div class="prose dark:prose-invert prose-sm max-w-none">
        <svelte:component this={FaqContent} />
      </div>
    {/if}
  </div>
</section>
