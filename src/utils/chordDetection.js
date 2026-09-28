import { Chord, Note } from 'tonal'

// Tonal treats the first note as the bass, so sort low-to-high: the lowest pitch
// (not the first one clicked) decides slash-chord bass names.
function sortByPitch(noteIds) {
  return [...noteIds].sort((a, b) => Note.midi(a) - Note.midi(b))
}

export function detectChord(noteIds) {
  if (noteIds.length < 2) return []
  // assumePerfectFifth lets voicings that omit the 5th (common in jazz) still match.
  return Chord.detect(sortByPitch(noteIds), { assumePerfectFifth: true })
}

export function chordLabel(noteIds) {
  if (noteIds.length === 0) return ''
  const chords = detectChord(noteIds)
  if (chords.length > 0) return chords.join(' / ')
  if (noteIds.length === 1) return noteIds[0].replace(/-?\d+$/, '')
  return 'No chord match'
}
