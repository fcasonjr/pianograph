import './SongForm.css'

// Lets you play sections in whatever order you like (A, B1, A, B2, A) without duplicating any chords —
// each tap appends a section to the order; Play form concatenates those sections (each with its own
// repeats and endings intact) and plays them as one run. Only shown once there's more than one section,
// since a form needs at least two to mean anything.
function SongForm({ sections, order, onAdd, onRemoveStep, onClear, onPlay, playDisabled }) {
  if (sections.length < 2) return null

  const sectionName = (id) => sections.find((section) => section.id === id)?.name ?? '?'

  return (
    <div className="song-form">
      <div className="song-form-head">
        <span className="panel-title">Song form</span>
        <p className="song-form-hint">Tap sections to build a play order, then Play form.</p>
      </div>

      <div className="song-form-chips" role="group" aria-label="Sections">
        {sections.map((section) => (
          <button
            key={section.id}
            type="button"
            className="song-form-chip"
            onClick={() => onAdd(section.id)}
          >
            + {section.name}
          </button>
        ))}
      </div>

      {order.length > 0 && (
        <div className="song-form-order" aria-label="Play order">
          {order.map((id, index) => (
            <span key={index} className="song-form-step">
              {index > 0 && (
                <span className="song-form-arrow" aria-hidden="true">
                  →
                </span>
              )}
              <span className="song-form-step-name">{sectionName(id)}</span>
              <button
                type="button"
                className="song-form-step-remove"
                onClick={() => onRemoveStep(index)}
                aria-label={`Remove step ${index + 1} (${sectionName(id)}) from the play order`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="song-form-actions">
        <button
          type="button"
          className="btn btn-primary"
          onClick={onPlay}
          disabled={playDisabled || order.length === 0}
        >
          ▶ Play form
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={onClear}
          disabled={order.length === 0}
        >
          Clear form
        </button>
      </div>
    </div>
  )
}

export default SongForm
