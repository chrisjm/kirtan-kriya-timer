<script lang="ts">
  import { timerStore, type TimerPhase } from '$lib/stores/timerStore';
  
  // Calculate total duration in milliseconds
  $: totalDuration = $timerStore.phases.reduce(
    (total, phase) => total + phase.durationMinutes * 60 * 1000, 
    0
  );
  
  // Calculate completed duration based on completed phases and current phase progress
  $: completedDuration = $timerStore.phases
    .slice(0, $timerStore.currentPhaseIndex)
    .reduce((total, phase) => total + phase.durationMinutes * 60 * 1000, 0) + 
    ($timerStore.phases[$timerStore.currentPhaseIndex].durationMinutes * 60 * 1000 - $timerStore.timeRemaining);
  
  // Calculate overall progress percentage
  $: progressPercentage = Math.min(100, Math.max(0, (completedDuration / totalDuration) * 100));
  
  // Get phase durations as percentages of total duration for the segmented progress bar
  $: phasePercentages = $timerStore.phases.map(
    phase => (phase.durationMinutes * 60 * 1000 / totalDuration) * 100
  );
  
  // Get current phase color based on volume level (louder = brighter)
  function getPhaseColor(phase: TimerPhase, isActive: boolean): string {
    const baseColor = 'hsl(215, 70%, ';
    
    // Normalize volume to brightness (30-90%)
    const brightness = 30 + (phase.volume / 100) * 60;
    
    // Make active phase more saturated
    return isActive 
      ? `hsl(215, 90%, ${brightness}%)` 
      : `${baseColor}${brightness}%)`;
  }
</script>

<div class="w-full my-4">
  <!-- Overall progress bar -->
  <div class="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
    <div 
      class="h-full bg-primary transition-all duration-1000 ease-linear" 
      style="width: {progressPercentage}%">
    </div>
  </div>
  
  <!-- Segmented phase indicators -->
  <div class="w-full h-6 mt-2 flex rounded-full overflow-hidden">
    {#each $timerStore.phases as phase, i}
      <div 
        class="h-full flex items-center justify-center text-xs font-medium transition-colors duration-300"
        style="
          width: {phasePercentages[i]}%; 
          background-color: {getPhaseColor(phase, i === $timerStore.currentPhaseIndex)};
          color: {phase.volume > 50 ? 'white' : 'black'};
          {i === $timerStore.currentPhaseIndex ? 'border: 2px solid white;' : ''}
        "
        title="{phase.action} - {phase.durationMinutes} min"
      >
        {i + 1}
      </div>
    {/each}
  </div>
</div>
