import { useEffect, useMemo, useState } from 'react'
import { generateKeys } from '../../utils/pianoKeys'
import { START_OCTAVE, OCTAVE_COUNT } from '../../constants'
import './Piano.css'

function Piano({ startOctave = START_OCTAVE, octaveCount = OCTAVE_COUNT, onNotesChange }) {
  const [activeNotes, setActiveNotes] = useState(() => new Set())
  const { whiteKeys, blackKeys } = useMemo(
    () => generateKeys(startOctave, octaveCount),
    [startOctave, octaveCount],
  )

  useEffect(() => {
    onNotesChange?.(Array.from(activeNotes))
  }, [activeNotes, onNotesChange])

  function toggleNote(id) {
    setActiveNotes((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  return (
    <div className="piano" style={{ '--key-count': whiteKeys.length }}>
      {whiteKeys.map((key) => (
        <button
          key={key.id}
          type="button"
          className={`key key-white ${activeNotes.has(key.id) ? 'active' : ''}`}
          onClick={() => toggleNote(key.id)}
          aria-pressed={activeNotes.has(key.id)}
          aria-label={key.id}
        >
          {key.note === 'C' && <span className="key-label">{key.id}</span>}
        </button>
      ))}
      {blackKeys.map((key) => (
        <button
          key={key.id}
          type="button"
          className={`key key-black ${activeNotes.has(key.id) ? 'active' : ''}`}
          style={{ '--after-index': key.afterIndex }}
          onClick={() => toggleNote(key.id)}
          aria-pressed={activeNotes.has(key.id)}
          aria-label={key.id}
        />
      ))}
    </div>
  )
}

export default Piano
