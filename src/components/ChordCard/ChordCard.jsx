import PianoDiagram from '../PianoDiagram/PianoDiagram'
import { beatPresets } from '../../utils/beats'
import { MAX_CHORD_BEATS } from '../../constants'
import './ChordCard.css'

function ChordCard({
  label,
  notes,
  beats,
  beatsPerMeasure,
  startsSection,
  onStartSection,
  onSetBeats,
  onSetMarks,
  repeatStart,
  repeatEnd,
  ending,
  onRemove,
  onMoveLeft,
  onMoveRight,
  onDuplicate,
  isFirst,
  isLast,
  onPlay,
  playDisabled,
  isPlaying,
  onEdit,
  isEditing,
}) {
  return (
    <div className={`chord-card ${isPlaying ? 'playing' : ''} ${isEditing ? 'editing' : ''}`}>
      <button
        type="button"
        className="icon-btn chord-card-section"
        onClick={onStartSection}
        disabled={startsSection}
        aria-label={`Start a section before ${label}`}
        title={startsSection ? 'This chord already starts a section' : 'Start a section here'}
      >
        §
      </button>
      <button
        type="button"
        className="chord-card-edit"
        onClick={onEdit}
        title="Edit this chord's notes on the keyboard"
        aria-label={`Edit ${label}`}
      >
        <span className="chord-card-name">{label}</span>
        <PianoDiagram notes={notes} />
      </button>
      <div className="beat-presets" role="group" aria-label={`Length of ${label}`}>
        {beatPresets(beatsPerMeasure).map((preset) => (
          <button
            key={preset}
            type="button"
            className={`beat-preset ${beats === preset ? 'active' : ''}`}
            aria-pressed={beats === preset}
            aria-label={`Set ${label} to ${preset} beat${preset === 1 ? '' : 's'}`}
            onClick={() => onSetBeats(preset)}
          >
            {preset}
          </button>
        ))}
      </div>
      <div className="chord-card-beats">
        <button
          type="button"
          className="icon-btn"
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
          className="icon-btn"
          onClick={() => onSetBeats(Math.min(MAX_CHORD_BEATS, beats + 1))}
          aria-label={`Increase beats for ${label}`}
        >
          +
        </button>
      </div>
      <div className="beat-presets chord-marks" role="group" aria-label={`Repeat marks for ${label}`}>
        <button
          type="button"
          className={`beat-preset mark-chip ${repeatStart ? 'active' : ''}`}
          aria-pressed={!!repeatStart}
          aria-label={`Repeat start before ${label}`}
          title="Repeat start"
          onClick={() => onSetMarks({ repeatStart: !repeatStart })}
        >
          |:
        </button>
        <button
          type="button"
          className={`beat-preset mark-chip ${repeatEnd ? 'active' : ''}`}
          aria-pressed={!!repeatEnd}
          aria-label={`Repeat end after ${label}`}
          title="Repeat end"
          onClick={() => onSetMarks({ repeatEnd: !repeatEnd })}
        >
          :|
        </button>
        {[1, 2].map((number) => (
          <button
            key={number}
            type="button"
            className={`beat-preset mark-chip ${ending === number ? 'active' : ''}`}
            aria-pressed={ending === number}
            aria-label={`${number === 1 ? 'First' : 'Second'} ending for ${label}`}
            title={`${number === 1 ? 'First' : 'Second'} ending`}
            onClick={() => onSetMarks({ ending: ending === number ? null : number })}
          >
            {number}.
          </button>
        ))}
      </div>
      <div className="chord-card-actions">
        <button
          type="button"
          className="icon-btn chord-card-play"
          onClick={onPlay}
          disabled={playDisabled}
          aria-label={`Play ${label}`}
        >
          ▶
        </button>
        <button
          type="button"
          className="icon-btn"
          onClick={onMoveLeft}
          disabled={isFirst}
          aria-label={`Move ${label} left`}
        >
          ←
        </button>
        <button
          type="button"
          className="icon-btn"
          onClick={onMoveRight}
          disabled={isLast}
          aria-label={`Move ${label} right`}
        >
          →
        </button>
        <button
          type="button"
          className="icon-btn"
          onClick={onDuplicate}
          aria-label={`Duplicate ${label}`}
        >
          ⧉
        </button>
        <button
          type="button"
          className="icon-btn"
          onClick={onRemove}
          aria-label={`Remove ${label}`}
        >
          ×
        </button>
      </div>
    </div>
  )
}

export default ChordCard
