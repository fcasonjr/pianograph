import { Chord } from 'tonal'

export function detectChord(noteIds) {
  if (noteIds.length < 2) return []
  return Chord.detect(noteIds)
}

export function chordLabel(noteIds) {
  if (noteIds.length === 0) return ''
  const chords = detectChord(noteIds)
  if (chords.length > 0) return chords.join(' / ')
  if (noteIds.length === 1) return noteIds[0].replace(/\d+$/, '')
  return 'No chord match'
}
