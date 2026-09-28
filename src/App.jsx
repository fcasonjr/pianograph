import { useEffect, useState } from 'react'
import Piano from './components/Piano/Piano'
import Progression from './components/Progression/Progression'
import LeadSheet from './components/LeadSheet/LeadSheet'
import { chordLabel } from './utils/chordDetection'
import { playChord, playProgression } from './utils/audio'
import { loadProgression, saveProgression } from './utils/storage'
import { exportProgressionAsJson, exportProgressionAsText } from './utils/exportProgression'
import './App.css'

function App() {
  const [selectedNotes, setSelectedNotes] = useState([])
  const [progression, setProgression] = useState(() => loadProgression())
  const [tempo, setTempo] = useState(120)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playingChordId, setPlayingChordId] = useState(null)
  const [sectionName, setSectionName] = useState('')
  const [view, setView] = useState('builder')

  useEffect(() => {
    saveProgression(progression)
  }, [progression])

  const currentLabel = chordLabel(selectedNotes)
  const chordDisplay = currentLabel || 'Click keys to build a chord'

  function addChord() {
    if (selectedNotes.length === 0) return
    setProgression((prev) => [
      ...prev,
      { id: crypto.randomUUID(), type: 'chord', label: currentLabel, notes: selectedNotes, beats: 4 },
    ])
  }

  function addSection() {
    const name = sectionName.trim()
    if (!name) return
    setProgression((prev) => [...prev, { id: crypto.randomUUID(), type: 'section', name }])
    setSectionName('')
  }

  function setChordBeats(id, beats) {
    setProgression((prev) =>
      prev.map((entry) => (entry.id === id ? { ...entry, beats } : entry)),
    )
  }

  function removeChord(id) {
    setProgression((prev) => prev.filter((chord) => chord.id !== id))
  }

  function moveChord(id, direction) {
    setProgression((prev) => {
      const index = prev.findIndex((chord) => chord.id === id)
      const targetIndex = index + direction
      if (index === -1 || targetIndex < 0 || targetIndex >= prev.length) return prev
      const next = [...prev]
      ;[next[index], next[targetIndex]] = [next[targetIndex], next[index]]
      return next
    })
  }

  function duplicateChord(id) {
    setProgression((prev) => {
      const index = prev.findIndex((chord) => chord.id === id)
      if (index === -1) return prev
      const copy = { ...prev[index], id: crypto.randomUUID() }
      const next = [...prev]
      next.splice(index + 1, 0, copy)
      return next
    })
  }

  function clearProgression() {
    setProgression([])
  }

  function handlePlayChord(notes) {
    if (isPlaying) return
    playChord(notes)
  }

  async function handlePlayProgression() {
    if (isPlaying || progression.length === 0) return
    setIsPlaying(true)
    const totalMs = await playProgression(progression, tempo, {
      onStepChange: setPlayingChordId,
    })
    setTimeout(() => {
      setIsPlaying(false)
      setPlayingChordId(null)
    }, totalMs)
  }

  return (
    <div id="app">
      <h1>Pianograph</h1>

      <button
        type="button"
        className="view-toggle-button no-print"
        onClick={() => setView(view === 'builder' ? 'leadsheet' : 'builder')}
      >
        {view === 'builder' ? 'View leadsheet' : 'Back to builder'}
      </button>

      {view === 'leadsheet' ? (
        <LeadSheet progression={progression} />
      ) : (
        <>
          <p className="chord-display">{chordDisplay}</p>
          <button
            type="button"
            className="add-chord-button"
            onClick={addChord}
            disabled={selectedNotes.length === 0}
          >
            Add chord
          </button>

          <div className="section-controls">
            <input
              type="text"
              className="section-name-input"
              placeholder="Section name (e.g. A)"
              value={sectionName}
              onChange={(e) => setSectionName(e.target.value)}
            />
            <button type="button" onClick={addSection} disabled={!sectionName.trim()}>
              Add section
            </button>
          </div>

          <Piano onNotesChange={setSelectedNotes} />

          <div className="progression-controls">
            <button
              type="button"
              className="play-progression-button"
              onClick={handlePlayProgression}
              disabled={isPlaying || progression.length === 0}
            >
              ▶ Play progression
            </button>
            <label className="tempo-control">
              Tempo
              <input
                type="number"
                min={40}
                max={300}
                value={tempo}
                onChange={(e) => setTempo(Number(e.target.value))}
              />
              BPM
            </label>
          </div>

          <Progression
            chords={progression}
            onRemove={removeChord}
            onMove={moveChord}
            onDuplicate={duplicateChord}
            onSetBeats={setChordBeats}
            onPlayChord={handlePlayChord}
            playDisabled={isPlaying}
            playingChordId={playingChordId}
          />

          <div className="progression-actions">
            <button
              type="button"
              onClick={clearProgression}
              disabled={progression.length === 0}
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => exportProgressionAsJson(progression)}
              disabled={progression.length === 0}
            >
              Export JSON
            </button>
            <button
              type="button"
              onClick={() => exportProgressionAsText(progression)}
              disabled={progression.length === 0}
            >
              Export text
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default App
