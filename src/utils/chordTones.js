import { Chord, Interval, Note } from 'tonal'
import { detectChord } from './chordDetection'

// "3M" -> "3", "7m" -> "b7", "5A" -> "#5", "7d" -> "bb7". Extensions keep their compound number (9, 11, 13).
function intervalLabel(intervalName) {
  const { num, alt } = Interval.get(intervalName)
  const prefix = alt > 0 ? '#'.repeat(alt) : 'b'.repeat(-alt)
  return `${prefix}${num}`
}

const pitchClass = (noteId) => ((Note.midi(noteId) % 12) + 12) % 12

// Tonal lists every reading of a cluster, bass-first: E-G-C comes back as Em#5 before C/E. Keep the first
// reading unless it needs an augmented interval (#5, #9, ...) that another reading avoids, so common
// inversions number from the root the user would expect.
function pickReading(names) {
  const augmented = (name) =>
    Chord.get(name).intervals.filter((i) => Interval.get(i).q === 'A').length
  return names.reduce((best, name) => (best === undefined || augmented(name) < augmented(best) ? name : best), undefined)
}

// Map of note id -> label for the notes of one chord, or an empty map when there is nothing to show.
// 'numbers' follow the detected chord's root (not the lowest note), so an inversion still labels C as 1;
// an unrecognized cluster gets no numbers rather than a guessed root. 'names' need no detection.
export function chordToneLabels(noteIds, mode, accidentals = 'sharps') {
  const labels = new Map()
  if (mode === 'names') {
    for (const id of noteIds) {
      const midi = Note.midi(id)
      const name = accidentals === 'flats' ? Note.fromMidi(midi) : Note.fromMidiSharps(midi)
      labels.set(id, Note.pitchClass(name))
    }
    return labels
  }
  if (mode !== 'numbers') return labels

  const name = pickReading(detectChord(noteIds, accidentals))
  if (!name) return labels
  const { tonic, type } = Chord.get(name)
  // Rebuild from the type: a slash chord's own interval list is measured from its bass, not its root.
  const { intervals } = Chord.getChord(type, tonic)
  const rootPc = Note.chroma(tonic)
  const byPitchClass = new Map(intervals.map((i) => [(rootPc + Interval.semitones(i)) % 12, i]))
  for (const id of noteIds) {
    const interval = byPitchClass.get(pitchClass(id))
    if (interval) labels.set(id, intervalLabel(interval))
  }
  return labels
}
