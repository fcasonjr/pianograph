import { useEffect, useRef, useState } from 'react'
import Piano from './components/Piano/Piano'
import Progression from './components/Progression/Progression'
import LeadSheet from './components/LeadSheet/LeadSheet'
import HelpDialog from './components/HelpDialog/HelpDialog'
import { chordLabel } from './utils/chordDetection'
import { loadPiano, playChord, playProgression } from './utils/audio'
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
import { parseImportedMidi } from './utils/importMidi'
import { searchChord } from './utils/chordSearch'
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
  const [midiAutoAdd, setMidiAutoAdd] = useState(() => loadPreferences().midiAutoAdd)
  const [title, setTitle] = useState(() => loadTitle())
  const [beatsPerMeasure, setBeatsPerMeasure] = useState(() => loadBeatsPerMeasure())
  const [importError, setImportError] = useState('')
  const fileInputRef = useRef(null)
  const midiInputRef = useRef(null)
  const [clearSignal, setClearSignal] = useState(0)
  const [chordSearchQuery, setChordSearchQuery] = useState('')
  const [chordSearchMerge, setChordSearchMerge] = useState(false)
  const [chordSearchError, setChordSearchError] = useState('')
  const [applyPayload, setApplyPayload] = useState({ notes: null, mode: 'replace' })
  const [applySignal, setApplySignal] = useState(0)
  const [editingChordId, setEditingChordId] = useState(null)
  const composePanelRef = useRef(null)

  useEffect(() => {
    // Start fetching the piano samples now so they're ready by the first note.
    loadPiano()
  }, [])

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
    savePreferences({ accidentals: next, midiAutoAdd })
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

  // Shared by the Add chord/Save changes button and the MIDI hands-free path: saves the keyboard's
  // current notes either as a brand new chord, or back into the chord being edited (keeping its beats
  // and repeat marks — only its notes and label change).
  function commitChord() {
    if (selectedNotes.length === 0) return
    if (editingChordId) {
      updateChord(editingChordId, { notes: selectedNotes, label: currentLabel })
      setEditingChordId(null)
    } else {
      addChord()
    }
  }

  // Loads a saved chord's notes onto the keyboard to adjust by hand; Save changes then writes them
  // back into that same card instead of adding a new one.
  function startEditChord(id) {
    const entry = progression.find((chord) => chord.id === id && chord.type === 'chord')
    if (!entry) return
    setApplyPayload({ notes: entry.notes, mode: 'replace' })
    setApplySignal((n) => n + 1)
    setEditingChordId(id)
    setChordSearchError('')
    composePanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function cancelEditChord() {
    setEditingChordId(null)
  }

  function changeMidiAutoAdd(next) {
    setMidiAutoAdd(next)
    savePreferences({ accidentals, midiAutoAdd: next })
  }

  // Wipes both the keyboard and any leftover chord-search text/error, so the search box doesn't go
  // stale next to an empty keyboard. Shared by the Clear keyboard button and the MIDI hands-free path.
  function clearKeyboard() {
    setClearSignal((n) => n + 1)
    setChordSearchQuery('')
    setChordSearchError('')
  }

  // The MIDI keyboard's hands-free path (auto-add on release, sustain pedal): add the chord, then wipe the
  // keyboard so the next chord starts fresh. The Add chord button leaves the selection alone.
  function commitMidiChord() {
    if (selectedNotes.length === 0) return
    commitChord()
    clearKeyboard()
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
    if (id === editingChordId) setEditingChordId(null)
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

  async function applyImportedSong(song) {
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
    setEditingChordId(null)
  }

  async function handleImportFile(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      await applyImportedSong(parseImportedSong(await file.text(), accidentals))
    } catch (error) {
      setImportError(`Couldn't import: ${error.message}`)
    }
  }

  async function handleImportMidiFile(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      await applyImportedSong(await parseImportedMidi(file, accidentals))
    } catch (error) {
      setImportError(`Couldn't import: ${error.message}`)
    }
  }

  // First letter A-Z not already used as a section name, so inserting before the start suggests "A".
  function suggestSectionName() {
    const used = new Set(
      progression.filter((e) => e.type === 'section').map((e) => e.name.trim().toUpperCase()),
    )
    return [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'].find((letter) => !used.has(letter)) ?? ''
  }

  function startSectionBefore(id) {
    const name = window.prompt('Section name', suggestSectionName())?.trim().slice(0, 40)
    if (!name) return
    setProgression((prev) => {
      const index = prev.findIndex((entry) => entry.id === id)
      if (index === -1) return prev
      const next = [...prev]
      next.splice(index, 0, { id: crypto.randomUUID(), type: 'section', name })
      return next
    })
  }

  function renameSection(id) {
    const current = progression.find((entry) => entry.id === id)
    const name = window.prompt('Section name', current?.name ?? '')?.trim().slice(0, 40)
    if (!name) return
    setProgression((prev) => prev.map((entry) => (entry.id === id ? { ...entry, name } : entry)))
  }

  function clearProgression() {
    setProgression([])
    setTitle('')
    setEditingChordId(null)
  }

  function handleChordSearch(event) {
    event.preventDefault()
    const query = chordSearchQuery.trim()
    if (!query) return
    try {
      const notes = searchChord(query)
      setApplyPayload({ notes, mode: chordSearchMerge ? 'merge' : 'replace' })
      setApplySignal((n) => n + 1)
      setChordSearchError('')
      if (!isPlaying) playChord(notes)
    } catch (error) {
      setChordSearchError(error.message)
    }
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
          <HelpDialog />
        </div>
      </header>

      {view === 'leadsheet' ? (
        <LeadSheet progression={progression} title={title} beatsPerMeasure={beatsPerMeasure} />
      ) : (
        <>
          <section className="panel compose-panel" ref={composePanelRef}>
            {editingChordId && (
              <p className="editing-banner">
                Editing a saved chord — adjust the notes, then Save changes.
              </p>
            )}
            <div className="panel-head">
              <p className={`chord-display ${currentLabel ? '' : 'is-empty'}`}>{chordDisplay}</p>
              <div className="compose-actions">
                <button
                  type="button"
                  className="btn btn-secondary clear-keyboard-button"
                  onClick={clearKeyboard}
                  disabled={selectedNotes.length === 0}
                >
                  Clear keyboard
                </button>
                {editingChordId && (
                  <button type="button" className="btn btn-ghost" onClick={cancelEditChord}>
                    Cancel
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-primary add-chord-button"
                  onClick={commitChord}
                  disabled={selectedNotes.length === 0}
                >
                  {editingChordId ? 'Save changes' : 'Add chord'}
                </button>
              </div>
            </div>
            <form className="chord-search" onSubmit={handleChordSearch}>
              <input
                type="text"
                className="input chord-search-input"
                placeholder="Search a chord, e.g. Ebmaj7"
                aria-label="Chord search"
                value={chordSearchQuery}
                onChange={(event) => {
                  setChordSearchQuery(event.target.value)
                  setChordSearchError('')
                }}
              />
              <button type="submit" className="btn btn-secondary" disabled={!chordSearchQuery.trim()}>
                Search
              </button>
              <label className="chord-search-merge">
                <input
                  type="checkbox"
                  checked={chordSearchMerge}
                  onChange={(event) => setChordSearchMerge(event.target.checked)}
                />
                Add to keyboard
              </label>
            </form>
            {chordSearchError && <p className="chord-search-error">{chordSearchError}</p>}
            <Piano
              onNotesChange={setSelectedNotes}
              clearSignal={clearSignal}
              applySignal={applySignal}
              applyNotes={applyPayload.notes}
              applyMode={applyPayload.mode}
              midiAutoAdd={midiAutoAdd}
              onMidiAutoAddChange={changeMidiAutoAdd}
              onMidiCommit={commitMidiChord}
            />
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
                  onClick={() => midiInputRef.current?.click()}
                >
                  Import MIDI
                </button>
                <input
                  ref={midiInputRef}
                  type="file"
                  accept=".mid,.midi,audio/midi,audio/x-midi"
                  hidden
                  onChange={handleImportMidiFile}
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
              onStartSection={startSectionBefore}
              onRenameSection={renameSection}
              beatsPerMeasure={beatsPerMeasure}
              onPlayChord={handlePlayChord}
              playDisabled={isPlaying}
              playingChordId={playingChordId}
              onEditChord={startEditChord}
              editingChordId={editingChordId}
            />
          </section>
        </>
      )}

      <p className="app-credit no-print">
        Piano sound: Salamander Grand Piano by Alexander Holm (CC BY 3.0)
      </p>
    </div>
  )
}

export default App
