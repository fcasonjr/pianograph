import { Chord, Note } from 'tonal'

// Chords are voiced starting around the middle of the keyboard, ascending from there — searching
// isn't meant to produce a final voicing, just a starting point to adjust by hand on the keyboard.
const DEFAULT_START_OCTAVE = 3

// Given a chord symbol (e.g. "Ebmaj7", "Gm7b5/Db"), returns its notes as sharp-spelled ids
// ("D#3", "G3", ...), each one voiced above the last. Throws a user-facing Error if the symbol
// isn't recognized.
export function searchChord(query, startOctave = DEFAULT_START_OCTAVE) {
  // Chord symbols don't contain spaces; stripping them tolerates input like "Eb Maj7".
  const symbol = query.replace(/\s+/g, '')
  if (!symbol) throw new Error('Type a chord to search for.')

  const chord = Chord.get(symbol)
  if (chord.empty) throw new Error(`"${query}" isn't a chord Pianograph recognizes.`)

  // Tonal returns note names with the bass first (for a slash chord) or the root first, with no
  // octave. Stack each one in the lowest octave that keeps it above the previous note, so the
  // result is a single ascending voicing rather than several notes piled on the same octave.
  let previousMidi = null
  return chord.notes.map((name) => {
    let octave = startOctave
    let midi = Note.midi(`${name}${octave}`)
    while (previousMidi !== null && midi <= previousMidi) {
      octave += 1
      midi = Note.midi(`${name}${octave}`)
    }
    previousMidi = midi
    return Note.fromMidiSharps(midi)
  })
}
