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

// Default mantra notes if not provided from settings
const defaultPitches = ['E3', 'D3', 'C3', 'D3'];

// The mantra syllables
const mantraSyllables = ['Saa', 'Taa', 'Naa', 'Maa'];

// Helper function to update mantra notes with new pitches
function updateMantraNotes(pitches: string[]): void {
  mantraNotes = mantraSyllables.map((mantra, index) => ({
    pitch: pitches[index],
    mantra
  }));
}

// Create mantra notes array - will be updated with current pitches
export let mantraNotes: MantraNote[] = mantraSyllables.map((mantra, index) => ({
  pitch: defaultPitches[index],
  mantra
}));

export interface SoundState {
  isInitialized: boolean;
  volumeLevel: number;
  currentMantra?: MantraNote;
  isMuted: boolean;
  isTimerRunning: boolean;
  currentPhaseVolumeLevel?: number;
  mantraPace: number; // BPM value that controls mantra playback speed
  mantraPitches: string[]; // Pitch values for each mantra syllable
}

function createSoundStore() {
  // Load initial sound settings from storage
  // Only access browser APIs if in browser environment
  const settings = browser ? getSoundSettings() : {
    volume: 50,
    isMuted: false,
    mantraPace: 60,
    mantraPitches: defaultPitches
  };
  let audioEngine: AudioEngine | null = null;
  let isStarted = false;

  // Update mantraNotes with settings from storage
  if (settings.mantraPitches) {
    updateMantraNotes(settings.mantraPitches);
  }

  // Create the writable store with initial state
  const { subscribe, update } = writable<SoundState>({
    isInitialized: false,
    volumeLevel: settings.volume,
    currentMantra: undefined,
    isMuted: settings.isMuted,
    isTimerRunning: false,
    mantraPace: settings.mantraPace,
    mantraPitches: settings.mantraPitches
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

  // Update the mantra notes array with new pitches
  const setPitches = function (pitches: string[]): void {
    if (pitches.length !== mantraSyllables.length) {
      console.error('Invalid pitch array length. Expected', mantraSyllables.length, 'got', pitches.length);
      return;
    }

    // Update the global mantraNotes array
    updateMantraNotes(pitches);

    // Update the store state
    update(state => {
      const newState = { ...state, mantraPitches: pitches };
      // Only save settings if in browser environment
      if (browser) {
        setSoundSettings({
          volume: state.volumeLevel,
          isMuted: state.isMuted,
          mantraPace: state.mantraPace,
          mantraPitches: pitches
        });
      }
      return newState;
    });

    // If audio engine is initialized, update it
    if (audioEngine && browser) {
      // Use the updatePitches method instead of recreating the engine
      audioEngine.updatePitches(mantraNotes);
    }
  };

  return {
    subscribe,
    setAudioEngine,
    setVolume,
    toggleMute,
    setPace,
    setPitches,
    cleanup,
    updateCurrentMantra,
  };
}

export const soundStore = createSoundStore();
