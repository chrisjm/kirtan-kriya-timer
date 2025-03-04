import { writable, get } from 'svelte/store';
import { timerStore } from './timerStore';
import { getSoundSettings, setSoundSettings } from '../services/storageService';
import * as Tone from 'tone';

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

// Convert volume percentage to decibels for Tone.js
const volumeToDecibels = (value: number, r1 = [0, 100], r2 = [-48, 0]): number => {
  return Math.floor(((value - r1[0]) * (r2[1] - r2[0])) / (r1[1] - r1[0]) + r2[0]);
};

export interface SoundState {
  isInitialized: boolean;
  volumeLevel: number;
  currentMantra: string;
  isMuted: boolean;
  isTimerRunning: boolean;
  currentPhaseVolumeLevel?: number;
}

function createSoundStore() {
  // Private sound engine state
  let synth: Tone.Synth | null = null;
  let loop: Tone.Loop | null = null;
  let vol: Tone.Volume | null = null;
  let noteIndex = 0;

  // Load initial sound settings from storage
  const settings = getSoundSettings();

  // Create the writable store with initial state
  const { subscribe, update } = writable<SoundState>({
    isInitialized: false,
    volumeLevel: settings.volume,
    currentMantra: '',
    isMuted: settings.isMuted,
    isTimerRunning: false
  });

  // Helper to notify mantra change
  const notifyMantraChange = (mantra: string): void => {
    update(state => ({ ...state, currentMantra: mantra }));
  };

  // Helper to safely set volume level with proper checks
  const safeSetVolume = (volumeLevel: number, phaseVolumeLevel?: number): void => {
    if (!vol) return;

    try {
      // If we have a phase volume, scale by it
      let scaledVolume = volumeLevel;
      if (phaseVolumeLevel !== undefined) {
        scaledVolume = (volumeLevel * phaseVolumeLevel) / 100;
      }

      // Ensure we have a valid number before setting
      const dbValue = volumeToDecibels(scaledVolume);
      if (dbValue !== null && !isNaN(dbValue)) {
        vol.volume.value = dbValue;
      }
    } catch (error) {
      console.error('Error setting volume:', error);
    }
  };

  // Helper to update sound playback based on current state
  const updateSoundPlayback = () => {
    const state = get({ subscribe });
    if (!state.isInitialized || !vol) return;

    // Control transport based on timer state
    if (state.isTimerRunning) {
      if (Tone.Transport.state !== 'started') {
        Tone.Transport.start();
      }
    } else {
      if (Tone.Transport.state === 'started') {
        Tone.Transport.pause();
      }
    }

    // Handle volume and muting
    if (state.isMuted || !state.isTimerRunning) {
      vol.volume.value = -Infinity; // Effectively mute
    } else if (state.currentPhaseVolumeLevel !== undefined) {
      safeSetVolume(state.volumeLevel, state.currentPhaseVolumeLevel);
    } else {
      safeSetVolume(state.volumeLevel);
    }
  };

  // Subscribe to timer store changes
  const unsubscribeTimer = timerStore.subscribe(($timer) => {
    update(state => {
      const newState = {
        ...state,
        isTimerRunning: $timer.isRunning,
        currentPhaseVolumeLevel: $timer.phases[$timer.currentPhaseIndex].volumeLevel
      };
      if (typeof updateSoundPlayback === 'function') {
        updateSoundPlayback();
      }
      return newState;
    });
  });

  // Public store API
  return {
    subscribe,

    async initialize(): Promise<void> {
      if (get({ subscribe }).isInitialized) return;

      try {
        await Tone.start();

        // Initialize volume control
        const initialVolume = volumeToDecibels(get({ subscribe }).volumeLevel);
        vol = new Tone.Volume(initialVolume !== null ? initialVolume : -10).toDestination();

        // Initialize synthesizer
        synth = new Tone.Synth({
          oscillator: { type: 'sine' },
          envelope: {
            attack: 0.2,
            decay: 0.5,
            sustain: 0.8,
            release: 0.8
          }
        }).connect(vol);

        // Define note duration for consistency
        const noteDuration = '2n'; // half note

        // Create a loop that plays each mantra note in sequence
        loop = new Tone.Loop((time) => {
          if (synth && vol) {
            const currentNote = mantraNotes[noteIndex];

            // Only trigger sound if volume is not at -Infinity (effectively muted)
            if (vol.volume.value > -Infinity) {
              synth.triggerAttackRelease(currentNote.pitch, noteDuration, time);
            }

            // Always update the current mantra in the store
            notifyMantraChange(currentNote.mantra);

            // Always move to the next note in the sequence
            noteIndex = (noteIndex + 1) % mantraNotes.length;
          }
        }, noteDuration);

        // Set BPM for the mantra chanting
        Tone.Transport.bpm.value = 60;

        // Start the loop (but transport won't start until timer runs)
        loop.start(0);

        // Set initial mute state
        vol.volume.value = -Infinity;

        // Set initial state
        update(state => ({ ...state, isInitialized: true }));
        updateSoundPlayback();

      } catch (error) {
        console.error('Failed to initialize audio:', error);
        throw error;
      }
    },

    setVolume(level: number): void {
      setSoundSettings({ volume: level });
      update(state => {
        const newState = { ...state, volumeLevel: level };
        updateSoundPlayback();
        return newState;
      });
    },

    toggleMute(): void {
      update(state => {
        const isMuted = !state.isMuted;
        setSoundSettings({ isMuted });
        updateSoundPlayback();
        return { ...state, isMuted };
      });
    },

    cleanup(): void {
      // Cleanup timer subscription
      unsubscribeTimer();

      // Stop and cleanup Tone.js resources
      if (loop) {
        loop.stop();
        loop.dispose();
        loop = null;
      }

      if (synth) {
        synth.dispose();
        synth = null;
      }

      if (vol) {
        vol.dispose();
        vol = null;
      }

      // Reset store state
      update(state => ({
        ...state,
        isInitialized: false,
        currentMantra: '',
        isTimerRunning: false
      }));
    }
  };
}

export const soundStore = createSoundStore();
