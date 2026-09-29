import './SectionMarker.css'

function SectionMarker({
  name,
  onRename,
  onMoveLeft,
  onMoveRight,
  onRemove,
  isFirst,
  isLast,
  onPlay,
  playDisabled,
}) {
  return (
    <div className="section-marker">
      <button
        type="button"
        className="section-marker-name"
        onClick={onRename}
        aria-label={`Rename section ${name}`}
        title="Rename section"
      >
        {name}
      </button>
      <span className="section-marker-rule" aria-hidden="true" />
      <div className="section-marker-actions">
        <button
          type="button"
          className="icon-btn"
          onClick={onPlay}
          disabled={playDisabled}
          aria-label={`Play from section ${name}`}
          title={`Play from ${name} to the end`}
        >
          ▶
        </button>
        <button
          type="button"
          className="icon-btn"
          onClick={onMoveLeft}
          disabled={isFirst}
          aria-label={`Move section ${name} left`}
        >
          ←
        </button>
        <button
          type="button"
          className="icon-btn"
          onClick={onMoveRight}
          disabled={isLast}
          aria-label={`Move section ${name} right`}
        >
          →
        </button>
        <button
          type="button"
          className="icon-btn"
          onClick={onRemove}
          aria-label={`Remove section ${name}`}
        >
          ×
        </button>
      </div>
    </div>
  )
}

export default SectionMarker
