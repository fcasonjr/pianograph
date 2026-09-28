import './SectionMarker.css'

function SectionMarker({ name, onMoveLeft, onMoveRight, onRemove, isFirst, isLast }) {
  return (
    <div className="section-marker">
      <span className="section-marker-name">{name}</span>
      <span className="section-marker-rule" aria-hidden="true" />
      <div className="section-marker-actions">
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
