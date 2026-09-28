import { useMemo } from 'react'
import { generateKeys } from '../../utils/pianoKeys'
import { START_OCTAVE, OCTAVE_COUNT } from '../../constants'
import './PianoDiagram.css'

function PianoDiagram({ notes, startOctave = START_OCTAVE, octaveCount = OCTAVE_COUNT }) {
  const { whiteKeys, blackKeys } = useMemo(
    () => generateKeys(startOctave, octaveCount),
    [startOctave, octaveCount],
  )
  const noteSet = useMemo(() => new Set(notes), [notes])

  return (
    <div className="mini-piano" style={{ '--key-count': whiteKeys.length }}>
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
