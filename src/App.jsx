import { useEffect, useRef, useState } from 'react'
import Piano from './components/Piano/Piano'
import Progression from './components/Progression/Progression'
import LeadSheet from './components/LeadSheet/LeadSheet'
import { chordLabel } from './utils/chordDetection'
import { playChord, playProgression } from './utils/audio'
import {
  loadBeatsPerMeasure,
  loadPreferences,
  loadProgression,
  loadTitle,
  saveBeatsPerMeasure,
  savePreferences,
  saveProgression,
  saveTitle,
} from './utils/storage'
import { parseImportedSong } from './utils/importProgression'
import { TIME_SIGNATURE_OPTIONS } from './constants'
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
  const [accidentals, setAccidentals] = useState(() => loadPreferences().accidentals)
  const [title, setTitle] = useState(() => loadTitle())
  const [beatsPerMeasure, setBeatsPerMeasure] = useState(() => loadBeatsPerMeasure())
  const [importError, setImportError] = useState('')
  const fileInputRef = useRef(null)
  const [clearSignal, setClearSignal] = useState(0)

  useEffect(() => {
    saveProgression(progression)
  }, [progression])

  useEffect(() => {
    saveTitle(title)
    // Browsers use the page title as the default filename when saving a print as PDF.
    document.title = title.trim() ? `${title.trim()} – Pianograph` : 'Pianograph'
  }, [title])

  const currentLabel = chordLabel(selectedNotes, accidentals)
  const chordDisplay = currentLabel || 'Click keys to build a chord'

  function changeAccidentals(next) {
    setAccidentals(next)
    savePreferences({ accidentals: next })
    setProgression((prev) =>
      prev.map((entry) =>
        entry.type === 'section' ? entry : { ...entry, label: chordLabel(entry.notes, next) },
      ),
    )
  }

  function changeBeatsPerMeasure(next) {
    const previous = beatsPerMeasure
    setBeatsPerMeasure(next)
    saveBeatsPerMeasure(next)
    // Chords that filled exactly one measure keep filling one measure; other lengths are left alone.
    setProgression((prev) =>
      prev.map((entry) =>
        entry.type === 'chord' && entry.beats === previous ? { ...entry, beats: next } : entry,
      ),
    )
  }

  function addChord() {
    if (selectedNotes.length === 0) return
    setProgression((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        type: 'chord',
        label: currentLabel,
        notes: selectedNotes,
        beats: beatsPerMeasure,
      },
    ])
  }

  function addSection() {
    const name = sectionName.trim()
    if (!name) return
    setProgression((prev) => [...prev, { id: crypto.randomUUID(), type: 'section', name }])
    setSectionName('')
  }

  function updateChord(id, patch) {
    setProgression((prev) =>
      prev.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)),
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
      // A copy keeps its ending (copying a 2-bar ending is useful) but not its repeat barlines.
      const copy = { ...prev[index], id: crypto.randomUUID(), repeatStart: false, repeatEnd: false }
      const next = [...prev]
      next.splice(index + 1, 0, copy)
      return next
    })
  }

  async function handleImportFile(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      const song = parseImportedSong(await file.text(), accidentals)
      if (
        progression.length > 0 &&
        !window.confirm('Replace your current progression and title with the imported file?')
      ) {
        return
      }
      setProgression(song.progression)
      setTitle(song.title)
      setBeatsPerMeasure(song.beatsPerMeasure)
      saveBeatsPerMeasure(song.beatsPerMeasure)
      setImportError('')
    } catch (error) {
      setImportError(`Couldn't import: ${error.message}`)
    }
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
      <header className="app-header no-print">
        <h1 className="app-title">
          Piano<span>graph</span>
        </h1>
        <div className="header-controls">
          <div className="tabs" role="radiogroup" aria-label="Accidentals">
            <button
              type="button"
              role="radio"
              aria-checked={accidentals === 'sharps'}
              className={`tab ${accidentals === 'sharps' ? 'active' : ''}`}
              onClick={() => changeAccidentals('sharps')}
            >
              ♯ Sharps
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={accidentals === 'flats'}
              className={`tab ${accidentals === 'flats' ? 'active' : ''}`}
              onClick={() => changeAccidentals('flats')}
            >
              ♭ Flats
            </button>
          </div>
          <div className="tabs" role="tablist" aria-label="View">
            <button
              type="button"
              role="tab"
              aria-selected={view === 'builder'}
              className={`tab ${view === 'builder' ? 'active' : ''}`}
              onClick={() => setView('builder')}
            >
              Builder
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={view === 'leadsheet'}
              className={`tab ${view === 'leadsheet' ? 'active' : ''}`}
              onClick={() => setView('leadsheet')}
            >
              Lead sheet
            </button>
          </div>
        </div>
      </header>

      {view === 'leadsheet' ? (
        <LeadSheet progression={progression} title={title} beatsPerMeasure={beatsPerMeasure} />
      ) : (
        <>
          <section className="panel compose-panel">
            <div className="panel-head">
              <p className={`chord-display ${currentLabel ? '' : 'is-empty'}`}>{chordDisplay}</p>
              <div className="compose-actions">
                <button
                  type="button"
                  className="btn btn-secondary clear-keyboard-button"
                  onClick={() => setClearSignal((n) => n + 1)}
                  disabled={selectedNotes.length === 0}
                >
                  Clear keyboard
                </button>
                <button
                  type="button"
                  className="btn btn-primary add-chord-button"
                  onClick={addChord}
                  disabled={selectedNotes.length === 0}
                >
                  Add chord
                </button>
              </div>
            </div>
            <Piano onNotesChange={setSelectedNotes} clearSignal={clearSignal} />
          </section>

          <section className="panel">
            <div className="panel-head">
              <input
                type="text"
                className="input song-title-input"
                aria-label="Song title"
                placeholder="Song title (optional)"
                maxLength={120}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <div className="progression-actions">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={clearProgression}
                  disabled={progression.length === 0}
                >
                  Clear
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Import JSON
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  hidden
                  onChange={handleImportFile}
                />
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => exportProgressionAsJson(progression, title, beatsPerMeasure)}
                  disabled={progression.length === 0}
                >
                  Export JSON
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => exportProgressionAsText(progression, title)}
                  disabled={progression.length === 0}
                >
                  Export text
                </button>
              </div>
            </div>

            {importError && (
              <p className="import-error" role="alert">
                {importError}
              </p>
            )}

            <div className="toolbar">
              <div className="progression-controls">
                <button
                  type="button"
                  className="btn btn-primary play-progression-button"
                  onClick={handlePlayProgression}
                  disabled={isPlaying || progression.length === 0}
                >
                  ▶ Play progression
                </button>
                <label className="tempo-control">
                  Tempo
                  <input
                    type="number"
                    className="input"
                    min={40}
                    max={300}
                    value={tempo}
                    onChange={(e) => setTempo(Number(e.target.value))}
                  />
                  BPM
                </label>
                <label className="tempo-control">
                  Time
                  <select
                    className="input"
                    aria-label="Time signature"
                    value={beatsPerMeasure}
                    onChange={(e) => changeBeatsPerMeasure(Number(e.target.value))}
                  >
                    {TIME_SIGNATURE_OPTIONS.map((n) => (
                      <option key={n} value={n}>
                        {n}/4
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="section-controls">
                <input
                  type="text"
                  className="input section-name-input"
                  placeholder="Section name (e.g. A)"
                  value={sectionName}
                  onChange={(e) => setSectionName(e.target.value)}
                />
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={addSection}
                  disabled={!sectionName.trim()}
                >
                  Add section
                </button>
              </div>
            </div>

            <Progression
              chords={progression}
              onRemove={removeChord}
              onMove={moveChord}
              onDuplicate={duplicateChord}
              onUpdate={updateChord}
              beatsPerMeasure={beatsPerMeasure}
              onPlayChord={handlePlayChord}
              playDisabled={isPlaying}
              playingChordId={playingChordId}
            />
          </section>
        </>
      )}
    </div>
  )
}

export default App
