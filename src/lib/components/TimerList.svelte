<script lang="ts">
	import { timerStore } from '$lib/stores/timerStore';
</script>

<div class="my-8">
	<div class="mb-4">
		<h2 class="text-xl font-medium">Meditation Phases</h2>
	</div>

	<div class="overflow-x-auto">
		<table class="table w-full">
			<thead>
				<tr>
					<th class="w-12">#</th>
					<th>Phase</th>
					<th class="w-24">Duration</th>
					<th class="w-24">Volume</th>
				</tr>
			</thead>
			<tbody>
				{#each $timerStore.phases as phase, i}
					<tr class={i === $timerStore.currentPhaseIndex ? 'bg-base-200 font-medium' : ''}>
						<td>{i + 1}</td>
						<td>{phase.action}</td>
						<td>{phase.durationMinutes} min</td>
						<td>
							<input
								type="range"
								min="0"
								max="100"
								class="range"
								value={phase.volume}
								on:input={(e) => {
									const target = e.target;
									const newPhases = [...$timerStore.phases];
									newPhases[i].volume = parseInt(target.value);
									timerStore.updatePhases(newPhases);
								}}
							/>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
