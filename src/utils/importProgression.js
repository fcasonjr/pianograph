import { Note } from 'tonal'
import { chordLabel } from './chordDetection'
import { cleanMarks } from './repeats'
import { listSections } from './sections'
import { DEFAULT_BEATS_PER_MEASURE, MAX_CHORD_BEATS, TIME_SIGNATURE_OPTIONS } from '../constants'

const MAX_TITLE_LENGTH = 120

function fail(message) {
  throw new Error(message)
}

function parseEntry(raw, index, accidentals, defaultBeats) {
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
    Number.isInteger(raw.beats) && raw.beats >= 1 && raw.beats <= MAX_CHORD_BEATS
      ? raw.beats
      : defaultBeats

  // Recompute the label rather than trusting the file, so it matches the current sharps/flats setting.
  return {
    id: crypto.randomUUID(),
    type: 'chord',
    label: chordLabel(notes, accidentals),
    notes,
    beats,
    ...cleanMarks(raw),
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
  const fileBeats = !Array.isArray(data) ? data.beatsPerMeasure : undefined
  const beatsPerMeasure = TIME_SIGNATURE_OPTIONS.includes(fileBeats)
    ? fileBeats
    : DEFAULT_BEATS_PER_MEASURE
  const progression = entries.map((entry, i) => parseEntry(entry, i, accidentals, beatsPerMeasure))

  // A song form is stored as each step's position among the sections (see exportProgression.js), since
  // ids are regenerated on every import; map those positions to the freshly generated section ids.
  const sections = listSections(progression)
  const rawPlayOrder = !Array.isArray(data) && Array.isArray(data.playOrder) ? data.playOrder : []
  const playOrder = rawPlayOrder
    .filter((i) => Number.isInteger(i) && i >= 0 && i < sections.length)
    .map((i) => sections[i].id)

  return { title, beatsPerMeasure, playOrder, progression }
}
