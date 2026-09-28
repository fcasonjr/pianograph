import { useMemo } from 'react'
import { generateKeys } from '../../utils/pianoKeys'
import { fitRange } from '../../utils/diagramSize'
import './PianoDiagram.css'

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
