import * as Tone from 'tone';
import type { MantraNote } from '$lib/stores/soundStore';

export interface AudioEngine {
  synth: Tone.Synth;
  vol: Tone.Volume;
  loop: Tone.Loop;
}

// Convert volume percentage to decibels for Tone.js
export const volumeToDecibels = (value: number): number => {
  const minDb = -48;
  const maxDb = 0;
  return Math.floor(((value / 100) * (maxDb - minDb)) + minDb);
};

export const createAudioEngine = async (
  initialVolume: number,
  mantraNotes: MantraNote[],
  onMantraChange: (index: number) => void
): Promise<AudioEngine> => {
  // Start with a clean audio context
  await Tone.start();
  // Initialize volume control
  const vol = new Tone.Volume(initialVolume !== null ? volumeToDecibels(initialVolume) : -10).toDestination();

  // Initialize synthesizer
  const synth = new Tone.Synth({
    oscillator: { type: 'sine' },
    envelope: {
      attack: 0.1,
      decay: 0.2,
      sustain: 0.6,
      release: 0.5
    }
  }).connect(vol);

  let noteIndex = 0;
  const noteDuration = '2n';

  // Create a loop that plays each mantra note in sequence
  const loop = new Tone.Loop((time) => {
    const currentNote = mantraNotes[noteIndex];
    synth.triggerAttackRelease(currentNote.pitch, noteDuration, time);
    onMantraChange(noteIndex);
    noteIndex = (noteIndex + 1) % mantraNotes.length;
  }, noteDuration);

  // Set BPM
  Tone.Transport.bpm.value = 60;

  return { synth, vol, loop };
};
