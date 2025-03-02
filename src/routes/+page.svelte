<script>
  let title = "Kirtan Kriya Timer";
  import TimerList from '$lib/components/TimerList.svelte';
  import TimerDisplay from '$lib/components/TimerDisplay.svelte';
</script>

<main class="mx-auto max-w-xl my-3">
  <h1 class="text-4xl text-center font-sans-serif font-medium">{title}</h1>
  <TimerDisplay />
  <TimerList />
</main>

<footer class="text-center mt-8 mb-4 text-gray-600">
  <p>Check out our <a href="https://meditation.wanderingleafstudios.com/" class="text-blue-600 hover:text-blue-800 underline">Meditation Timer</a></p>
</footer>
