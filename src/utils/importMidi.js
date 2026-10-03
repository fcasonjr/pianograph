import { Midi } from '@tonejs/midi'
import { Note } from 'tonal'
import { chordLabel } from './chordDetection'
import { BEAT_STEP } from './beats'
import { MAX_CHORD_BEATS, TIME_SIGNATURE_OPTIONS, DEFAULT_BEATS_PER_MEASURE } from '../constants'

function fail(message) {
  throw new Error(message)
}

// Notes whose attacks fall within this many beats of each other are treated as one chord, so the small
// timing jitter a real MIDI export can have between "simultaneous" notes doesn't split a chord in two.
const ONSET_TOLERANCE_BEATS = 1 / 32

// This is built for quantized "block chord" files — chords struck together and held for a clean
// length, the shape a fake-book or chord-chart export produces — not an expressive performance
// recording. There, overlapping releases, arpeggios, or a melody layered over the harmony would
// confuse the chord grouping below. See the developer guide.
export async function parseImportedMidi(file, accidentals) {
  let midi
  try {
    midi = new Midi(await file.arrayBuffer())
  } catch {
    fail("That file isn't a readable MIDI file.")
  }

  const ppq = midi.header.ppq
  const notes = midi.tracks.flatMap((track) => track.notes)
  if (notes.length === 0) fail('That file has no notes to import.')

  const beatsPerMeasure = beatsPerMeasureFromMidi(midi)
  const clusters = clusterByOnset(notes, ppq * ONSET_TOLERANCE_BEATS)

  const progression = clusters.map((cluster, index) => {
    // A chord lasts until the next one's attack; the final chord borrows the file's measure length,
    // since nothing after it bounds how long it should ring.
    const nextTick = clusters[index + 1]?.startTick ?? cluster.startTick + ppq * beatsPerMeasure
    const beats = Math.min(MAX_CHORD_BEATS, Math.max(BEAT_STEP, Math.round((nextTick - cluster.startTick) / ppq / BEAT_STEP) * BEAT_STEP))
    const noteIds = [...new Set(cluster.midiNotes)]
      .sort((a, b) => a - b)
      .map((midiNumber) => Note.fromMidiSharps(midiNumber))

    return {
      id: crypto.randomUUID(),
      type: 'chord',
      label: chordLabel(noteIds, accidentals),
      notes: noteIds,
      beats,
    }
  })

  const title = (midi.name || file.name.replace(/\.[^.]+$/, '')).trim()

  return { title, beatsPerMeasure, progression }
}

// Groups notes by attack time: notes starting within `tolerance` ticks of a cluster's first note
// join it. `notes` need not be sorted.
function clusterByOnset(notes, tolerance) {
  const sorted = [...notes].sort((a, b) => a.ticks - b.ticks)
  const clusters = []
  for (const note of sorted) {
    const current = clusters[clusters.length - 1]
    if (current && note.ticks - current.startTick <= tolerance) {
      current.midiNotes.push(note.midi)
    } else {
      clusters.push({ startTick: note.ticks, midiNotes: [note.midi] })
    }
  }
  return clusters
}

// The app's beat is always a quarter note (song time signatures are N/4), so a file's time signature
// is converted to a count of quarter-note beats per measure; 6/8 becomes 3, for example. Anything that
// isn't a whole number in the supported range falls back to 4/4 — only the first time signature is
// used, since the app has one time signature for the whole song.
function beatsPerMeasureFromMidi(midi) {
  const [numerator, denominator] = midi.header.timeSignatures[0]?.timeSignature ?? []
  if (!numerator || !denominator) return DEFAULT_BEATS_PER_MEASURE
  const quarterNotesPerMeasure = numerator * (4 / denominator)
  return TIME_SIGNATURE_OPTIONS.includes(quarterNotesPerMeasure)
    ? quarterNotesPerMeasure
    : DEFAULT_BEATS_PER_MEASURE
}
