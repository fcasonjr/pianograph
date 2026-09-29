import { useEffect, useMemo, useRef, useState } from 'react'
import { generateKeys } from '../../utils/pianoKeys'
import { START_OCTAVE, OCTAVE_COUNT } from '../../constants'
import { useMidiInput } from '../../hooks/useMidiInput'
import { previewNote, startNote, stopNote } from '../../utils/audio'
import './Piano.css'

// After the last MIDI key comes up, wait this long before auto-adding, so two hands that lift a moment
// apart (or a re-press) still count as one chord.
const AUTO_ADD_DELAY_MS = 350

function Piano({
  startOctave = START_OCTAVE,
  octaveCount = OCTAVE_COUNT,
  onNotesChange,
  clearSignal = 0,
  applySignal = 0,
  applyNotes = null,
  applyMode = 'replace',
  midiAutoAdd = false,
  onMidiAutoAddChange,
  onMidiCommit,
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

  const [handledApplySignal, setHandledApplySignal] = useState(applySignal)
  // The parent bumps applySignal to load a searched chord onto the keyboard, either replacing the
  // current selection or adding to it (e.g. a hand-clicked bass note plus a searched upper structure).
  if (applySignal !== handledApplySignal) {
    setHandledApplySignal(applySignal)
    const notes = (applyNotes ?? []).filter((id) => validIds.has(id))
    setActiveNotes((prev) => (applyMode === 'merge' ? new Set([...prev, ...notes]) : new Set(notes)))
  }

  useEffect(() => {
    onNotesChange?.(Array.from(activeNotes))
  }, [activeNotes, onNotesChange])

  // MIDI keys physically held down, tracked apart from the selection: a released key stays selected.
  const heldMidiNotes = useRef(new Set())
  const autoAddTimer = useRef(null)
  const commitRef = useRef(onMidiCommit)
  useEffect(() => {
    commitRef.current = onMidiCommit
  })

  function cancelAutoAdd() {
    clearTimeout(autoAddTimer.current)
    autoAddTimer.current = null
  }

  useEffect(() => cancelAutoAdd, [])
  // Clearing the keyboard, or loading a searched chord onto it, should also cancel an add that is about to fire.
  useEffect(cancelAutoAdd, [clearSignal, applySignal])

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

  // MIDI notes latch: pressing selects the note, releasing only stops its sound. That frees both hands, since
  // the chord no longer has to be held while it is added (auto-add on release, the sustain pedal, or the button).
  function midiNoteOn(id) {
    if (!validIds.has(id)) return
    cancelAutoAdd()
    heldMidiNotes.current.add(id)
    startNote(id)
    setActiveNotes((prev) => {
      if (prev.has(id)) return prev
      return new Set(prev).add(id)
    })
  }

  function midiNoteOff(id) {
    if (!validIds.has(id)) return
    heldMidiNotes.current.delete(id)
    stopNote(id)
    if (midiAutoAdd && heldMidiNotes.current.size === 0) {
      cancelAutoAdd()
      autoAddTimer.current = setTimeout(() => commitRef.current?.(), AUTO_ADD_DELAY_MS)
    }
  }

  function midiSustain(isDown) {
    if (!isDown) return
    cancelAutoAdd()
    commitRef.current?.()
  }

  const { supported: midiSupported, devices: midiDevices } = useMidiInput({
    onNoteOn: midiNoteOn,
    onNoteOff: midiNoteOff,
    onSustain: midiSustain,
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
      <div className="midi-row">
        <p className={`midi-status ${midiDevices.length > 0 ? 'connected' : ''}`}>{midiStatus}</p>
        {midiDevices.length > 0 && (
          <label className="midi-option">
            <input
              type="checkbox"
              checked={midiAutoAdd}
              onChange={(event) => onMidiAutoAddChange?.(event.target.checked)}
            />
            Add chord when I lift my hands
          </label>
        )}
      </div>
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
