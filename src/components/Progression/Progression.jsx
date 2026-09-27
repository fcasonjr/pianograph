import ChordCard from '../ChordCard/ChordCard'
import './Progression.css'

function Progression({ chords, onRemove }) {
  if (chords.length === 0) {
    return <p className="progression-empty">Your progression will appear here</p>
  }

  return (
    <div className="progression">
      {chords.map((chord) => (
        <ChordCard
          key={chord.id}
          label={chord.label}
          notes={chord.notes}
          onRemove={() => onRemove(chord.id)}
        />
      ))}
    </div>
  )
}

export default Progression
