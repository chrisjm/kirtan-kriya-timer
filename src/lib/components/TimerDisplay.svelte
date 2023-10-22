<script lang="ts">
	// import * as Tone from 'tone';

	const millisecondsToSeconds: (milliseconds: number) => number = (milliseconds) =>
		Math.round(milliseconds / 1000);
	const minutesToMilliseconds: (minutes: number) => number = (minutes) => minutes * 60 * 1000;
	const secondsToMinutes: (seconds: number) => number = (seconds) => Math.floor(seconds / 60);
	const padWithZeroes: (number: number) => string = (number) => number.toString().padStart(2, '0');

	function formatTime(milliseconds: number) {
		const seconds = millisecondsToSeconds(milliseconds);
		return `${padWithZeroes(secondsToMinutes(seconds))}:${padWithZeroes(seconds % 60)}`;
	}

	// TODO: This should be more general and probably linear interpolation?
	// const volumeToDecibels = (value: number, r1 = [0, 100], r2 = [-48, 0]) => {
	// 	return Math.floor(((value - r1[0]) * (r2[1] - r2[0])) / (r1[1] - r1[0]) + r2[0]);
	// };

	let isRunning = false;
	let actions = [
		'Out-loud chant',
		'Whisper chant',
		'Mental chant',
		'Whisper chant',
		'Out-lout chant'
	];
	let durations = [
		minutesToMilliseconds(2),
		minutesToMilliseconds(2),
		minutesToMilliseconds(4),
		minutesToMilliseconds(2),
		minutesToMilliseconds(2)
	];
	// let volumes = [90, 60, 30, 60, 90];
	let timerEndTime: number;
	let timerId: NodeJS.Timer;
	let timerIndex = 0;
	let timeRemaining: number = durations[0];
	let mantra = '';
	// let synth: Tone.Synth<Tone.SynthOptions> | Tone.PolySynth<Tone.Synth<Tone.SynthOptions>>;
	// let loop: Tone.Loop<Tone.LoopOptions>;
	// let vol: Tone.Volume;
	// let noteIndex = 0;
	// let soundLoaded = false;
	// let soundEnabled = false;
	// let soundPlaying = false;
	let duration = durations[timerIndex];

	$: actionLabel = actions[timerIndex];
	// $: volumeValue = volumes[timerIndex];

	// $: {
	// 	if (synth && volumeValue) {
	// 		synth.volume.value = volumeToDecibels(+volumeValue);
	// 	}
	// }

	// $: {
	// 	if (soundPlaying && soundEnabled) {
	// 		startTones();
	// 		if (vol) {
	// 			vol.mute = false;
	// 		}
	// 	} else {
	// 		if (vol) {
	// 			vol.mute = true;
	// 		}
	// 	}
	// }

	// const notes = [
	// 	{ pitch: 'E3', mantra: 'Sa' },
	// 	{ pitch: 'D3', mantra: 'Ta' },
	// 	{ pitch: 'C3', mantra: 'Na' },
	// 	{ pitch: 'D3', mantra: 'Ma' }
	// ];

	function updateCountdown() {
		clearTimeout(timerId);

		let now = Date.now();
		timeRemaining = timerEndTime - now;

		if (timeRemaining > 0) {
			timerId = setTimeout(updateCountdown, 1000);
		} else {
			if (timerIndex >= durations.length - 1) {
				pauseTimers();
				resetTimers();
			} else {
				nextTimer();
			}
		}
	}

	async function startTimers() {
		isRunning = true;
		// soundPlaying = true;
		timerEndTime = Date.now() + timeRemaining;
		// if (!soundLoaded) {
		// 	initializeSound();
		// }
		updateCountdown();
	}

	function nextTimer() {
		timerIndex += 1;
		duration = durations[timerIndex];
		timerEndTime = Date.now() + duration;
		updateCountdown();
	}

	function resetTimers() {
		timerIndex = 0;
		// noteIndex = 0;
		timeRemaining = durations[timerIndex];
		// stopTones();
	}

	function pauseTimers() {
		clearTimeout(timerId);
		isRunning = false;
		// Tone.Transport.pause();
	}

	// function stopTones() {
	// 	soundPlaying = false;
	// 	Tone.Transport.stop();
	// }

	// function startTones() {
	// 	soundPlaying = true;
	// 	Tone.Transport.bpm.value = 60;
	// 	Tone.Transport.start();
	// }

	// Must be initialized via user interation because of the audio
	// async function initializeSound() {
	// 	await Tone.start();
	// 	vol = new Tone.Volume(volumeToDecibels(volumeValue)).toDestination();
	// 	synth = new Tone.Synth().connect(vol);
	// 	loop = new Tone.Loop((time) => {
	// 		synth.triggerAttackRelease(notes[noteIndex].pitch, '4n', time);
	// 		mantra = notes[noteIndex].mantra;
	// 		noteIndex += 1;
	// 		if (noteIndex >= notes.length) {
	// 			noteIndex = 0;
	// 		}
	// 	}).start(0);
	// 	soundLoaded = true;
	// }

	function handleTimerSelect(index: number) {
		if (isRunning) {
			pauseTimers();
		}
		timerIndex = index;
		timeRemaining = durations[index];
	}

	// function handleSoundToggle() {
	// 	soundPlaying = !soundPlaying;
	// 	console.log(soundPlaying);
	// }
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
						{actions[index]}
					</span>
				</button>
			</li>
		{/each}
	</ul>
</section>
<!-- <section class="my-6">
	<div class="flex gap-3">
		<label class="cursor-pointer label flex flex-col gap-2">
			<span class="label-text">Sound</span>
			<input
				type="checkbox"
				class="toggle toggle-primary"
				bind:checked={soundEnabled}
				on:click={handleSoundToggle}
			/>
		</label>
		{#if soundEnabled}
			<label class="label flex-1 flex flex-col gap-2">
				<span class="label-text">Volume: {volumeValue}</span>
				<input type="range" min="0" max="100" bind:value={volumeValue} class="range" step="1" />
			</label>
		{/if}
	</div>
</section> -->
<section class="my-6">
	<div tabindex="-1" class="collapse collapse-arrow border border-base-300 bg-base-200">
		<div class="collapse-title text-xl font-medium">Resources</div>
		<div class="collapse-content">
			<ul class="list-disc pl-6">
				<li>
					<a
						href="https://alzheimersprevention.org/research/kirtan-kriya-yoga-exercise/"
						class="link link-primary"
						target="_blank"
						>Practice The 12-Minute Yoga Meditation Exercise - Alzheimer's Research and Prevention
						Foundation</a
					>
				</li>
				<li>
					<a
						href="https://www.ijhsr.org/IJHSR_Vol.11_Issue.1_Jan2021/IJHSR35.pdf"
						class="link link-primary"
						target="_blank"
						>A Review on Therapeutic Effect of Kirtan Kriya Yoga - International Journal of Health
						Sciences and Research</a
					>
				</li>
				<li>
					<a href="https://youtu.be/hHFMxq2wjR4" class="link link-primary" target="_blank"
						>Dr. Dharma on the Healing Power of Kirtan Kriya - YouTube</a
					>
				</li>
			</ul>
		</div>
	</div>
</section>
