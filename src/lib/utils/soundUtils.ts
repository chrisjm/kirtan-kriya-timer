// NOTE: not used, but keep for prosperity until functionality is complete

import * as Tone from 'tone';

export interface MantraNote {
  pitch: string;
  mantra: string;
}

// The four syllables of the Kirtan Kriya mantra with corresponding notes
export const mantraNotes: MantraNote[] = [
  { pitch: 'E3', mantra: 'Sa' },
  { pitch: 'D3', mantra: 'Ta' },
  { pitch: 'C3', mantra: 'Na' },
  { pitch: 'D3', mantra: 'Ma' }
];

// Convert volume percentage to decibels for Tone.js
export const volumeToDecibels = (value: number, r1 = [0, 100], r2 = [-48, 0]): number => {
  return Math.floor(((value - r1[0]) * (r2[1] - r2[0])) / (r1[1] - r1[0]) + r2[0]);
};

// Class to manage all sound-related functionality
export class SoundManager {
  private synth: Tone.Synth | Tone.PolySynth | null = null;
  private loop: Tone.Loop | null = null;
  private vol: Tone.Volume | null = null;
  private noteIndex = 0;
  private _isInitialized = false;
  private _currentMantra = '';
  private _volumeLevel = 70;
  private mantraChangeCallbacks: ((mantra: string) => void)[] = [];

  get isInitialized(): boolean {
    return this._isInitialized;
  }

  get currentMantra(): string {
    return this._currentMantra;
  }

  onMantraChange(callback: (mantra: string) => void): void {
    this.mantraChangeCallbacks.push(callback);
  }

  private notifyMantraChange(): void {
    for (const callback of this.mantraChangeCallbacks) {
      callback(this._currentMantra);
    }
  }

  set volumeLevel(value: number) {
    this._volumeLevel = value;
    if (this.vol) {
      this.vol.volume.value = volumeToDecibels(value);
    }
  }

  get volumeLevel(): number {
    return this._volumeLevel;
  }

  // Must be called from a user interaction due to browser autoplay policies
  async initialize(): Promise<void> {
    if (this._isInitialized) return;

    try {
      await Tone.start();
      this.vol = new Tone.Volume(volumeToDecibels(this._volumeLevel)).toDestination();
      this.synth = new Tone.Synth({
        oscillator: {
          type: 'sine'
        },
        envelope: {
          attack: 0.2,
          decay: 0.5,
          sustain: 0.8,
          release: 0.8
        }
      }).connect(this.vol);

      this.loop = new Tone.Loop((time) => {
        if (this.synth) {
          this.synth.triggerAttackRelease(mantraNotes[this.noteIndex].pitch, '2n', time);
          this._currentMantra = mantraNotes[this.noteIndex].mantra;
          this.notifyMantraChange();
          this.noteIndex = (this.noteIndex + 1) % mantraNotes.length;
        }
      }, '2n');

      // Start muted by default
      this.vol.mute = true;
      this._isInitialized = true;

      // Set BPM for the mantra chanting
      Tone.Transport.bpm.value = 50;

      // Start the loop and transport immediately
      this.loop.start(0);
      Tone.Transport.start();
    } catch (error) {
      console.error('Failed to initialize audio:', error);
      throw error;
    }
  }

  start(): void {
    if (!this._isInitialized) {
      console.warn('Sound not initialized. Call initialize() first.');
      return;
    }

    if (this.vol) {
      this.vol.mute = false;
    }
    Tone.Transport.start();
  }

  stop(): void {
    if (this.vol) {
      this.vol.mute = true;
    }
  }

  pause(): void {
    if (!this._isInitialized) return;

    if (this.vol) {
      this.vol.mute = true;
    }
    Tone.Transport.pause();
  }

  resume(): void {
    if (!this._isInitialized) return;

    // Ensure transport is running and unmute
    Tone.Transport.start();
    if (this.vol) {
      this.vol.mute = false;
    }

    // Trigger immediate note if not already playing
    if (this.synth && !Tone.Transport.state) {
      this.synth.triggerAttackRelease(mantraNotes[this.noteIndex].pitch, '2n');
      this._currentMantra = mantraNotes[this.noteIndex].mantra;
      this.notifyMantraChange();
      this.noteIndex = (this.noteIndex + 1) % mantraNotes.length;
    }
  }

  // Play a notification sound between phases
  async playNotification(): Promise<void> {
    if (!this._isInitialized) return;

    const notifySynth = new Tone.Synth().toDestination();
    notifySynth.volume.value = volumeToDecibels(this._volumeLevel);

    // Play a simple notification melody
    const now = Tone.now();
    notifySynth.triggerAttackRelease('G4', '8n', now);
    notifySynth.triggerAttackRelease('C5', '8n', now + 0.25);
    notifySynth.triggerAttackRelease('E5', '4n', now + 0.5);
  }

  // Clean up resources
  dispose(): void {
    if (this.loop) {
      this.loop.dispose();
      this.loop = null;
    }

    if (this.synth) {
      this.synth.dispose();
      this.synth = null;
    }

    if (this.vol) {
      this.vol.dispose();
      this.vol = null;
    }

    this._isInitialized = false;
    this.noteIndex = 0;
    this.mantraChangeCallbacks = [];
  }
}

// Create a singleton instance
export const soundManager = new SoundManager();
