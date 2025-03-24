<script lang="ts">
	// Props: Array of note names (e.g. ["E3", "D3", "C3", "D3"])
	export let notes: string[] = [];
	// Optional prop for width (default: 100% of container)
	export let width = '100%';
	// Optional prop for height (default: 120px)
	export let height = '120px';
	// Optional prop for staff color
	export let staffColor = 'currentColor';
	// Optional prop for note color
	export let noteColor = 'currentColor';
	// Optional prop for labels (Saa, Taa, Naa, Maa)
	export let showLabels = true;
	// Optional prop for syllables
	export let syllables: string[] = ['Saa', 'Taa', 'Naa', 'Maa'];

	// Constants for SVG dimensions and spacing
	const SVG_WIDTH = 400;
	const SVG_HEIGHT = 160; // Increased height to accommodate the treble clef
	const STAFF_LINE_SPACING = 10;
	const STAFF_TOP_POSITION = 60; // Moved staff down to give more space for the treble clef
	const NOTE_RADIUS = 6;
	const NOTE_SPACING = 80;
	const NOTE_START_X = 80; // Start position after the clef

	// Map of note names to staff positions (vertical position)
	// This maps each note to its vertical position on the staff
	// Middle C (C4) would be position 0, each step is half a staff line
	const notePositionMap: Record<string, number> = {
		// Octave 2 (Tone.js octave 3)
		C3: 10,
		'C#3': 10,
		Db3: 10,
		D3: 9,
		'D#3': 9,
		Eb3: 9,
		E3: 8,
		F3: 7,
		'F#3': 7,
		Gb3: 7,
		G3: 6,
		'G#3': 6,
		Ab3: 6,
		A3: 5,
		'A#3': 5,
		Bb3: 5,
		B3: 4,
		// Octave 3 (Tone.js octave 4)
		C4: 3,
		'C#4': 3,
		Db4: 3,
		D4: 2,
		'D#4': 2,
		Eb4: 2,
		E4: 1,
		F4: 0,
		'F#4': 0,
		Gb4: 0,
		G4: -1,
		'G#4': -1,
		Ab4: -1,
		A4: -2,
		'A#4': -2,
		Bb4: -2,
		B4: -3
	};

	// Function to get the Y position for a note on the staff
	const getNoteYPosition = (note: string): number => {
		// Use the note directly from the map or default to D3 position
		const basePosition = notePositionMap[note] ?? 7; // Default to D3 if not found

		return STAFF_TOP_POSITION + (basePosition * STAFF_LINE_SPACING) / 2;
	};

	// Function to check if a note has an accidental (sharp or flat)
	const hasAccidental = (note: string): boolean => {
		return note.includes('#') || note.includes('b');
	};

	// Function to get the accidental symbol
	const getAccidentalSymbol = (note: string): string => {
		if (note.includes('#')) return '♯';
		if (note.includes('b')) return '♭';
		return '';
	};

	// Function to get the note name without accidental
	const getNoteNameWithoutAccidental = (note: string): string => {
		return note.replace(/[#b]\d+$/, '').replace(/\d+$/, '');
	};

	// Calculate positions for each note
	$: notePositions = notes.map((note, index) => {
		return {
			x: NOTE_START_X + index * NOTE_SPACING,
			y: getNoteYPosition(note),
			note,
			hasAccidental: hasAccidental(note),
			accidental: getAccidentalSymbol(note),
			noteName: getNoteNameWithoutAccidental(note),
			syllable: syllables[index % syllables.length]
		};
	});
</script>

<div
	class="overflow-visible flex justify-center items-center"
	style="width: {width}; height: {height}"
>
	<svg
		viewBox="0 0 {SVG_WIDTH} {SVG_HEIGHT}"
		xmlns="http://www.w3.org/2000/svg"
		aria-label="Music staff notation showing the notes {notes.join(', ')}"
		class="w-full h-full"
	>
		<!-- Staff lines -->
		{#each Array(5) as _, i}
			<line
				x1="20"
				y1={STAFF_TOP_POSITION + i * STAFF_LINE_SPACING}
				x2={SVG_WIDTH - 20}
				y2={STAFF_TOP_POSITION + i * STAFF_LINE_SPACING}
				stroke={staffColor}
				stroke-width="1"
			/>
		{/each}

		<!-- Notes -->
		{#each notePositions as pos}
			<!-- Ledger lines if needed -->
			{#if pos.y < STAFF_TOP_POSITION}
				{#each Array(Math.ceil((STAFF_TOP_POSITION - pos.y) / STAFF_LINE_SPACING)) as _, j}
					<line
						x1={pos.x - 10}
						y1={STAFF_TOP_POSITION - (j + 1) * STAFF_LINE_SPACING}
						x2={pos.x + 10}
						y2={STAFF_TOP_POSITION - (j + 1) * STAFF_LINE_SPACING}
						stroke={staffColor}
						stroke-width="1"
					/>
				{/each}
			{:else if pos.y > STAFF_TOP_POSITION + 4 * STAFF_LINE_SPACING}
				{#each Array(Math.ceil((pos.y - (STAFF_TOP_POSITION + 4 * STAFF_LINE_SPACING)) / STAFF_LINE_SPACING)) as _, j}
					<line
						x1={pos.x - 10}
						y1={STAFF_TOP_POSITION + (5 + j) * STAFF_LINE_SPACING}
						x2={pos.x + 10}
						y2={STAFF_TOP_POSITION + (5 + j) * STAFF_LINE_SPACING}
						stroke={staffColor}
						stroke-width="1"
					/>
				{/each}
			{/if}

			<!-- Note head -->
			<ellipse
				cx={pos.x}
				cy={pos.y}
				rx={NOTE_RADIUS}
				ry={NOTE_RADIUS * 0.8}
				fill={noteColor}
				transform="rotate(-20, {pos.x}, {pos.y})"
			/>

			<!-- Accidental if needed -->
			{#if pos.hasAccidental}
				<text x={pos.x - 15} y={pos.y + 5} font-size="16" fill={noteColor}>{pos.accidental}</text>
			{/if}

			<!-- Syllable labels if enabled -->
			{#if showLabels}
				<text
					x={pos.x}
					y={pos.y + 25}
					text-anchor="middle"
					font-size="12"
					fill={noteColor}
					class="font-medium">{pos.syllable}</text
				>
			{/if}
		{/each}
	</svg>
</div>
