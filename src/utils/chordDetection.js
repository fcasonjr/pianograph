import { Chord, Note } from 'tonal'

// Note ids are always sharp-spelled ("D#4"); respell them so Tonal names roots the way the user prefers.
function spell(noteId, accidentals) {
  const midi = Note.midi(noteId)
  return accidentals === 'flats' ? Note.fromMidi(midi) : Note.fromMidiSharps(midi)
}

// Tonal treats the first note as the bass, so sort low-to-high: the lowest pitch
// (not the first one clicked) decides slash-chord bass names.
function sortByPitch(noteIds) {
  return [...noteIds].sort((a, b) => Note.midi(a) - Note.midi(b))
}

export function detectChord(noteIds, accidentals = 'sharps') {
  if (noteIds.length < 2) return []
  const spelled = sortByPitch(noteIds).map((id) => spell(id, accidentals))
  // assumePerfectFifth lets voicings that omit the 5th (common in jazz) still match.
  return Chord.detect(spelled, { assumePerfectFifth: true })
}

export function chordLabel(noteIds, accidentals = 'sharps') {
  if (noteIds.length === 0) return ''
  const chords = detectChord(noteIds, accidentals)
  if (chords.length > 0) return chords.join(' / ')
  if (noteIds.length === 1) return spell(noteIds[0], accidentals).replace(/-?\d+$/, '')
  return 'No chord match'
}
