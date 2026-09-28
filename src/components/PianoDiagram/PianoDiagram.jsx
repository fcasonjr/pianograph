import { useMemo } from 'react'
import { generateKeys } from '../../utils/pianoKeys'
import { START_OCTAVE } from '../../constants'
import './PianoDiagram.css'

const MIN_OCTAVES = 2
const MAX_KEY_WIDTH = 8
const MAX_DIAGRAM_WIDTH = 140

function octaveOf(noteId) {
  return Number(noteId.match(/-?\d+$/)[0])
}

// Show only the octaves a chord actually uses (so a two-handed voicing with a low
// bass note gets a wide diagram), shrinking keys so the diagram never exceeds MAX_DIAGRAM_WIDTH.
// The width set below is the *natural* size; CSS lets it shrink further (max-width: 100%) in tight spots.
function fitRange(notes) {
  if (notes.length === 0) {
    return { startOctave: START_OCTAVE, octaveCount: MIN_OCTAVES, keyWidth: MAX_KEY_WIDTH }
  }
  const octaves = notes.map(octaveOf)
  const startOctave = Math.min(...octaves)
  const octaveCount = Math.max(MIN_OCTAVES, Math.max(...octaves) - startOctave + 1)
  const keyWidth = Math.min(MAX_KEY_WIDTH, MAX_DIAGRAM_WIDTH / (octaveCount * 7))
  return { startOctave, octaveCount, keyWidth }
}

function PianoDiagram({ notes }) {
  const { startOctave, octaveCount, keyWidth } = useMemo(() => fitRange(notes), [notes])
  const { whiteKeys, blackKeys } = useMemo(
    () => generateKeys(startOctave, octaveCount),
    [startOctave, octaveCount],
  )
  const noteSet = useMemo(() => new Set(notes), [notes])

  return (
    <div
      className="mini-piano"
      style={{
        '--key-count': whiteKeys.length,
        width: `${keyWidth * whiteKeys.length}px`,
      }}
    >
      {whiteKeys.map((key) => (
        <div
          key={key.id}
          className={`mini-key mini-key-white ${noteSet.has(key.id) ? 'active' : ''}`}
        />
      ))}
      {blackKeys.map((key) => (
        <div
          key={key.id}
          className={`mini-key mini-key-black ${noteSet.has(key.id) ? 'active' : ''}`}
          style={{ '--after-index': key.afterIndex }}
        />
      ))}
    </div>
  )
}

export default PianoDiagram
