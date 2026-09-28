import { useEffect, useMemo, useRef, useState } from 'react'
import { generateKeys } from '../../utils/pianoKeys'
import { START_OCTAVE, OCTAVE_COUNT } from '../../constants'
import { useMidiInput } from '../../hooks/useMidiInput'
import { previewNote, startNote, stopNote } from '../../utils/audio'
import './Piano.css'

function Piano({
  startOctave = START_OCTAVE,
  octaveCount = OCTAVE_COUNT,
  onNotesChange,
  clearSignal = 0,
}) {
  const [activeNotes, setActiveNotes] = useState(() => new Set())
  const [handledClearSignal, setHandledClearSignal] = useState(clearSignal)
  // The parent bumps clearSignal to request a clear; adjusting state during render avoids an extra effect pass.
  if (clearSignal !== handledClearSignal) {
    setHandledClearSignal(clearSignal)
    setActiveNotes(new Set())
  }
  const { whiteKeys, blackKeys } = useMemo(
    () => generateKeys(startOctave, octaveCount),
    [startOctave, octaveCount],
  )

  const scrollRef = useRef(null)
  const validIds = useMemo(
    () => new Set([...whiteKeys, ...blackKeys].map((key) => key.id)),
    [whiteKeys, blackKeys],
  )

  useEffect(() => {
    onNotesChange?.(Array.from(activeNotes))
  }, [activeNotes, onNotesChange])

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2
  }, [])

  function toggleNote(id) {
    if (!activeNotes.has(id)) {
      previewNote(id)
    }
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

  function setNoteActive(id, isActive) {
    if (!validIds.has(id)) return
    if (isActive) {
      startNote(id)
    } else {
      stopNote(id)
    }
    setActiveNotes((prev) => {
      if (isActive === prev.has(id)) return prev
      const next = new Set(prev)
      if (isActive) {
        next.add(id)
      } else {
        next.delete(id)
      }
      return next
    })
  }

  const { supported: midiSupported, devices: midiDevices } = useMidiInput({
    onNoteOn: (noteId) => setNoteActive(noteId, true),
    onNoteOff: (noteId) => setNoteActive(noteId, false),
  })

  let midiStatus = 'MIDI not supported in this browser'
  if (midiSupported) {
    midiStatus =
      midiDevices.length > 0
        ? `MIDI connected: ${midiDevices.map((d) => d.name).join(', ')}`
        : 'No MIDI device connected'
  }

  return (
    <div className="piano-container">
      <p className={`midi-status ${midiDevices.length > 0 ? 'connected' : ''}`}>{midiStatus}</p>
      <div className="piano-scroll" ref={scrollRef}>
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
      </div>
    </div>
  )
}

export default Piano
