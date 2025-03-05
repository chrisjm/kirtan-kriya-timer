import { writable, get } from 'svelte/store';
import { timerStore } from './timerStore';
import { getSoundSettings, setSoundSettings } from '../services/storageService';
import * as Tone from 'tone';
import { TimerStatus } from './timer/types';
import { volumeToDecibels, type AudioEngine } from '$lib/services/audioService';

// Debug logging utility
const DEBUG = true;
const log = {
  state: (...args: unknown[]) => DEBUG && console.log('[SoundStore State]', ...args),
  error: (...args: unknown[]) => console.error('[SoundStore Error]', ...args)
};

// The four syllables of the Kirtan Kriya mantra with corresponding notes
export interface MantraNote {
  pitch: string;
  mantra: string;
}

export const mantraNotes: MantraNote[] = [
  { pitch: 'E3', mantra: 'Sa' },
  { pitch: 'D3', mantra: 'Ta' },
  { pitch: 'C3', mantra: 'Na' },
  { pitch: 'D3', mantra: 'Ma' }
];

export interface SoundState {
  isInitialized: boolean;
  volumeLevel: number;
  currentMantra?: MantraNote;
  isMuted: boolean;
  isTimerRunning: boolean;
  currentPhaseVolumeLevel?: number;
}

function createSoundStore() {
  // Load initial sound settings from storage
  const settings = getSoundSettings();
  let audioEngine: AudioEngine | null = null;
  let isStarted = false;

  // Create the writable store with initial state
  const { subscribe, update } = writable<SoundState>({
    isInitialized: false,
    volumeLevel: settings.volume,
    currentMantra: undefined,
    isMuted: settings.isMuted,
    isTimerRunning: false
  });

  // Helper to update sound playback based on current state
  const updateSoundPlayback = async () => {
    const state = get({ subscribe });
    if (!state.isInitialized || !audioEngine) return;

    try {
      // Control transport based on timer state
      if (state.isTimerRunning) {
        if (!isStarted) {
          log.state('Starting audio context...');
          await Tone.start();
          isStarted = true;
          log.state('Audio context started successfully');
        }

        if (Tone.Transport.state !== 'started') {
          log.state('Starting transport, current state:', Tone.Transport.state);
          Tone.Transport.start();
          audioEngine.loop.start();
          log.state('Transport started, new state:', Tone.Transport.state);
        }
      } else {
        if (Tone.Transport.state === 'started') {
          log.state('Pausing transport, current state:', Tone.Transport.state);
          Tone.Transport.pause();
          audioEngine.loop.stop();
          log.state('Transport paused, new state:', Tone.Transport.state);
        }
      }

      // Handle volume and muting
      if (state.isMuted || !state.isTimerRunning) {
        audioEngine.vol.volume.value = -Infinity; // Effectively mute
      } else if (state.currentPhaseVolumeLevel !== undefined) {
        // Scale the volume based on both master volume and phase volume
        const scaledVolume = (state.volumeLevel * state.currentPhaseVolumeLevel) / 100;
        audioEngine.vol.volume.value = volumeToDecibels(scaledVolume);
      } else {
        audioEngine.vol.volume.value = volumeToDecibels(state.volumeLevel);
      }
    } catch (error) {
      log.error('Error updating sound playback:', error);
    }
  };

  // Subscribe to timer store changes
  const unsubscribeTimer = timerStore.subscribe(($timer) => {
    update(state => {
      const newState = {
        ...state,
        isTimerRunning: $timer.status === TimerStatus.RUNNING,
        currentPhaseVolumeLevel: $timer.phases[$timer.currentPhaseIndex].volumeLevel
      };
      return newState;
    });
    // Ensure sound playback is updated when timer state changes
    updateSoundPlayback();
  });

  const setAudioEngine = function (engine: AudioEngine): void {
    audioEngine = engine;
    update(state => ({ ...state, isInitialized: true }));
    updateSoundPlayback();
  }

  const updateCurrentMantra = function (index: number): void {
    update(state => ({ ...state, currentMantra: mantraNotes[index] }));
  }

  const setVolume = function (level: number): void {
    update(state => {
      const newState = { ...state, volumeLevel: level };
      setSoundSettings({ volume: level, isMuted: state.isMuted });
      return newState;
    });
    updateSoundPlayback();
  }

  const toggleMute = function (): void {
    update(state => {
      const newState = { ...state, isMuted: !state.isMuted };
      setSoundSettings({ volume: state.volumeLevel, isMuted: newState.isMuted });
      return newState;
    });
    updateSoundPlayback();
  }

  const cleanup = function (): void {
    unsubscribeTimer();
    audioEngine = null;
    isStarted = false;

    // Reset store state
    update(state => ({
      ...state,
      isInitialized: false,
      currentMantra: undefined,
      isTimerRunning: false
    }));
  }

  return {
    subscribe,
    setAudioEngine,
    setVolume,
    toggleMute,
    cleanup,
    updateCurrentMantra,
  };
}

export const soundStore = createSoundStore();
