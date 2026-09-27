import { useState } from 'react'
import Piano from './components/Piano/Piano'
import Progression from './components/Progression/Progression'
import { chordLabel } from './utils/chordDetection'
import './App.css'

function App() {
  const [selectedNotes, setSelectedNotes] = useState([])
  const [progression, setProgression] = useState([])

  const currentLabel = chordLabel(selectedNotes)
  const chordDisplay = currentLabel || 'Click keys to build a chord'

  function addChord() {
    if (selectedNotes.length === 0) return
    setProgression((prev) => [
      ...prev,
      { id: crypto.randomUUID(), label: currentLabel, notes: selectedNotes },
    ])
  }

  function removeChord(id) {
    setProgression((prev) => prev.filter((chord) => chord.id !== id))
  }

  return (
    <div id="app">
      <h1>Pianograph</h1>
      <p className="chord-display">{chordDisplay}</p>
      <button
        type="button"
        className="add-chord-button"
        onClick={addChord}
        disabled={selectedNotes.length === 0}
      >
        Add chord
      </button>
      <Piano onNotesChange={setSelectedNotes} />
      <Progression chords={progression} onRemove={removeChord} />
    </div>
  )
}

export default App
