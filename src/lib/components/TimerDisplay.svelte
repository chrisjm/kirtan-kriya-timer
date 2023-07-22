<script lang="ts">
	import * as Tone from 'tone';

	const millisecondsToSeconds: (milliseconds: number) => number = (milliseconds) =>
		Math.round(milliseconds / 1000);
	const minutesToMilliseconds: (minutes: number) => number = (minutes) => minutes * 60 * 1000;
	const secondsToMinutes: (seconds: number) => number = (seconds) => Math.floor(seconds / 60);
	const padWithZeroes: (number: number) => string = (number) => number.toString().padStart(2, '0');

	let isRunning = false;
	let durations = [
		minutesToMilliseconds(2),
		minutesToMilliseconds(2),
		minutesToMilliseconds(4),
		minutesToMilliseconds(2),
		minutesToMilliseconds(2)
	];
	let actions = ['Chanting', 'Whispering', 'Thinking', 'Whispering', 'Chanting'];
	let duration: number | undefined;
	let timerEndTime: number;
	let timerId: NodeJS.Timer;
	let timerIndex = 0;
	let actionLabel = '';
	let timeRemaining: number = durations[0];
	let mantra = '';
	let synth: Tone.PolySynth<Tone.Synth<Tone.SynthOptions>>;
	let loop: Tone.Loop<Tone.LoopOptions>;
	let noteIndex = 0;
	let soundLoaded = false;

	$: actionLabel = actions[timerIndex];

	const notes = [
		{ pitch: 'E4', mantra: 'Sa' },
		{ pitch: 'D4', mantra: 'Ta' },
		{ pitch: 'C4', mantra: 'Na' },
		{ pitch: 'D4', mantra: 'Ma' }
	];

	function updateCountdown() {
		clearTimeout(timerId);
		let now = Date.now();
		timeRemaining = timerEndTime - now;

		if (timeRemaining > 0) {
			timerId = setTimeout(updateCountdown, 1000);
		} else {
			nextTimer();
		}
	}

	function nextTimer() {
		if (!timerIndex) {
			timerIndex = 0;
		} else {
			timerIndex += 1;
		}

		duration = durations[timerIndex];
		timerEndTime = Date.now() + duration;
		updateCountdown();

		if (timerIndex > durations.length) {
			pauseTimers();
		}
	}

	function startTones() {
		Tone.Transport.bpm.value = 66;
		Tone.Transport.start();
	}

	async function initializeSound() {
		await Tone.start();
		synth = new Tone.PolySynth().toDestination();
		loop = new Tone.Loop((time) => {
			synth.triggerAttackRelease(notes[noteIndex].pitch, '4n', time);
			mantra = notes[noteIndex].mantra;
			noteIndex += 1;
			if (noteIndex >= notes.length) {
				noteIndex = 0;
			}
		}).start(0);
		soundLoaded = true;
	}

	function resetTimers() {
		timerIndex = 0;
		noteIndex = 0;
		duration = durations[timerIndex];
		timeRemaining = duration;
	}

	async function startTimers() {
		isRunning = true;
		if (!duration) {
			duration = durations[timerIndex];
		}
		timerEndTime = Date.now() + timeRemaining;
		updateCountdown();
		if (!soundLoaded) {
			initializeSound();
		}
		startTones();
	}

	function pauseTimers() {
		clearTimeout(timerId);
		isRunning = false;
		Tone.Transport.pause();
	}

	function formatTime(milliseconds: number) {
		const seconds = millisecondsToSeconds(milliseconds);
		return `${padWithZeroes(secondsToMinutes(seconds))}:${padWithZeroes(seconds % 60)}`;
	}

	function handleTimerSelect(index: number) {
		if (isRunning) {
			pauseTimers();
		}
		timerIndex = index;
		duration = durations[index];
		timeRemaining = duration;
	}
</script>

<section class="text-center my-6">
	<span class="countdown font-mono text-3xl">
		<span
			style="--value:{padWithZeroes(secondsToMinutes(millisecondsToSeconds(timeRemaining)))};"
		/>:
		<span style="--value:{padWithZeroes(millisecondsToSeconds(timeRemaining) % 60)};" />
	</span>
	<div class="my-3">
		{#if isRunning}
			<button class="btn btn-warning" on:click={pauseTimers} disabled={!isRunning}>PAUSE</button>
		{:else}
			<button class="btn btn-success" on:click={startTimers} disabled={isRunning}>START</button>
		{/if}
		<button class="btn btn-error" on:click={resetTimers} disabled={isRunning}>RESET</button>
	</div>
	<p class="font-bold my-3">
		<span class="">{timerIndex + 1}. {formatTime(durations[timerIndex])} {actionLabel}</span>
		{#if mantra}
			<span class="font-medium">: {mantra}</span>
		{/if}
	</p>
</section>
<section class="text-center my-6">
	<ul>
		{#each durations as duration, index (index)}
			<li class="cursor-pointer">
				<button
					on:click={() => handleTimerSelect(index)}
					on:keypress={() => handleTimerSelect(index)}
				>
					{index + 1}.
					<span class="underline hover:text-primary">
						{formatTime(duration)}
						{actions[index]} mantra
					</span>
				</button>
			</li>
		{/each}
	</ul>
</section>
