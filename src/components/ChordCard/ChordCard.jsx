import PianoDiagram from '../PianoDiagram/PianoDiagram'
import './ChordCard.css'

function ChordCard({
  label,
  notes,
  beats,
  onSetBeats,
  onRemove,
  onMoveLeft,
  onMoveRight,
  onDuplicate,
  isFirst,
  isLast,
  onPlay,
  playDisabled,
  isPlaying,
}) {
  return (
    <div className={`chord-card ${isPlaying ? 'playing' : ''}`}>
      <div className="chord-card-actions">
        <button
          type="button"
          onClick={onPlay}
          disabled={playDisabled}
          aria-label={`Play ${label}`}
        >
          ▶
        </button>
        <button
          type="button"
          onClick={onMoveLeft}
          disabled={isFirst}
          aria-label={`Move ${label} left`}
        >
          ←
        </button>
        <button
          type="button"
          onClick={onMoveRight}
          disabled={isLast}
          aria-label={`Move ${label} right`}
        >
          →
        </button>
        <button type="button" onClick={onDuplicate} aria-label={`Duplicate ${label}`}>
          ⧉
        </button>
        <button type="button" onClick={onRemove} aria-label={`Remove ${label}`}>
          ×
        </button>
      </div>
      <div className="chord-card-name">{label}</div>
      <PianoDiagram notes={notes} />
      <div className="chord-card-beats">
        <button
          type="button"
          onClick={() => onSetBeats(Math.max(1, beats - 1))}
          aria-label={`Decrease beats for ${label}`}
        >
          −
        </button>
        <span>
          {beats} beat{beats === 1 ? '' : 's'}
        </span>
        <button
          type="button"
          onClick={() => onSetBeats(Math.min(32, beats + 1))}
          aria-label={`Increase beats for ${label}`}
        >
          +
        </button>
      </div>
    </div>
  )
}

export default ChordCard
