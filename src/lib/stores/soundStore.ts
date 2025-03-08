import { writable, get } from 'svelte/store';
import { timerStore } from './timerStore';
import { getSoundSettings, setSoundSettings } from '../services/storageService';
import * as Tone from 'tone';
import { TimerStatus } from './timer/types';
import { volumeToDecibels, type AudioEngine } from '$lib/services/audioService';
import { browser } from '$app/environment';

// The four syllables of the Kirtan Kriya mantra with corresponding notes
export interface MantraNote {
  pitch: string;
  mantra: string;
}

export const mantraNotes: MantraNote[] = [
  { pitch: 'E3', mantra: 'Saa' },
  { pitch: 'D3', mantra: 'Taa' },
  { pitch: 'C3', mantra: 'Naa' },
  { pitch: 'D3', mantra: 'Maa' }
];

export interface SoundState {
  isInitialized: boolean;
  volumeLevel: number;
  currentMantra?: MantraNote;
  isMuted: boolean;
  isTimerRunning: boolean;
  currentPhaseVolumeLevel?: number;
  mantraPace: number; // BPM value that controls mantra playback speed
}

function createSoundStore() {
  // Load initial sound settings from storage
  // Only access browser APIs if in browser environment
  const settings = browser ? getSoundSettings() : { volume: 50, isMuted: false, mantraPace: 60 };
  let audioEngine: AudioEngine | null = null;
  let isStarted = false;

  // Create the writable store with initial state
  const { subscribe, update } = writable<SoundState>({
    isInitialized: false,
    volumeLevel: settings.volume,
    currentMantra: undefined,
    isMuted: settings.isMuted,
    isTimerRunning: false,
    mantraPace: settings.mantraPace
  });

  // Helper to update sound playback based on current state
  const updateSoundPlayback = async () => {
    // Skip if not in browser environment
    if (!browser) return;
    
    const state = get({ subscribe });
    if (!state.isInitialized || !audioEngine) return;

    try {
      // Control transport based on timer state
      if (state.isTimerRunning) {
        if (!isStarted) {
          await Tone.start();
          isStarted = true;
        }

        if (Tone.getTransport().state !== 'started') {
          Tone.getTransport().start();
          audioEngine.loop.start();
        }
      } else {
        if (Tone.getTransport().state === 'started') {
          Tone.getTransport().pause();
          audioEngine.loop.stop();
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
      console.error('Error updating sound playback:', error);
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
  
  const setPace = function (pace: number): void {
    update(state => {
      const newState = { ...state, mantraPace: pace };
      // Only save settings if in browser environment
      if (browser) {
        setSoundSettings({ volume: state.volumeLevel, isMuted: state.isMuted, mantraPace: pace });
      }
      return newState;
    });
    
    // Update the BPM in the audio engine if it exists
    if (audioEngine && browser) {
      Tone.getTransport().bpm.value = pace;
    }
  }

  const updateCurrentMantra = function (index: number): void {
    update(state => ({ ...state, currentMantra: mantraNotes[index] }));
  }

  const setVolume = function (level: number): void {
    update(state => {
      const newState = { ...state, volumeLevel: level };
      // Only save settings if in browser environment
      if (browser) {
        setSoundSettings({ volume: level, isMuted: state.isMuted });
      }
      return newState;
    });
    updateSoundPlayback();
  }

  const toggleMute = function (): void {
    update(state => {
      const newState = { ...state, isMuted: !state.isMuted };
      // Only save settings if in browser environment
      if (browser) {
        setSoundSettings({ volume: state.volumeLevel, isMuted: newState.isMuted });
      }
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
    setPace,
    cleanup,
    updateCurrentMantra,
  };
}

export const soundStore = createSoundStore();
