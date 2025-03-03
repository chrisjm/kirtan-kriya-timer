import { derived, writable, type Readable } from 'svelte/store';
import { timerStore } from './timerStore';
import { soundManager } from '../utils/soundUtils';

export interface SoundState {
  isInitialized: boolean;
  isPlaying: boolean;
  volumeLevel: number;
  currentMantra: string;
  isMuted: boolean;
}

function createSoundStore() {
  const { subscribe, update, set } = writable<SoundState>({
    isInitialized: false,
    isPlaying: false,
    volumeLevel: 70,
    currentMantra: '',
    isMuted: true
  });

  // Subscribe to mantra changes from the sound manager
  soundManager.onMantraChange((mantra: string) => {
    update(state => ({ ...state, currentMantra: mantra }));
  });

  // Create a derived store that combines timer and sound state
  const combinedState: Readable<SoundState & { shouldPlay: boolean }> = derived(
    [timerStore],
    ([$timerStore], set) => {
      subscribe(soundState => {
        set({
          ...soundState,
          shouldPlay: $timerStore.isRunning && !soundState.isMuted
        });
      });
    }
  );

  // Subscribe to combined state changes to manage audio
  combinedState.subscribe(state => {
    if (state.shouldPlay && state.isInitialized) {
      soundManager.resume();
    } else {
      soundManager.pause();
    }
  });

  return {
    subscribe,

    async initialize(): Promise<void> {
      try {
        await soundManager.initialize();
        update(state => ({ ...state, isInitialized: true }));
      } catch (error) {
        console.error('Failed to initialize sound store:', error);
        throw error;
      }
    },

    setVolume(level: number): void {
      if (level < 0 || level > 100) return;
      soundManager.volumeLevel = level;
      update(state => ({ ...state, volumeLevel: level }));
    },

    toggleMute(): void {
      update(state => {
        const newMuted = !state.isMuted;
        if (newMuted) {
          soundManager.stop();
        } else {
          let isRunning = false;
          const unsubscribe = timerStore.subscribe(state => {
            isRunning = state.isRunning;
          });
          unsubscribe();
          
          if (isRunning) {
            soundManager.resume();
          }
        }
        return { ...state, isMuted: newMuted };
      });
    },

    playNotification(): void {
      soundManager.playNotification();
    },

    dispose(): void {
      soundManager.dispose();
      set({
        isInitialized: false,
        isPlaying: false,
        volumeLevel: 70,
        currentMantra: '',
        isMuted: true
      });
    }
  };
}

export const soundStore = createSoundStore();
