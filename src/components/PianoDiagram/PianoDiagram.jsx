import { useMemo } from 'react'
import { generateKeys } from '../../utils/pianoKeys'
import { chordToneLabels } from '../../utils/chordTones'
import { fitRange } from '../../utils/diagramSize'
import './PianoDiagram.css'

function PianoDiagram({ notes, labelMode = 'off', accidentals = 'sharps' }) {
  const { startOctave, octaveCount, keyWidth } = useMemo(() => fitRange(notes), [notes])
  const { whiteKeys, blackKeys } = useMemo(
    () => generateKeys(startOctave, octaveCount),
    [startOctave, octaveCount],
  )
  const noteSet = useMemo(() => new Set(notes), [notes])
  const toneLabels = useMemo(
    () => chordToneLabels(notes, labelMode, accidentals),
    [notes, labelMode, accidentals],
  )

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
        >
          {toneLabels.has(key.id) && <span className="mini-tone-label">{toneLabels.get(key.id)}</span>}
        </div>
      ))}
      {blackKeys.map((key) => (
        <div
          key={key.id}
          className={`mini-key mini-key-black ${noteSet.has(key.id) ? 'active' : ''}`}
          style={{ '--after-index': key.afterIndex }}
        >
          {toneLabels.has(key.id) && <span className="mini-tone-label">{toneLabels.get(key.id)}</span>}
        </div>
      ))}
    </div>
  )
}

export default PianoDiagram
