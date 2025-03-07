<script lang="ts">
	import { soundStore, mantraNotes } from '$lib/stores/soundStore';
	import { createAudioEngine } from '$lib/services/audioService';
	import { Loader2, Speaker, Lock } from 'lucide-svelte';
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import * as Tone from 'tone';
	import { timerStore } from '$lib/stores/timerStore';
	import { TimerStatus } from '$lib/stores/timer/types';

	let isInitialized = false;
	let isLoading = false;
	let wakeLock: WakeLockSentinel | null = null;
	let wakeLockSupported = false;
	let wakeLockActive = false;

	// Check if Wake Lock API is supported
	onMount(() => {
		// Only run browser-specific code in the browser environment
		if (browser) {
			wakeLockSupported = 'wakeLock' in navigator;

			// Handle visibility change to reacquire wake lock when page becomes visible again
			document.addEventListener('visibilitychange', handleVisibilityChange);

			// Handle audio context resuming on user interaction
			document.addEventListener('click', resumeAudioContext, { once: true });
			document.addEventListener('touchstart', resumeAudioContext, { once: true });
			document.addEventListener('keydown', resumeAudioContext, { once: true });
		}
	});

	onDestroy(() => {
		// Only run browser-specific code in the browser environment
		if (browser) {
			// Clean up event listeners
			document.removeEventListener('visibilitychange', handleVisibilityChange);

			// Release wake lock if active
			releaseWakeLock();
		}
	});

	// Subscribe to timer state to manage wake lock based on timer status
	const unsubscribeTimer = timerStore.subscribe(($timer) => {
		// Only run browser-specific code in the browser environment
		if (browser) {
			if ($timer.status === TimerStatus.RUNNING && isInitialized) {
				if (!wakeLockActive && wakeLockSupported) {
					requestWakeLock();
				}
				resumeAudioContext();
			} else if ($timer.status !== TimerStatus.RUNNING && wakeLockActive) {
				releaseWakeLock();
			}
		}
	});

	// Request wake lock to prevent device from sleeping
	async function requestWakeLock() {
		if (!wakeLockSupported) return;

		try {
			wakeLock = await navigator.wakeLock.request('screen');
			wakeLockActive = true;

			// Add release event listener
			wakeLock.addEventListener('release', () => {
				wakeLockActive = false;
				console.log('Wake lock released');
			});

			console.log('Wake lock acquired');
		} catch (error) {
			console.error('Failed to acquire wake lock:', error);
			wakeLockActive = false;
		}
	}

	// Release wake lock
	function releaseWakeLock() {
		if (wakeLock) {
			wakeLock
				.release()
				.then(() => {
					wakeLock = null;
					wakeLockActive = false;
				})
				.catch((error) => {
					console.error('Failed to release wake lock:', error);
				});
		}
	}

	// Handle visibility change events
	async function handleVisibilityChange() {
		// Only run if in browser environment
		if (browser && document.visibilityState === 'visible') {
			// Reacquire wake lock if timer is running
			const $timer = $timerStore;
			if ($timer.status === TimerStatus.RUNNING && isInitialized && !wakeLockActive) {
				await requestWakeLock();
			}

			// Resume audio context if it was suspended
			resumeAudioContext();
		}
	}

	// Resume audio context if it was suspended
	async function resumeAudioContext() {
		// Only run in browser environment
		if (browser && Tone.getContext().state === 'suspended') {
			try {
				await Tone.getContext().resume();
				console.log('AudioContext resumed');
			} catch (error) {
				console.error('Failed to resume AudioContext:', error);
			}
		}
	}

	async function initializeAudio() {
		if (isInitialized || isLoading || !browser) return;

		isLoading = true;
		try {
			// First, try to resume the audio context
			await Tone.start();

			const audioEngine = await createAudioEngine($soundStore.volumeLevel, mantraNotes, (index) =>
				soundStore.updateCurrentMantra(index)
			);
			soundStore.setAudioEngine(audioEngine);
			isInitialized = true;

			// If timer is already running, request wake lock
			const $timer = $timerStore;
			if ($timer.status === TimerStatus.RUNNING && wakeLockSupported) {
				await requestWakeLock();
			}
		} catch (error) {
			console.error('Failed to initialize audio:', error);
		} finally {
			isLoading = false;
		}
	}

	// Clean up on component destruction
	onDestroy(() => {
		releaseWakeLock();
		unsubscribeTimer();
	});
</script>

{#if !isInitialized}
	<div class="fixed bottom-4 right-4 z-50">
		<button
			class="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
			on:click={initializeAudio}
			on:keydown={(e) => e.key === 'Enter' && initializeAudio()}
			disabled={isLoading}
			title="Initialize audio for meditation"
			tabindex="0"
			aria-label="Initialize audio for meditation"
		>
			{#if isLoading}
				<Loader2 class="animate-spin h-5 w-5" />
			{:else}
				<Speaker class="h-5 w-5" />
			{/if}
			{isLoading ? 'Initializing...' : 'Initialize Audio'}
		</button>
	</div>
{:else if wakeLockSupported}
	<div class="fixed bottom-4 right-4 z-50">
		<div
			class="flex items-center gap-1 text-xs px-2 py-1 rounded-lg {wakeLockActive
				? 'bg-green-100 text-green-800'
				: 'bg-gray-100 text-gray-600'}"
			title={wakeLockActive
				? 'Screen will stay awake during meditation'
				: 'Screen may turn off during meditation'}
		>
			<Lock class="h-3 w-3" />
			<span>{wakeLockActive ? 'Stay Awake: On' : 'Stay Awake: Off'}</span>
		</div>
	</div>
{/if}
