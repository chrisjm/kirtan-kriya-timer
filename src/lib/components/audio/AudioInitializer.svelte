<script lang="ts">
	import { onMount, onDestroy, createEventDispatcher } from 'svelte';
	import { browser } from '$app/environment';
	import * as Tone from 'tone';
	import { timerStore } from '$lib/stores/timerStore';
	import { TimerStatus } from '$lib/stores/timer/types';
	import {
		isWakeLockSupported,
		requestWakeLock,
		releaseWakeLock,
		type WakeLockState
	} from '$lib/utils/wakeLockUtils';
	import { CheckCircle, AlertTriangle } from 'lucide-svelte';

	export let isInitialized = false;

	const dispatch = createEventDispatcher<{
		initialized: { success: boolean };
	}>();

	let isLoading = false;
	let wakeLockState: WakeLockState = {
		wakeLock: null,
		wakeLockSupported: false,
		wakeLockActive: false
	};

	// Check if Wake Lock API is supported
	onMount(() => {
		// Only run browser-specific code in the browser environment
		if (browser) {
			wakeLockState.wakeLockSupported = isWakeLockSupported();

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
			releaseWakeLock(wakeLockState.wakeLock).then(() => {
				wakeLockState = {
					...wakeLockState,
					wakeLock: null,
					wakeLockActive: false
				};
			});
		}
	});

	// Subscribe to timer state to manage wake lock based on timer status
	const unsubscribeTimer = timerStore.subscribe(($timer) => {
		// Only run browser-specific code in the browser environment
		if (browser) {
			if ($timer.status === TimerStatus.RUNNING && isInitialized) {
				if (!wakeLockState.wakeLockActive && wakeLockState.wakeLockSupported) {
					handleRequestWakeLock();
				}
				resumeAudioContext();
			} else if ($timer.status !== TimerStatus.RUNNING && wakeLockState.wakeLockActive) {
				handleReleaseWakeLock();
			}
		}
	});

	// Handle requesting wake lock
	async function handleRequestWakeLock() {
		wakeLockState = await requestWakeLock();
	}

	// Handle releasing wake lock
	async function handleReleaseWakeLock() {
		await releaseWakeLock(wakeLockState.wakeLock);
		wakeLockState = {
			...wakeLockState,
			wakeLock: null,
			wakeLockActive: false
		};
	}

	// Handle visibility change events
	async function handleVisibilityChange() {
		// Only run if in browser environment
		if (browser && document.visibilityState === 'visible') {
			// Reacquire wake lock if timer is running
			const $timer = $timerStore;
			if ($timer.status === TimerStatus.RUNNING && isInitialized && !wakeLockState.wakeLockActive) {
				await handleRequestWakeLock();
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

	// Initialize audio
	async function initializeAudio() {
		if (isInitialized || isLoading || !browser) return;

		isLoading = true;
		try {
			// First, try to resume the audio context
			await Tone.start();

			isInitialized = true;
			dispatch('initialized', { success: true });

			// If timer is already running, request wake lock
			const $timer = $timerStore;
			if ($timer.status === TimerStatus.RUNNING && wakeLockState.wakeLockSupported) {
				await handleRequestWakeLock();
			}
		} catch (error) {
			console.error('Failed to initialize audio:', error);
			dispatch('initialized', { success: false });
		} finally {
			isLoading = false;
		}
	}

	// Clean up on component destruction
	onDestroy(() => {
		handleReleaseWakeLock();
		unsubscribeTimer();
	});
</script>

<div class="flex flex-col gap-2">
	<!-- Audio status and control -->
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-2">
			{#if isInitialized}
				<span class="text-green-600 flex items-center gap-1">
					<CheckCircle class="h-5 w-5" />
					<span class="font-medium">Audio Enabled</span>
				</span>
			{:else}
				<span class="text-amber-500 flex items-center gap-1">
					<AlertTriangle class="h-5 w-5" />
					<span class="font-medium">Audio Disabled</span>
				</span>
			{/if}
		</div>

		{#if !isInitialized}
			<button
				type="button"
				class="px-3 py-1 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 {isLoading ? 'opacity-75' : ''} transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
				on:click={initializeAudio}
				disabled={isLoading}
				aria-label="Enable audio"
				tabindex="0"
				on:keydown={(e) => e.key === 'Enter' && initializeAudio()}
			>
				Enable
			</button>
		{/if}
	</div>

	<!-- Wake lock indicator -->
	{#if isInitialized && wakeLockState.wakeLockSupported}
		<div class="flex items-center gap-2 text-xs">
			<div
				class="w-2 h-2 rounded-full {isInitialized
					? wakeLockState.wakeLockActive
						? 'bg-green-500'
						: 'bg-amber-500'
					: 'bg-gray-300'}"
			/>
			{#if wakeLockState.wakeLockActive}
				<span>Screen Wake Lock Active</span>
			{:else}
				<span>Screen Wake Lock Ready</span>
			{/if}
		</div>
	{/if}

	{#if !isInitialized}
		<div class="text-xs text-base-content/70">
			Enable audio to activate mantra sounds and prevent your device from sleeping during
			meditation.
		</div>
	{/if}
</div>
