import { START_OCTAVE } from '../constants'

const MIN_OCTAVES = 2
const MAX_KEY_WIDTH = 9
const MAX_DIAGRAM_WIDTH = 150

function octaveOf(noteId) {
  return Number(noteId.match(/-?\d+$/)[0])
}

// Show only the octaves a chord actually uses (so a two-handed voicing with a low
// bass note gets a wide diagram), shrinking keys so the diagram never exceeds MAX_DIAGRAM_WIDTH.
// This is the diagram's *natural* size; CSS lets it shrink further (max-width: 100%) in tight spots.
export function fitRange(notes) {
  if (notes.length === 0) {
    return { startOctave: START_OCTAVE, octaveCount: MIN_OCTAVES, keyWidth: MAX_KEY_WIDTH }
  }
  const octaves = notes.map(octaveOf)
  const startOctave = Math.min(...octaves)
  const octaveCount = Math.max(MIN_OCTAVES, Math.max(...octaves) - startOctave + 1)
  const keyWidth = Math.min(MAX_KEY_WIDTH, MAX_DIAGRAM_WIDTH / (octaveCount * 7))
  return { startOctave, octaveCount, keyWidth }
}

export function diagramNaturalWidth(notes) {
  const { octaveCount, keyWidth } = fitRange(notes)
  return keyWidth * octaveCount * 7
}
