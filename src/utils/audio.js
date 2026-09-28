import * as Tone from 'tone'
import { unfoldRepeats } from './repeats'

// Real piano samples (Salamander Grand Piano, CC-BY 3.0), bundled in public/samples/salamander. One
// recording every minor third across the app's range; Tone.Sampler pitch-shifts the gaps.
const PIANO_BASE_URL = `${import.meta.env.BASE_URL}samples/salamander/`
const PIANO_SAMPLES = Object.fromEntries(
  ['C', 'D#', 'F#', 'A'].flatMap((name) => [2, 3, 4, 5].map((octave) => [`${name}${octave}`, `${name.replace('#', 's')}${octave}.mp3`])).concat([['C6', 'C6.mp3']]),
)

let synth = null
let piano = null
let pianoStatus = 'idle' // 'idle' | 'loading' | 'ready' | 'failed'

function getSynth() {
  if (!synth) {
    synth = new Tone.PolySynth(Tone.Synth).toDestination()
  }
  return synth
}

// Starts downloading the piano samples (once). Until they finish — or if they never do, e.g. offline —
// every audio path falls back to the synth, so sound always works.
export function loadPiano() {
  if (pianoStatus !== 'idle') return
  pianoStatus = 'loading'
  piano = new Tone.Sampler({
    urls: PIANO_SAMPLES,
    baseUrl: PIANO_BASE_URL,
    release: 1,
    onload: () => {
      pianoStatus = 'ready'
    },
    onerror: () => {
      pianoStatus = 'failed'
    },
  }).toDestination()
}

function getInstrument() {
  loadPiano()
  return pianoStatus === 'ready' ? piano : getSynth()
}

export async function playChord(notes, duration = 1) {
  if (notes.length === 0) return
  await Tone.start()
  getInstrument().triggerAttackRelease(notes, duration)
}

export async function previewNote(note, duration = 0.5) {
  await Tone.start()
  getInstrument().triggerAttackRelease(note, duration)
}

export async function startNote(note) {
  await Tone.start()
  getInstrument().triggerAttack(note)
}

export function stopNote(note) {
  // The note may have started on the synth just before the piano finished loading, so release on both.
  if (synth) synth.triggerRelease(note)
  if (pianoStatus === 'ready') piano.triggerRelease(note)
}

export async function playProgression(chords, bpm, { onStepChange } = {}) {
  // Repeats and endings are unfolded into play order (a repeated chord is scheduled, and highlighted, twice).
  const playable = unfoldRepeats(chords).filter((chord) => chord.notes?.length > 0)
  if (playable.length === 0) return 0

  await Tone.start()
  const instrument = getInstrument()
  const beatSeconds = 60 / bpm
  const now = Tone.now()

  // Each chord sounds for its own length in beats, so two 2-beat chords fill one 4-beat measure.
  let elapsedBeats = 0
  playable.forEach((chord) => {
    const beats = chord.beats ?? 4
    instrument.triggerAttackRelease(chord.notes, beats * beatSeconds * 0.9, now + elapsedBeats * beatSeconds)
    if (onStepChange) {
      setTimeout(() => onStepChange(chord.id), elapsedBeats * beatSeconds * 1000)
    }
    elapsedBeats += beats
  })

  return elapsedBeats * beatSeconds * 1000
}
