import './SectionMarker.css'

function SectionMarker({ name, onMoveLeft, onMoveRight, onRemove, isFirst, isLast }) {
  return (
    <div className="section-marker">
      <div className="section-marker-actions">
        <button
          type="button"
          onClick={onMoveLeft}
          disabled={isFirst}
          aria-label={`Move section ${name} left`}
        >
          ←
        </button>
        <button
          type="button"
          onClick={onMoveRight}
          disabled={isLast}
          aria-label={`Move section ${name} right`}
        >
          →
        </button>
        <button type="button" onClick={onRemove} aria-label={`Remove section ${name}`}>
          ×
        </button>
      </div>
      <div className="section-marker-name">{name}</div>
    </div>
  )
}

export default SectionMarker
