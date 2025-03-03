import { derived, writable, get, type Readable } from 'svelte/store';
import { timerStore, type TimerPhase } from './timerStore';
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
  isPlaying: boolean;
  volumeLevel: number;
  currentMantra: string;
  isMuted: boolean;
  currentPhase: string;
}

function createSoundStore() {
  // Private sound engine state
  let synth: Tone.Synth | null = null;
  let loop: Tone.Loop | null = null;
  let vol: Tone.Volume | null = null;
  let noteIndex = 0;
  const mantraChangeCallbacks: ((mantra: string) => void)[] = [];

  // Create the writable store
  const { subscribe, update, set } = writable<SoundState>({
    isInitialized: false,
    isPlaying: false,
    volumeLevel: 70,
    currentMantra: '',
    isMuted: true,
    currentPhase: ''
  });

  // Create a derived store that combines timer and sound state
  const combinedState: Readable<SoundState & {
    timerRunning: boolean;
    timerPhase: TimerPhase | null;
  }> = derived(
    [timerStore],
    ([$timerStore], set) => {
      subscribe(soundState => {
        set({
          ...soundState,
          timerRunning: $timerStore.isRunning,
          timerPhase: $timerStore.phases[$timerStore.currentPhaseIndex] || null,
          currentPhase: $timerStore.phases[$timerStore.currentPhaseIndex]?.action || ''
        });
      });
    }
  );

  // Helper to notify mantra change
  const notifyMantraChange = (mantra: string): void => {
    update(state => ({ ...state, currentMantra: mantra }));
    for (const callback of mantraChangeCallbacks) {
      callback(mantra);
    }
  };

  // Control the Tone.js transport based on timer state
  const updateTransportState = (timerRunning: boolean): void => {
    if (timerRunning) {
      // Start the transport if timer is running
      if (Tone.Transport.state !== 'started') {
        Tone.Transport.start();
      }
    } else {
      // Pause the transport if timer is not running
      if (Tone.Transport.state === 'started') {
        Tone.Transport.pause();
      }
    }
  };

  // Helper to safely set volume level with proper checks
  const safeSetVolume = (volumeLevel: number, phaseVolumeLevel?: number, isMuted: boolean = false): void => {
    if (!vol) return;

    try {
      if (isMuted) {
        // When muted, set volume to -Infinity (effectively 0)
        vol.volume.value = -Infinity;
        return;
      }

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

  // Subscribe to combined state changes to manage audio
  combinedState.subscribe(state => {
    if (!state.isInitialized) return;

    // First, control the transport based on timer state
    updateTransportState(state.timerRunning);

    // Control volume based on mute state and timer state
    const isEffectivelyMuted = state.isMuted || !state.timerRunning;

    // Adjust volume based on current phase and mute state
    if (state.timerPhase) {
      safeSetVolume(state.volumeLevel, state.timerPhase.volumeLevel, isEffectivelyMuted);
    } else {
      safeSetVolume(state.volumeLevel, undefined, isEffectivelyMuted);
    }
  });

  // Public store API
  return {
    subscribe,

    async initialize(): Promise<void> {
      if (get({ subscribe }).isInitialized) return;

      try {
        await Tone.start();
        const initialVolume = volumeToDecibels(get({ subscribe }).volumeLevel);
        vol = new Tone.Volume(initialVolume !== null ? initialVolume : -10).toDestination();
        synth = new Tone.Synth({
          oscillator: {
            type: 'sine'
          },
          envelope: {
            attack: 0.2,
            decay: 0.5,
            sustain: 0.8,
            release: 0.8
          }
        }).connect(vol);

        // Log initial state for debugging
        console.log('Initializing mantra sequence with notes:', mantraNotes);

        // Define note duration for consistency
        const noteDuration = '2n'; // half note

        // Create a loop that plays each mantra note in sequence
        loop = new Tone.Loop((time) => {
          if (synth) {
            // Always progress through mantras at a steady tempo when
            // the transport is running (controlled by timer state)
            const currentNote = mantraNotes[noteIndex];
            console.log(`Current mantra: ${currentNote.mantra}, pitch: ${currentNote.pitch}, index: ${noteIndex}`);

            // Only trigger sound if not muted
            if (!vol?.mute) {
              synth.triggerAttackRelease(currentNote.pitch, noteDuration, time);
            }

            // Always notify of mantra change regardless of mute state
            notifyMantraChange(currentNote.mantra);

            // Always move to the next note in the sequence
            noteIndex = (noteIndex + 1) % mantraNotes.length;
          }
        }, noteDuration); // Use the same duration for the loop interval

        // Start muted by default
        vol.mute = true;

        // Set BPM for the mantra chanting
        Tone.Transport.bpm.value = 60;

        // Initialize the loop but don't start the transport yet
        // Transport will be controlled by timer state
        loop.start(0);

        // Check if timer is already running and start transport if it is
        const timerState = get(timerStore);
        if (timerState.isRunning) {
          Tone.Transport.start();
        }

        update(state => ({ ...state, isInitialized: true }));
      } catch (error) {
        console.error('Failed to initialize audio:', error);
        throw error;
      }
    },

    setVolume(level: number): void {
      if (level < 0 || level > 100) return;

      update(state => {
        // Get current timer phase to scale volume appropriately
        const timerState = get(timerStore);
        const currentPhase = timerState.phases[timerState.currentPhaseIndex];
        const isEffectivelyMuted = state.isMuted || !timerState.isRunning;

        if (currentPhase) {
          safeSetVolume(level, currentPhase.volumeLevel, isEffectivelyMuted);
        } else {
          safeSetVolume(level, undefined, isEffectivelyMuted);
        }

        return { ...state, volumeLevel: level };
      });
    },

    toggleMute(): void {
      update(state => {
        const newMuted = !state.isMuted;
        const timerState = get(timerStore);
        const isEffectivelyMuted = newMuted || !timerState.isRunning;

        // Set volume based on mute state
        if (timerState.phases[timerState.currentPhaseIndex]) {
          safeSetVolume(
            state.volumeLevel,
            timerState.phases[timerState.currentPhaseIndex].volumeLevel,
            isEffectivelyMuted
          );
        } else {
          safeSetVolume(state.volumeLevel, undefined, isEffectivelyMuted);
        }

        return { ...state, isMuted: newMuted };
      });
    },

    onMantraChange(callback: (mantra: string) => void): void {
      mantraChangeCallbacks.push(callback);
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

    dispose(): void {
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
        isPlaying: false,
        volumeLevel: 70,
        currentMantra: '',
        isMuted: true,
        currentPhase: ''
      });
    }
  };
}

export const soundStore = createSoundStore();
