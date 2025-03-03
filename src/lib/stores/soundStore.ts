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
    if (!state.isInitialized) return;
    
    // First, control the transport based on timer state
    updateTransportState(state.timerRunning);
    
    // Then control mute state based on sound settings
    if (vol) {
      vol.mute = state.isMuted || !state.timerRunning;
    }
    
    // Adjust volume based on current phase if available
    if (state.timerPhase) {
      safeSetVolume(state.volumeLevel, state.timerPhase.volumeLevel);
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
        
        if (vol) {
          // Simply control the volume mute state
          vol.mute = newMuted || !get(timerStore).isRunning;
        }
        
        // Only reset mantra sequence when unmuting if user explicitly requests it
        // This preserves the continuous flow of mantras even when sound is muted
        
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
