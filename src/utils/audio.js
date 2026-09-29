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

// playProgression uses Tone.Transport (rather than raw Tone.now()-relative timestamps, the earlier
// approach) specifically so playback can be paused and resumed from exactly where it left off:
// Transport has its own pausable clock, and events scheduled against it stay correctly positioned
// relative to that clock regardless of how long a pause lasts, which real wall-clock setTimeouts can't do.
export async function playProgression(chords, bpm, { onStepChange, onComplete } = {}) {
  // Repeats and endings are unfolded into play order (a repeated chord is scheduled, and highlighted, twice).
  const playable = unfoldRepeats(chords).filter((chord) => chord.notes?.length > 0)
  if (playable.length === 0) return 0

  await Tone.start()
  const instrument = getInstrument()
  const beatSeconds = 60 / bpm

  // Clears anything left scheduled from a run that was stopped rather than played to completion.
  Tone.Transport.cancel()
  Tone.Transport.stop()

  // Each chord sounds for its own length in beats, so two 2-beat chords fill one 4-beat measure.
  let elapsedBeats = 0
  playable.forEach((chord) => {
    const beats = chord.beats ?? 4
    const offset = elapsedBeats * beatSeconds
    Tone.Transport.schedule((time) => {
      instrument.triggerAttackRelease(chord.notes, beats * beatSeconds * 0.9, time)
    }, offset)
    if (onStepChange) {
      // Tone.Draw syncs a UI update to the right visual frame near the audio event's own time,
      // rather than firing the React state update straight from the audio-scheduling callback.
      Tone.Transport.schedule((time) => {
        Tone.Draw.schedule(() => onStepChange(chord.id), time)
      }, offset)
    }
    elapsedBeats += beats
  })

  const totalSeconds = elapsedBeats * beatSeconds
  if (onComplete) {
    Tone.Transport.schedule((time) => {
      Tone.Draw.schedule(onComplete, time)
    }, totalSeconds)
  }

  Tone.Transport.start()
  return totalSeconds * 1000
}

export function pauseProgression() {
  Tone.Transport.pause()
}

export function resumeProgression() {
  Tone.Transport.start()
}

// Ends playback outright (as opposed to pausing): resets the transport back to the start and cancels
// every remaining scheduled chord, then immediately silences whatever's still ringing — pausing alone
// stops new notes from firing but lets an already-triggered chord ring out its own release tail.
export function stopProgression() {
  Tone.Transport.stop()
  Tone.Transport.cancel()
  synth?.releaseAll()
  if (pianoStatus === 'ready') piano.releaseAll()
}
