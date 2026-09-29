import { Chord, Note } from 'tonal'

// Chords are voiced starting around the middle of the keyboard, ascending from there — searching
// isn't meant to produce a final voicing, just a starting point to adjust by hand on the keyboard.
const DEFAULT_START_OCTAVE = 3

// Full words for common qualities, so typing them out ("Eb Major") works alongside the short chord-
// symbol form ("Ebmaj") that Tonal expects. Order matters: "half diminished" must be matched (and its
// own redundant trailing "7"/"7th" absorbed — the m7b5 it maps to already has a 7th) before the plain
// "diminished" rule below would otherwise turn it into a nonsensical "halfdim"; "dominant" is dropped in
// front of a number (the number alone already implies dominant, e.g. "9" is a dominant 9th — "dom9"
// isn't recognized) and otherwise mapped to "dom" ("dominant" alone means a dominant 7th).
const WORD_ALIASES = [
  [/\bhalf[\s-]?dim(?:inished)?\b(\s*7(?:th)?\b)?/gi, 'm7b5'],
  [/\bdominant\b\s*(?=\d)/gi, ''],
  [/\bmajor\b/gi, 'maj'],
  [/\bminor\b/gi, 'min'],
  [/\bdiminished\b/gi, 'dim'],
  [/\baugmented\b/gi, 'aug'],
  [/\bsuspended\b/gi, 'sus'],
  [/\bdominant\b/gi, 'dom'],
]

// Tolerates natural phrasing ("Eb Major 7th chord") in addition to plain chord-symbol notation
// ("Ebmaj7"): spells out common quality words, drops a trailing "chord", and strips English ordinal
// suffixes after a number ("7th" -> "7"). Chord symbols never contain spaces, so those are stripped last,
// along with parentheses and commas around altered extensions ("Ab9(#11)", "C7(#5,#9)") — Tonal only
// recognizes the alterations run together ("Ab9#11", "C7#5#9"), not wrapped in punctuation.
function normalizeChordQuery(query) {
  let text = query.replace(/\bchord\b/gi, '')
  for (const [pattern, replacement] of WORD_ALIASES) text = text.replace(pattern, replacement)
  text = text.replace(/(\d)(st|nd|rd|th)\b/gi, '$1')
  return text.replace(/[(),\s]+/g, '')
}

// Given a chord symbol or name (e.g. "Ebmaj7", "Gm7b5/Db", "Eb Major 7th"), returns its notes as
// sharp-spelled ids ("D#3", "G3", ...), each one voiced above the last. Throws a user-facing Error if
// nothing is recognized.
export function searchChord(query, startOctave = DEFAULT_START_OCTAVE) {
  const symbol = normalizeChordQuery(query)
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
