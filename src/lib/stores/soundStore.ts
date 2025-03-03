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
  let mantraSequenceStarted = false;
  const mantraChangeCallbacks: ((mantra: string) => void)[] = [];
  
  // Helper to reset the mantra sequence
  const resetMantraSequence = (): void => {
    noteIndex = 0;
    mantraSequenceStarted = false;
    if (loop) {
      loop.stop();
      loop.start(0);
    }
  };

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
    shouldPlay: boolean;
    timerPhase: TimerPhase | null;
  }> = derived(
    [timerStore],
    ([$timerStore], set) => {
      subscribe(soundState => {
        set({
          ...soundState,
          shouldPlay: $timerStore.isRunning && !soundState.isMuted,
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

  // Private audio control methods
  const pauseAudio = (): void => {
    if (!vol) return;
    vol.mute = true;
    Tone.Transport.pause();
  };

  const resumeAudio = (): void => {
    if (!vol) return;
    Tone.Transport.start();
    vol.mute = false;

    // Trigger immediate note if not already playing
    if (synth && Tone.Transport.state !== 'started') {
      const currentNote = mantraNotes[noteIndex];
      console.log(`Resuming with mantra: ${currentNote.mantra}, pitch: ${currentNote.pitch}, index: ${noteIndex}`);
      synth.triggerAttackRelease(currentNote.pitch, '2n'); // Use consistent half note duration
      notifyMantraChange(currentNote.mantra);
      noteIndex = (noteIndex + 1) % mantraNotes.length;
    }
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

  // Subscribe to combined state changes to manage audio
  combinedState.subscribe(state => {
    if (state.shouldPlay && state.isInitialized) {
      resumeAudio();

      // Adjust volume based on current phase if available
      if (state.timerPhase) {
        safeSetVolume(state.volumeLevel, state.timerPhase.volumeLevel);
      }
    } else {
      pauseAudio();
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
            // Get the current mantra note
            const currentNote = mantraNotes[noteIndex];
            console.log(`Playing mantra: ${currentNote.mantra}, pitch: ${currentNote.pitch}, index: ${noteIndex}`);
            
            // Play the note with consistent duration
            synth.triggerAttackRelease(currentNote.pitch, noteDuration, time);
            notifyMantraChange(currentNote.mantra);
            
            // Move to the next note in the sequence
            noteIndex = (noteIndex + 1) % mantraNotes.length;
          }
        }, noteDuration); // Use the same duration for the loop interval

        // Start muted by default
        vol.mute = true;

        // Set BPM for the mantra chanting - slightly faster to ensure all mantras are heard
        Tone.Transport.bpm.value = 60;

        // Start the loop and transport immediately
        loop.start(0);
        Tone.Transport.start();

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
        
        if (currentPhase) {
          safeSetVolume(level, currentPhase.volumeLevel);
        } else {
          safeSetVolume(level);
        }

        return { ...state, volumeLevel: level };
      });
    },

    toggleMute(): void {
      update(state => {
        const newMuted = !state.isMuted;
        if (newMuted) {
          pauseAudio();
        } else {
          // When unmuting, reset the mantra sequence to start from the beginning
          resetMantraSequence();
          
          const timerState = get(timerStore);
          if (timerState.isRunning) {
            resumeAudio();
          }
        }
        return { ...state, isMuted: newMuted };
      });
    },

    onMantraChange(callback: (mantra: string) => void): void {
      mantraChangeCallbacks.push(callback);
    },

    playNotification(): void {
      if (!get({ subscribe }).isInitialized) return;

      try {
        const notifySynth = new Tone.Synth().toDestination();
        const volumeDb = volumeToDecibels(get({ subscribe }).volumeLevel);
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
      mantraSequenceStarted = false;

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
