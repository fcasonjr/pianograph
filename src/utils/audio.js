import * as Tone from 'tone'

let synth = null

function getSynth() {
  if (!synth) {
    synth = new Tone.PolySynth(Tone.Synth).toDestination()
  }
  return synth
}

export async function playChord(notes, duration = 1) {
  if (notes.length === 0) return
  await Tone.start()
  getSynth().triggerAttackRelease(notes, duration)
}

export async function previewNote(note, duration = 0.5) {
  await Tone.start()
  getSynth().triggerAttackRelease(note, duration)
}

export async function startNote(note) {
  await Tone.start()
  getSynth().triggerAttack(note)
}

export function stopNote(note) {
  getSynth().triggerRelease(note)
}

export async function playProgression(chords, bpm, { onStepChange } = {}) {
  const playable = chords.filter((chord) => chord.type !== 'section' && chord.notes?.length > 0)
  if (playable.length === 0) return 0

  await Tone.start()
  const s = getSynth()
  const beatSeconds = 60 / bpm
  const now = Tone.now()

  // Each chord sounds for its own length in beats, so two 2-beat chords fill one 4-beat measure.
  let elapsedBeats = 0
  playable.forEach((chord) => {
    const beats = chord.beats ?? 4
    s.triggerAttackRelease(chord.notes, beats * beatSeconds * 0.9, now + elapsedBeats * beatSeconds)
    if (onStepChange) {
      setTimeout(() => onStepChange(chord.id), elapsedBeats * beatSeconds * 1000)
    }
    elapsedBeats += beats
  })

  return elapsedBeats * beatSeconds * 1000
}
