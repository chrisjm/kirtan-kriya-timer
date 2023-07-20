<script>
  let title = "Kirtan Kriya Timer";
  import TimerList from '$lib/components/TimerList.svelte';
  import TimerDisplay from '$lib/components/TimerDisplay.svelte';
</script>

<main>
  <h1>{title}</h1>
  <TimerDisplay />
  <TimerList />
</main>
