import { Chord, Note } from 'tonal'
import { MAX_TRANSPOSE, START_OCTAVE, OCTAVE_COUNT } from '../constants'
import { chordLabel, detectChord } from './chordDetection'
import { unfoldRepeats } from './repeats'

// Whether a value is a usable transposition: a whole number of semitones within one octave either way.
export function isValidTranspose(value) {
  return Number.isInteger(value) && Math.abs(value) <= MAX_TRANSPOSE
}

const LOWEST_MIDI = Note.midi(`C${START_OCTAVE}`)
const HIGHEST_MIDI = Note.midi(`B${START_OCTAVE + OCTAVE_COUNT - 1}`)

// Shifts every note by `semitones`. If that pushes the chord off the keyboard, the whole chord moves by
// octaves until it fits (keeping its voicing), so a card can always be edited and played. Ids stay
// sharp-spelled, like everywhere else; the chord's *name* is respelled by chordLabel.
export function transposeNotes(notes, semitones) {
  if (semitones === 0 || notes.length === 0) return notes
  const midis = notes.map((id) => Note.midi(id) + semitones)
  const low = Math.min(...midis)
  const high = Math.max(...midis)
  let octaves = 0
  if (low < LOWEST_MIDI) octaves = Math.ceil((LOWEST_MIDI - low) / 12)
  else if (high > HIGHEST_MIDI) octaves = -Math.ceil((high - HIGHEST_MIDI) / 12)
  return midis.map((midi) => Note.fromMidiSharps(midi + octaves * 12))
}

// The progression as the user sees and hears it: every chord shifted and relabelled, sections untouched.
// The stored progression is never changed, so 0 semitones is always the original (and costs nothing).
export function transposeProgression(progression, semitones, accidentals) {
  if (semitones === 0) return progression
  return progression.map((entry) => {
    if (entry.type === 'section') return entry
    const notes = transposeNotes(entry.notes, semitones)
    return { ...entry, notes, label: chordLabel(notes, accidentals) }
  })
}

// Chains several passes into one flat play list, each pass a step higher than the last (a practice mode:
// run the song, or the song form, through the keys). `buildChords` turns a (transposed) progression into
// what one pass plays, exactly as a single play would. Each pass is unfolded for its own repeats and
// endings *here* and its repeat marks stripped, so they can't leak across the join when playback unfolds
// the whole list again. Every chord is tagged with its pass's `practiceShift` so the UI can follow along.
export function buildTransposingPasses(progression, buildChords, { base, step, passes }) {
  return Array.from({ length: passes }, (_, pass) => {
    const practiceShift = pass * step
    const shifted = transposeProgression(progression, base + practiceShift, 'sharps')
    return unfoldRepeats(buildChords(shifted)).map(
      ({ repeatStart: _repeatStart, repeatEnd: _repeatEnd, ending: _ending, ...chord }) => ({
        ...chord,
        practiceShift,
      }),
    )
  }).flat()
}

const FLAT_KEYS = new Set([1, 3, 5, 6, 8, 10]) // Db Eb F Gb Ab Bb
const SHARP_KEYS = new Set([2, 4, 7, 9, 11]) // D E G A B

// Guesses sharps or flats for the key the song lands in after transposing by `semitones`, taking the
// first chord as the tonic (a minor chord counts as its relative major) — so C to Eb gives flats and C to
// E gives sharps. Returns null when there is nothing to go on or the key is C, i.e. leave spelling alone.
export function keySpelling(progression, semitones) {
  const first = progression.find((entry) => entry.type === 'chord')
  if (!first) return null
  const [name] = detectChord(first.notes, 'sharps')
  if (!name) return null
  const { tonic, quality } = Chord.get(name.split('/')[0])
  if (!tonic) return null
  const majorKey = (((Note.chroma(tonic) + (quality === 'Minor' ? 3 : 0) + semitones) % 12) + 12) % 12
  if (FLAT_KEYS.has(majorKey)) return 'flats'
  return SHARP_KEYS.has(majorKey) ? 'sharps' : null
}

// "+3", "−2", "Original" — the amount as shown on the control and noted in text exports.
export function formatTranspose(semitones) {
  if (semitones === 0) return 'Original key'
  return `${semitones > 0 ? '+' : '−'}${Math.abs(semitones)} semitone${Math.abs(semitones) === 1 ? '' : 's'}`
}
