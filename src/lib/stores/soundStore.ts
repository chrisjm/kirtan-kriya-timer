import { writable, get } from 'svelte/store';
import { TimerStatus, timerStore } from './timerStore';
import { getSoundSettings, setSoundSettings } from '../services/storageService';
import * as Tone from 'tone';

// Debug logging utility
const DEBUG = true;
const log = {
  init: (...args: unknown[]) => DEBUG && console.log('[SoundStore Init]', ...args),
  tone: (...args: unknown[]) => DEBUG && console.log('[Tone Timing]', ...args),
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
  let isStarted = false;

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
  const updateSoundPlayback = async () => {
    const state = get({ subscribe });
    if (!state.isInitialized || !vol) return;

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
          log.state('Transport started, new state:', Tone.Transport.state);
        }
      } else {
        if (Tone.Transport.state === 'started') {
          log.state('Pausing transport, current state:', Tone.Transport.state);
          Tone.Transport.pause();
          log.state('Transport paused, new state:', Tone.Transport.state);
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
      // Call updateSoundPlayback asynchronously to handle audio context start
      if (typeof updateSoundPlayback === 'function') {
        void updateSoundPlayback().catch(error => {
          log.error('Error in timer subscription:', error);
        });
      }
      return newState;
    });
  });

  // Public store API
  return {
    subscribe,

    async initialize(): Promise<void> {
      // Only initialize once
      const state = get({ subscribe });
      if (state.isInitialized || synth || vol || loop) {
        log.init('Sound system already initialized');
        return;
      }

      try {
        log.init('Starting Tone.js initialization');
        log.init('Tone.js context state:', Tone.context.state);

        // Initialize volume control
        const initialVolume = volumeToDecibels(state.volumeLevel);
        vol = new Tone.Volume(initialVolume !== null ? initialVolume : -10).toDestination();

        // Initialize synthesizer
        synth = new Tone.Synth({
          oscillator: { type: 'sine' },
          envelope: {
            attack: 0.1,
            decay: 0.2,
            sustain: 0.6,
            release: 0.5
          }
        }).connect(vol);

        // Define note duration for consistency
        const noteDuration = '2n';

        // Create a loop that plays each mantra note in sequence with proper timing
        loop = new Tone.Loop((time) => {
          if (!synth || !vol || !isStarted) return;

          const currentNote = mantraNotes[noteIndex];

          // Debug timing information
          log.tone({
            loop: {
              time,
              transportTime: Tone.Transport.seconds,
              bpm: Tone.Transport.bpm.value,
              state: Tone.Transport.state,
              nextNote: currentNote.mantra
            }
          });

          // Only trigger sound if not muted
          if (vol.volume.value > -Infinity) {
            log.tone(`Scheduling note ${currentNote.mantra} at ${time}`);
            synth.triggerAttackRelease(currentNote.pitch, noteDuration, time);
          }

          notifyMantraChange(currentNote.mantra);
          noteIndex = (noteIndex + 1) % mantraNotes.length;
        }, noteDuration);

        // Set BPM and start loop
        Tone.Transport.bpm.value = 60;
        loop.start(0);

        // Set initial mute state
        vol.volume.value = -Infinity;

        // Mark as initialized but not started
        update(state => ({ ...state, isInitialized: true }));
        log.init('Sound system initialized successfully');

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
