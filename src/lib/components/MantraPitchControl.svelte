<script lang="ts">
	import { soundStore, mantraNotes } from '$lib/stores/soundStore';
	import { Music } from 'lucide-svelte';

	// Predefined pitch tuples for the mantra syllables
	const pitchTuples = [
		{
			id: 'octave1',
			name: 'Octave 1 (Low)',
			pitches: ['E2', 'D2', 'C2', 'D2']
		},
		{
			id: 'octave2',
			name: 'Octave 2 (Medium)',
			pitches: ['E3', 'D3', 'C3', 'D3']
		},
		{
			id: 'octave3',
			name: 'Octave 3 (High)',
			pitches: ['E4', 'D4', 'C4', 'D4']
		}
	];

	// Find the currently selected tuple based on the current pitches
	$: selectedTuple =
		pitchTuples.find(
			(tuple) => JSON.stringify(tuple.pitches) === JSON.stringify($soundStore.mantraPitches)
		)?.id || 'custom';

	// Handle pitch tuple selection
	const handleTupleChange = (event: Event) => {
		if (event.target instanceof HTMLSelectElement) {
			const tupleId = event.target.value;
			const selectedTuple = pitchTuples.find((tuple) => tuple.id === tupleId);
			if (selectedTuple) {
				soundStore.setPitches(selectedTuple.pitches);
			}
		}
	};
</script>

<div class="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
	<h3 class="text-lg font-medium mb-2">Mantra Pitch</h3>
	<div class="flex flex-col gap-4 w-full">
		<div class="flex items-center gap-2 text-sm font-medium">
			<Music class="h-4 w-4" />
			<span>Select Pitch Octave</span>
		</div>

		<div class="flex flex-col gap-1">
			<label for="pitch-tuple" class="text-sm font-medium"> Octave Selection </label>
			<select
				id="pitch-tuple"
				value={selectedTuple}
				on:change={handleTupleChange}
				class="select select-bordered w-full text-sm h-9 bg-white dark:bg-gray-700"
				tabindex="0"
				aria-label="Select mantra pitch octave"
			>
				{#each pitchTuples as tuple}
					<option value={tuple.id}>{tuple.name}</option>
				{/each}
				{#if selectedTuple === 'custom'}
					<option value="custom">Custom</option>
				{/if}
			</select>
		</div>

		<div class="mt-2 text-xs text-gray-500 dark:text-gray-400">
			<p>Current pitch pattern: {mantraNotes.map((note) => note.pitch).join(', ')}</p>
			<p class="mt-1">
				Lower octaves produce deeper tones suitable for lower vocal ranges, while higher octaves
				produce higher tones for higher vocal ranges.
			</p>
		</div>
	</div>
</div>
