import * as Tone from 'tone';
import type { MantraNote } from '$lib/stores/soundStore';

export interface AudioEngine {
  synth: Tone.Synth;
  vol: Tone.Volume;
  loop: Tone.Loop;
}

// Convert volume percentage to decibels for Tone.js
const volumeToDecibels = (value: number, r1 = [0, 100], r2 = [-48, 0]): number => {
  return Math.floor(((value - r1[0]) * (r2[1] - r2[0])) / (r1[1] - r1[0]) + r2[0]);
};

export const createAudioEngine = async (
  initialVolume: number,
  mantraNotes: MantraNote[],
  onMantraChange: (index: number) => void
): Promise<AudioEngine> => {
  // Initialize volume control
  const vol = new Tone.Volume(volumeToDecibels(initialVolume)).toDestination();

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
