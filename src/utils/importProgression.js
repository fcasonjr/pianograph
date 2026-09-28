import { Note } from 'tonal'
import { chordLabel } from './chordDetection'

const MAX_BEATS = 32
const MAX_TITLE_LENGTH = 120

function fail(message) {
  throw new Error(message)
}

function parseEntry(raw, index, accidentals) {
  const n = index + 1
  if (!raw || typeof raw !== 'object') fail(`Entry ${n} isn't an object.`)

  if (raw.type === 'section') {
    const name = typeof raw.name === 'string' ? raw.name.trim() : ''
    if (!name) fail(`Section ${n} has no name.`)
    return { id: crypto.randomUUID(), type: 'section', name }
  }

  if (!Array.isArray(raw.notes) || raw.notes.length === 0) fail(`Chord ${n} has no notes.`)
  const notes = [
    ...new Set(
      raw.notes.map((note) => {
        const midi = typeof note === 'string' ? Note.midi(note) : null
        if (midi === null) fail(`Chord ${n} has an invalid note: ${JSON.stringify(note)}.`)
        return Note.fromMidiSharps(midi)
      }),
    ),
  ]
  const beats =
    Number.isInteger(raw.beats) && raw.beats >= 1 && raw.beats <= MAX_BEATS ? raw.beats : 4

  // Recompute the label rather than trusting the file, so it matches the current sharps/flats setting.
  return {
    id: crypto.randomUUID(),
    type: 'chord',
    label: chordLabel(notes, accidentals),
    notes,
    beats,
  }
}

// Accepts the current export shape ({ title, progression }) and older plain-array exports.
export function parseImportedSong(text, accidentals) {
  let data
  try {
    data = JSON.parse(text)
  } catch {
    fail("That file isn't valid JSON.")
  }

  const entries = Array.isArray(data) ? data : data?.progression
  if (!Array.isArray(entries)) fail("That file doesn't look like a Pianograph export.")
  if (entries.length === 0) fail('That file contains no chords.')

  const title =
    !Array.isArray(data) && typeof data.title === 'string'
      ? data.title.trim().slice(0, MAX_TITLE_LENGTH)
      : ''
  return { title, progression: entries.map((entry, i) => parseEntry(entry, i, accidentals)) }
}
