<script lang="ts">
  import { timerStore } from '$lib/stores/timerStore';
  import { intervalOptions } from '$lib/stores/intervalStore';
  
  // Use $timerStore to access the current multiplier
  $: currentMultiplier = $timerStore.intervalMultiplier;
  
  // Handler for changing the interval multiplier
  const handleIntervalChange = (event: Event) => {
    if (event.target instanceof HTMLSelectElement) {
      const newValue = parseFloat(event.target.value);
      timerStore.setIntervalMultiplier(newValue);
    }
  };
</script>

<div class="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
  <h3 class="text-lg font-medium mb-2">Meditation Duration</h3>
  <div class="flex flex-col gap-2">
    <p class="text-sm text-gray-600 dark:text-gray-400">
      Select the duration multiplier for each phase (standard pattern: 2x + 2x + 4x + 2x + 2x).
    </p>
    
    <div class="flex items-center gap-2">
      <label for="interval-select" class="text-sm font-medium">Interval:</label>
      <select
        id="interval-select"
        class="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        value={currentMultiplier}
        on:change={handleIntervalChange}
        aria-label="Select interval multiplier"
      >
        {#each intervalOptions as option}
          <option value={option.value}>{option.label} (total: {12 * option.value} min)</option>
        {/each}
      </select>
    </div>
    
    <div class="grid grid-cols-5 gap-1 mt-2 text-xs text-center">
      {#each [2, 2, 4, 2, 2] as multiplier, i}
        <div 
          class="p-2 rounded bg-primary/10 dark:bg-primary/20 flex flex-col items-center justify-center"
        >
          <span class="font-medium">{i === 0 || i === 4 ? 'Loud' : i === 1 || i === 3 ? 'Whisper' : 'Silent'}</span>
          <span>{multiplier * currentMultiplier} min</span>
        </div>
      {/each}
    </div>
    
    <div class="text-sm mt-2 font-medium">
      Total meditation time: {12 * currentMultiplier} minutes
    </div>
  </div>
</div>
