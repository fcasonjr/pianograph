import ChordCard from '../ChordCard/ChordCard'
import SectionMarker from '../SectionMarker/SectionMarker'
import './Progression.css'

function Progression({
  chords,
  onRemove,
  onMove,
  onDuplicate,
  onUpdate,
  onStartSection,
  onRenameSection,
  beatsPerMeasure,
  onPlayChord,
  playDisabled,
  playingChordId,
  onEditChord,
  editingChordId,
}) {
  if (chords.length === 0) {
    return (
      <div className="progression-empty">
        <p className="progression-empty-title">Your progression will appear here</p>
        <ol className="progression-empty-steps">
          <li>Click piano keys above to build a chord.</li>
          <li>Press Add chord to save it here.</li>
          <li>Repeat, then open the Lead sheet tab to print or share.</li>
        </ol>
        <p className="progression-empty-note">Use the ? button at the top for more tips.</p>
      </div>
    )
  }

  return (
    <div className="progression">
      {chords.map((entry, index) => {
        const isFirst = index === 0
        const isLast = index === chords.length - 1

        if (entry.type === 'section') {
          return (
            <SectionMarker
              key={entry.id}
              name={entry.name}
              onRename={() => onRenameSection(entry.id)}
              onMoveLeft={() => onMove(entry.id, -1)}
              onMoveRight={() => onMove(entry.id, 1)}
              onRemove={() => onRemove(entry.id)}
              isFirst={isFirst}
              isLast={isLast}
            />
          )
        }

        return (
          <ChordCard
            key={entry.id}
            label={entry.label}
            notes={entry.notes}
            beats={entry.beats}
            beatsPerMeasure={beatsPerMeasure}
            startsSection={chords[index - 1]?.type === 'section'}
            onStartSection={() => onStartSection(entry.id)}
            onSetBeats={(beats) => onUpdate(entry.id, { beats })}
            onSetMarks={(patch) => onUpdate(entry.id, patch)}
            repeatStart={entry.repeatStart}
            repeatEnd={entry.repeatEnd}
            ending={entry.ending}
            onRemove={() => onRemove(entry.id)}
            onMoveLeft={() => onMove(entry.id, -1)}
            onMoveRight={() => onMove(entry.id, 1)}
            onDuplicate={() => onDuplicate(entry.id)}
            isFirst={isFirst}
            isLast={isLast}
            onPlay={() => onPlayChord(entry.notes)}
            playDisabled={playDisabled}
            isPlaying={entry.id === playingChordId}
            onEdit={() => onEditChord(entry.id)}
            isEditing={entry.id === editingChordId}
          />
        )
      })}
    </div>
  )
}

export default Progression
