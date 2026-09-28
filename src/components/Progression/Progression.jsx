import ChordCard from '../ChordCard/ChordCard'
import SectionMarker from '../SectionMarker/SectionMarker'
import './Progression.css'

function Progression({
  chords,
  onRemove,
  onMove,
  onDuplicate,
  onSetBeats,
  beatsPerMeasure,
  onPlayChord,
  playDisabled,
  playingChordId,
}) {
  if (chords.length === 0) {
    return <p className="progression-empty">Your progression will appear here</p>
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
            onSetBeats={(beats) => onSetBeats(entry.id, beats)}
            onRemove={() => onRemove(entry.id)}
            onMoveLeft={() => onMove(entry.id, -1)}
            onMoveRight={() => onMove(entry.id, 1)}
            onDuplicate={() => onDuplicate(entry.id)}
            isFirst={isFirst}
            isLast={isLast}
            onPlay={() => onPlayChord(entry.notes)}
            playDisabled={playDisabled}
            isPlaying={entry.id === playingChordId}
          />
        )
      })}
    </div>
  )
}

export default Progression
