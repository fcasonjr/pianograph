import { useMemo } from 'react'
import { generateKeys } from '../../utils/pianoKeys'
import { START_OCTAVE, OCTAVE_COUNT } from '../../constants'
import './ChordCard.css'

function ChordCard({ label, notes, startOctave = START_OCTAVE, octaveCount = OCTAVE_COUNT, onRemove }) {
  const { whiteKeys, blackKeys } = useMemo(
    () => generateKeys(startOctave, octaveCount),
    [startOctave, octaveCount],
  )
  const noteSet = useMemo(() => new Set(notes), [notes])

  return (
    <div className="chord-card">
      <button
        type="button"
        className="chord-card-remove"
        onClick={onRemove}
        aria-label={`Remove ${label}`}
      >
        ×
      </button>
      <div className="chord-card-name">{label}</div>
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
    </div>
  )
}

export default ChordCard
