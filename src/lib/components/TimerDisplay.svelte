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
	let duration: number | undefined;
	let timerEndTime: number;
	let timerId: NodeJS.Timer;
	let timerIndex = 0;
	let timeRemaining: number = durations[0];
	let mantra = '';

	function updateCountdown() {
		let now = Date.now();
		clearTimeout(timerId);
		timeRemaining = timerEndTime - now;

		if (timeRemaining > 0) {
			timerId = setTimeout(updateCountdown, 1000);
		} else {
			nextTimer();
		}
	}

	function nextTimer() {
		clearTimeout(timerId);
		timerIndex += 1;
		if (timerIndex < durations.length) {
			duration = durations[timerIndex];
			timerEndTime = Date.now() + duration;
			updateCountdown();
		} else {
			cancelTimers();
		}
	}

	async function startTimers() {
		timerIndex = 0;
		duration = durations[timerIndex];
		timerEndTime = Date.now() + duration;
		isRunning = true;
		updateCountdown();
		await Tone.start();
		const synth = new Tone.PolySynth().toDestination();
		const notes = [
			{ pitch: 'E4', mantra: 'SA' },
			{ pitch: 'D4', mantra: 'TA' },
			{ pitch: 'C4', mantra: 'NA' },
			{ pitch: 'D4', mantra: 'MA' }
		];
		let i = 0;
		const loopA = new Tone.Loop((time) => {
			synth.triggerAttackRelease(notes[i].pitch, '4n', time);
      mantra = notes[i].mantra;
			i += 1;
			if (i >= notes.length) {
				i = 0;
			}
		}, '4n').start(0);
		Tone.Transport.bpm.value = 60;
		Tone.Transport.start();
	}

	function formatTime(time: number) {
		const seconds = millisecondsToSeconds(time);
		const minutes = secondsToMinutes(seconds);
		const remainingSeconds = seconds % 60;
		return `${padWithZeroes(minutes)}:${padWithZeroes(remainingSeconds)}`;
	}

	function cancelTimers() {
		// TODO: Add some logic to prompt the user to record the cause of the interruption.
		idle();
	}

	function idle() {
		isRunning = false;
		Tone.Transport.stop();
		clearTimeout(timerId);
	}
</script>

<section>
	<p>
		{formatTime(timeRemaining)}
	</p>
	<p>
		{mantra}
	</p>
	<footer>
		<button on:click={startTimers} disabled={isRunning}>start</button>
		<button on:click={cancelTimers} disabled={!isRunning}>cancel</button>
	</footer>
</section>
