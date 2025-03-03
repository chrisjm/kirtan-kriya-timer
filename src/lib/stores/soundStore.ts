import { writable, get, derived } from 'svelte/store';
import { timerStore } from './timerStore';
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
}

function createSoundStore() {
  // Private sound engine state
  let synth: Tone.Synth | null = null;
  let loop: Tone.Loop | null = null;
  let vol: Tone.Volume | null = null;
  let noteIndex = 0;

  // Create the writable store with initial state
  const { subscribe, update, set } = writable<SoundState>({
    isInitialized: false,
    volumeLevel: 70,
    currentMantra: '',
    isMuted: true
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

  // Create a derived store to handle sound playback based on timer state
  const soundPlaybackState = derived(
    [timerStore, { subscribe }],
    ([$timerStore, $soundStore]) => {
      return {
        timerRunning: $timerStore.isRunning,
        currentPhase: $timerStore.phases[$timerStore.currentPhaseIndex] || null,
        isMuted: $soundStore.isMuted,
        volumeLevel: $soundStore.volumeLevel,
        isInitialized: $soundStore.isInitialized
      };
    }
  );

  // Subscribe to the derived state to control sound playback
  soundPlaybackState.subscribe(state => {
    if (!state.isInitialized || !vol) return;

    // Control transport based on timer state
    if (state.timerRunning) {
      if (Tone.Transport.state !== 'started') {
        Tone.Transport.start();
      }
    } else {
      if (Tone.Transport.state === 'started') {
        Tone.Transport.pause();
      }
    }

    // Handle volume and muting
    if (state.isMuted || !state.timerRunning) {
      vol.volume.value = -Infinity; // Effectively mute
    } else if (state.currentPhase) {
      safeSetVolume(state.volumeLevel, state.currentPhase.volumeLevel);
    } else {
      safeSetVolume(state.volumeLevel);
    }
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

        // Set initial mute state (volume will be controlled by the derived store)
        vol.volume.value = -Infinity;

        update(state => ({ ...state, isInitialized: true }));
      } catch (error) {
        console.error('Failed to initialize audio:', error);
        throw error;
      }
    },

    setVolume(level: number): void {
      if (level < 0 || level > 100) return;
      update(state => ({ ...state, volumeLevel: level }));
    },

    toggleMute(): void {
      update(state => ({ ...state, isMuted: !state.isMuted }));
    },

    playNotification(): void {
      const state = get({ subscribe });
      if (!state.isInitialized || state.isMuted) return;

      try {
        const notifySynth = new Tone.Synth().toDestination();
        const timerState = get(timerStore);
        const currentPhase = timerState.phases[timerState.currentPhaseIndex];

        // Scale volume by phase if available
        let volumeLevel = state.volumeLevel;
        if (currentPhase) {
          volumeLevel = (volumeLevel * currentPhase.volumeLevel) / 100;
        }

        const volumeDb = volumeToDecibels(volumeLevel);
        if (volumeDb !== null && !isNaN(volumeDb)) {
          notifySynth.volume.value = volumeDb;
        }

        // Play a simple notification melody
        const now = Tone.now();
        notifySynth.triggerAttackRelease('G4', '8n', now);
        notifySynth.triggerAttackRelease('C5', '8n', now + 0.25);
        notifySynth.triggerAttackRelease('E5', '4n', now + 0.5);
      } catch (error) {
        console.error('Error playing notification:', error);
      }
    },

    cleanup(): void {
      if (loop) {
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

      noteIndex = 0;

      set({
        isInitialized: false,
        volumeLevel: 70,
        currentMantra: '',
        isMuted: true
      });
    }
  };
}

export const soundStore = createSoundStore();
