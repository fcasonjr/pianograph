import { MAX_TRANSPOSE } from '../../constants'
import { formatTranspose } from '../../utils/transpose'
import './TransposeControl.css'

// Shifts the whole song up or down in semitones. It only changes the view (see utils/transpose.js), so
// Reset always returns to the key the chords were entered in.
function TransposeControl({ value, onChange, disabled }) {
  return (
    <div className="transpose-control" role="group" aria-label="Transpose">
      <span className="transpose-label">Transpose</span>
      <button
        type="button"
        className="icon-btn"
        onClick={() => onChange(value - 1)}
        disabled={disabled || value <= -MAX_TRANSPOSE}
        aria-label="Transpose down one semitone"
        title="Down one semitone"
      >
        −
      </button>
      <output className={`transpose-value ${value === 0 ? '' : 'is-shifted'}`} aria-live="polite">
        {formatTranspose(value)}
      </output>
      <button
        type="button"
        className="icon-btn"
        onClick={() => onChange(value + 1)}
        disabled={disabled || value >= MAX_TRANSPOSE}
        aria-label="Transpose up one semitone"
        title="Up one semitone"
      >
        +
      </button>
      <button
        type="button"
        className="btn btn-ghost"
        onClick={() => onChange(0)}
        disabled={disabled || value === 0}
        title="Back to the key the chords were entered in"
      >
        Reset
      </button>
    </div>
  )
}

export default TransposeControl
