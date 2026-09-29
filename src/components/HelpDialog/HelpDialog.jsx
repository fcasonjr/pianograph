import { useRef } from 'react'
import './HelpDialog.css'

function HelpDialog() {
  const dialogRef = useRef(null)

  return (
    <>
      <button
        type="button"
        className="icon-btn help-button"
        onClick={() => dialogRef.current?.showModal()}
        aria-label="Help"
        title="Help"
      >
        ?
      </button>
      <dialog
        ref={dialogRef}
        className="help-dialog"
        aria-labelledby="help-title"
        // A click on the backdrop lands on the <dialog> element itself, not on its content.
        onClick={(event) => {
          if (event.target === dialogRef.current) dialogRef.current.close()
        }}
      >
        <div className="help-head">
          <h2 id="help-title">How Pianograph works</h2>
          <button
            type="button"
            className="icon-btn"
            onClick={() => dialogRef.current?.close()}
            aria-label="Close help"
          >
            ×
          </button>
        </div>

        <h3>Build a chord</h3>
        <p>
          Click piano keys to select notes; the chord name appears above the keyboard. Press{' '}
          <strong>Add chord</strong> to save it, and <strong>Clear keyboard</strong> to start the next one.
        </p>
        <p>
          Or type a chord into the <strong>search box</strong> — a space and any capitalization are fine —
          and press <strong>Search</strong> to select its notes for you, then adjust them by hand from
          there. Tick <strong>Add to keyboard</strong> first to add the searched chord to what's already
          selected instead of replacing it.
        </p>
        <p>
          <strong>MIDI keyboard</strong> (Chrome or Edge on a computer): notes stay selected after you let
          go, so you can play with both hands. By default the chord is added a moment after you lift all
          your fingers, and the keyboard clears for the next one; untick “Add chord when I lift my hands”
          to add it yourself with the button. A sustain pedal press adds the chord too.
        </p>

        <h3>Arrange the progression</h3>
        <p>
          Use ← → to reorder, ⧉ to copy a chord, and × to remove it. The number chips set how many beats a
          chord lasts, so two short chords can share one measure. The time signature is next to Tempo.
        </p>

        <h3>Sections and repeats</h3>
        <p>
          <strong>Add section</strong> appends an A/B/bridge label; the § button on a chord starts one right
          before it, and clicking a section name renames it. On each chord, <strong>|:</strong> and{' '}
          <strong>:|</strong> mark a repeat, and <strong>1.</strong> / <strong>2.</strong> mark first and
          second endings. Play progression follows the repeats.
        </p>

        <h3>Print or share the lead sheet</h3>
        <p>
          Open the <strong>Lead sheet</strong> tab. Give the song a title first, then use{' '}
          <strong>Print / Save as PDF</strong>, <strong>Download PNG</strong>, or on an iPad or phone{' '}
          <strong>Share</strong> to send the image.
        </p>

        <h3>Saving</h3>
        <p>
          Your work is saved automatically, but only in this browser on this device. To back it up or move
          it to another device, use <strong>Export JSON</strong> and then <strong>Import JSON</strong>.
        </p>

        <h3>Importing a MIDI file</h3>
        <p>
          <strong>Import MIDI</strong> turns a file of block chords — struck together, not an expressive
          performance — straight into a progression. Check it over afterward and fix anything that came in
          wrong.
        </p>
      </dialog>
    </>
  )
}

export default HelpDialog
