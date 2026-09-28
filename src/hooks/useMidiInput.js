import { useEffect, useRef, useState } from 'react'

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

const NOTE_ON = 0x90
const NOTE_OFF = 0x80

function midiNoteToId(number) {
  const name = NOTE_NAMES[number % 12]
  const octave = Math.floor(number / 12) - 1
  return `${name}${octave}`
}

export function useMidiInput({ onNoteOn, onNoteOff }) {
  const [supported] = useState(
    () => typeof navigator !== 'undefined' && 'requestMIDIAccess' in navigator,
  )
  const [devices, setDevices] = useState([])
  const handlersRef = useRef({ onNoteOn, onNoteOff })
  handlersRef.current = { onNoteOn, onNoteOff }

  useEffect(() => {
    if (!supported) return

    let midiAccess = null
    const attachedInputs = new Set()

    function handleMessage(event) {
      const [status, note, velocity] = event.data
      const command = status & 0xf0
      const noteId = midiNoteToId(note)

      if (command === NOTE_ON && velocity > 0) {
        handlersRef.current.onNoteOn?.(noteId)
      } else if (command === NOTE_OFF || (command === NOTE_ON && velocity === 0)) {
        handlersRef.current.onNoteOff?.(noteId)
      }
    }

    function syncDevices() {
      const inputs = Array.from(midiAccess.inputs.values())
      inputs.forEach((input) => {
        if (!attachedInputs.has(input)) {
          input.onmidimessage = handleMessage
          attachedInputs.add(input)
        }
      })
      setDevices(
        inputs
          .filter((input) => input.state === 'connected')
          .map((input) => ({ id: input.id, name: input.name || 'MIDI device' })),
      )
    }

    navigator
      .requestMIDIAccess()
      .then((access) => {
        midiAccess = access
        syncDevices()
        midiAccess.onstatechange = syncDevices
      })
      .catch(() => setDevices([]))

    return () => {
      attachedInputs.forEach((input) => {
        input.onmidimessage = null
      })
      if (midiAccess) midiAccess.onstatechange = null
    }
  }, [supported])

  return { supported, devices }
}
