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
          Use ← → to reorder, ⧉ to copy a chord, and × to remove it. The number chips (and − / +, in half-beat steps) set how many beats a
          chord lasts, so two short chords can share one measure. The time signature is next to Tempo; for a bar that differs from it (say, one 2/4 bar), use the Meter menu on the first chord of that bar and again on the chord after it to switch back.
        </p>
        <p>
          Click a chord's name or diagram on its card to <strong>edit it</strong> — its notes load onto
          the keyboard, with the card outlined to show which one. Adjust the notes and press{' '}
          <strong>Save changes</strong> to update that same chord in place, or <strong>Cancel</strong> to
          back out. Its position, length, and repeat marks stay as they were.
        </p>

        <h3>Sections and repeats</h3>
        <p>
          <strong>Add section</strong> appends an A/B/bridge label; the § button on a chord starts one right
          before it, and clicking a section name renames it. On each chord, <strong>|:</strong> and{' '}
          <strong>:|</strong> mark a repeat, and <strong>1.</strong> / <strong>2.</strong> mark first and
          second endings — marking <strong>1.</strong> loops back on its own, so <strong>:|</strong> is
          only needed for a repeat with no endings. Play progression follows the repeats, and you can{' '}
          <strong>Pause</strong> and{' '}
          <strong>Resume</strong> it mid-song, or <strong>Stop</strong> to rewind to the start. Each
          section also has its own ▶ to play from there to the end.
        </p>

        <h3>Song form</h3>
        <p>
          With two or more sections, a <strong>Song form</strong> box lets you play them in any order —
          A, B1, A, B2, A — without duplicating chords. Tap a section to add it to the order (tap again
          to repeat it), then <strong>▶ Play form</strong>. A section with 1st/2nd endings shows three
          taps instead of one — as written, 1st, or 2nd — so you can play the same section twice with a
          different ending each time, e.g. A · 1st → B → A · 2nd → B. The order is saved with the song.
        </p>

        <h3>Print or share the lead sheet</h3>
        <p>
          Open the <strong>Lead sheet</strong> tab. Give the song a title first, then use{' '}
          <strong>Print / Save as PDF</strong>, <strong>Download PNG</strong>, or on an iPad or phone{' '}
          <strong>Share</strong> to send the image. Tick <strong>Handwritten chord names</strong> for a
          hand-copied fake-book look — it's remembered, and easy to switch back off.
        </p>

        <h3>Saving</h3>
        <p>
          Your work is saved automatically, but only in this browser on this device. <strong>Save as
          file</strong> keeps a version you can reopen with <strong>Open file</strong> — on this device,
          another one, or later after changes. Give a song a different name before saving to keep
          variations (say, a simplified voicing) as their own separate files rather than overwriting the
          original.
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
