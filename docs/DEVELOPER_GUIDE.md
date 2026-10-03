# Pianograph developer guide

How the code is put together, and the decisions behind it. For what the app does, see the [user guide](USER_GUIDE.md). [CLAUDE.md](../CLAUDE.md) holds the same architecture notes in the form used by AI coding assistants, and is kept in step with this guide.

- [Setup and commands](#setup-and-commands)
- [Stack](#stack)
- [The big picture](#the-big-picture)
- [Data model](#data-model)
- [Persistence and file formats](#persistence-and-file-formats)
- [Importing MIDI files](#importing-midi-files)
- [Input: keyboard, mouse, and MIDI](#input-keyboard-mouse-and-midi)
- [Chord detection](#chord-detection)
- [Audio](#audio)
- [Repeats](#repeats)
- [Song form](#song-form)
- [The lead sheet](#the-lead-sheet)
- [Image export and sharing](#image-export-and-sharing)
- [Styling](#styling)
- [Testing and verification](#testing-and-verification)
- [Deployment](#deployment)
- [Making common changes](#making-common-changes)
- [Known limitations](#known-limitations)

## Setup and commands

Requires Node 20.19+ or 22.12+.

```bash
npm install
npm run dev       # Vite dev server on http://localhost:5173
npm run build     # production build to dist/
npm run preview   # serve dist/ locally
npm run lint      # Oxlint
```

Lint currently reports one known warning, `react(refs)` on `handlersRef.current = …` in `src/hooks/useMidiInput.js`. It is the deliberate "latest callback in a ref" pattern and can be left alone. There is no test runner (see [Testing and verification](#testing-and-verification)).

## Stack

React 19 and Vite 8 in plain JavaScript (no TypeScript). Tone.js for audio, Tonal for chord detection, and html-to-image for PNG export. The staff, keyboard diagrams, and treble clef are hand-drawn SVG and CSS, since the app has chord data but no melody, so an engraving library isn't needed.

## The big picture

```
 Piano (mouse + MIDI)  ──►  App state  ──►  Progression cards  ──►  Lead sheet
   selected notes           progression       (edit the song)        │
        │                   title, meter                              ├─ print / PDF
        ▼                   preferences                               └─ PNG / share sheet
  chord detection (Tonal)          │
                                   ▼
                          audio playback (Tone.js)
```

`App.jsx` owns all song-level state and every handler that changes it; components below it are mostly presentational. State that belongs to one widget stays local: `Piano` owns the set of selected notes.

One decision shapes the whole codebase: **notes are strings in scientific pitch notation, sharp-spelled** (`"C4"`, `"D#4"`). Key ids, MIDI input, Tone.js, and Tonal all use this format directly, so there is no conversion layer. Flats appear only in displayed chord names.

### Source map

| Path | Role |
|---|---|
| `src/App.jsx` | State, handlers, header, builder view. |
| `src/components/Piano/` | Interactive keyboard, selection state, MIDI behavior. |
| `src/components/PianoDiagram/` | The read-only mini keyboard, shared by the cards and the lead sheet. |
| `src/components/ChordCard/`, `SectionMarker/`, `Progression/` | The editable progression. |
| `src/components/LeadSheet/` | Lead sheet rendering, row sizing, the image-preparation hook. |
| `src/components/HelpDialog/` | The in-app help dialog. |
| `src/hooks/useMidiInput.js` | Web MIDI subscription (notes and the sustain pedal). |
| `src/utils/` | Pure logic: detection, audio, layout, repeats, storage, import/export. |
| `src/constants.js` | Octave range, time signature options, chord length limit. |
| `public/` | Files copied as-is: the piano samples and Netlify's `_headers`. |

## Data model

The progression is one flat array of two kinds of entry, told apart by `type`:

```js
// A chord
{ id, type: 'chord', label, notes, beats,
  repeatStart?, repeatEnd?, ending? }   // ending is 1 or 2
// A section marker
{ id, type: 'section', name }
```

- `label` is the stored chord name string, so it is **recomputed** whenever the sharps/flats preference changes or a file is imported.
- `beats` is the chord's length, a multiple of `BEAT_STEP` (0.5) between 0.5 and `MAX_CHORD_BEATS`; `isValidBeats` in `utils/beats.js` is the single check used by `storage.js` and the JSON import, the card's −/+ step by `BEAT_STEP`, and MIDI import rounds to the nearest half-beat. The time signature is song-level state (`beatsPerMeasure`, the "N" in N/4), not part of any chord. A measure is not a chord: several short chords can share one. A chord can also carry an optional `meter` (a value from `TIME_SIGNATURE_OPTIONS`): a bar length that starts at that chord and holds until a later chord sets another. It is validated in `cleanMarks` like the repeat flags, so it travels through storage, import/export, and moves with the chord. `buildLeadSheetRows` resolves it into each measure's effective `meter` (carried across rows and sections, defaulting to the song-level `beatsPerMeasure`) and a `meterChange` flag; `LeadSheet.jsx`'s `barlinePositions` walks those to place barlines, and draws a time signature (HTML, like the repeat glyphs) where `meterChange` is set. Playback ignores it, since it only sums `beats`. It is a chord field rather than a separate marker entry for the same reason repeat marks are.
- Repeat marks are flags on the chord rather than separate entries. Attaching them to a chord keeps them attached when the chord moves, and keeps reordering, duplication, and removal generic over `id`. `cleanMarks` in `utils/repeats.js` is the single place that validates these fields.
- Sections and chords sit in the same array on purpose: `moveChord`, `duplicateChord`, and `removeChord` work on both without special cases. Code that must tell them apart (rendering, playback, export) checks `entry.type`.
- `id`s come from `crypto.randomUUID()` and are regenerated on import.

## Persistence and file formats

Everything persists to `localStorage` on every change, with all reads and writes wrapped in try/catch because storage can throw (private browsing, quota).

| Key | Contents |
|---|---|
| `pianograph:progression` | The entry array. |
| `pianograph:title` | Song title. |
| `pianograph:beatsPerMeasure` | 2–6. |
| `pianograph:preferences` | `{ accidentals: 'sharps' \| 'flats', midiAutoAdd: boolean }`. |
| `pianograph:playOrder` | Song form: an array of section ids (see [Song form](#song-form)). |
| `pianograph:handwrittenChords` | `'true'` or `'false'`; the lead sheet's chord-name font. |

`storage.js` normalizes older saved data (entries from before `type` or `beats` existed), so extend `normalizeEntry` if the shape changes.

**Save as file** — labeled that way in the UI, but still `exportProgressionAsJson` in `exportProgression.js`, since the underlying format and JSON file extension haven't changed — produces:

```json
{
  "title": "Misty",
  "beatsPerMeasure": 4,
  "playOrder": [{ "section": 0, "ending": 1 }, { "section": 1 }, { "section": 0, "ending": 2 }],
  "progression": [
    { "type": "section", "name": "A" },
    { "type": "chord", "label": "Ebmaj7", "notes": ["D#2", "G3", "A#3", "D4"], "beats": 4, "repeatStart": true },
    { "type": "section", "name": "B" }
  ]
}
```

Each `playOrder` step's `section` is its position among the sections in document order (0 = the first section), not an id; `ending` (1 or 2, omitted when not chosen) is which ending that visit plays — see [Song form](#song-form) for why.

**Open file** (`importProgression.js`, `parseImportedSong`) is the trust boundary. It also accepts older exports (a bare array, or no `beatsPerMeasure`, defaulting to 4/4). It validates every entry and throws `Error`s with user-facing messages, normalizes notes to sharp-spelled ids through Tonal, regenerates ids, and recomputes labels. Validation finishes before the "replace your progression?" prompt, so a bad file never asks. If you change the entry shape, update the exporter, this parser, and `normalizeEntry` together.

**Export text** is one-way: `-- A --  |  |: Cmaj7  |  [1.] Am7 :|`.

## Importing MIDI files

`utils/importMidi.js` (`parseImportedMidi`) is a second trust boundary alongside `importProgression.js`, producing the same `{ title, beatsPerMeasure, progression }` shape so `App.jsx` can hand both to one `applyImportedSong` function. It's built for **quantized block-chord files** — chords struck and released together, the shape a fake-book or chord-chart export produces — not a performance recording; see [Known limitations](#known-limitations) and the comment at the top of the file.

Parsing uses `@tonejs/midi`, which turns a standard MIDI file into tracks of notes with `ticks`/`durationTicks` already resolved against the file's own tempo map. Working in ticks (not seconds) is what makes this immune to files like a real export we tested against, which had over a hundred tiny tempo changes recorded for playback feel — none of that affects the tick-based math at all.

The algorithm, `clusterByOnset`: pool every track's notes together (a chord could in principle be split across tracks), sort by start tick, and group notes into a cluster whenever their start tick falls within `ONSET_TOLERANCE_BEATS` (1/32 beat) of the cluster's first note — this absorbs the small per-note timestamp jitter a real export can have even when musically "simultaneous". Each cluster becomes one chord; **its length is the gap to the next cluster's onset, not its own notes' durations** — deliberately, so a note released a little late (pedal bleed) doesn't shorten the next chord, and the last cluster borrows one measure since nothing bounds it. This also means a genuine rest (silence) in the middle of a file is invisibly absorbed into the chord before it, a known gap for this V1.

`beatsPerMeasureFromMidi` converts the file's time signature into a whole number of quarter-note beats (6/8 becomes 3, for example, since `ticks_per_beat`/`ppq` in a MIDI file is always ticks-per-*quarter-note* regardless of the stated denominator) and falls back to 4/4 if that isn't a whole number in `TIME_SIGNATURE_OPTIONS`. Only the file's first time signature is used, matching the app's one-time-signature-per-song model.

Chord names are recomputed with `chordLabel`, the same function used everywhere else — never trusted from the file, even though some exports (including our test file) carry a chord name as a MIDI `lyrics` meta event at each chord's start. That embedded text is unused; it can disagree with Pianograph's own naming for an inversion or a voicing missing its fifth, which is expected, not a bug.

## Input: keyboard, mouse, and MIDI

`Piano.jsx` holds the selected-note `Set` and reports it upward through `onNotesChange`. Two sources feed it:

- **Mouse and touch** toggle a key.
- **MIDI** note-on selects a key and **latches**: note-off stops the sound but does not deselect. This is what lets a player use both hands and then commit the chord without holding it. The keys physically down are tracked separately (`heldMidiNotes`).

A MIDI chord is committed by (a) the auto-add option, which fires `onMidiCommit` 350 ms after the last held key is released (the delay lets hands lift slightly apart and lets a quick re-press join the same chord; a new note-on or Clear keyboard cancels it), (b) a sustain-pedal press (CC 64), or (c) the Add chord button. `App.commitMidiChord` adds the chord and then bumps `clearSignal` so the keyboard resets. The Add chord button, by contrast, leaves the selection in place. Mouse clicks never auto-add.

Notes:

- MIDI notes outside the rendered range are ignored (`validIds`) rather than becoming selected notes with no visible key.
- `useMidiInput` keeps the latest callbacks in a ref so it doesn't unsubscribe and resubscribe on every render.
- Call `onNotesChange` from an effect, never from inside a `setState` updater, or React warns about updating a component while rendering another.
- "Clear keyboard" works by the parent incrementing a `clearSignal` prop, which `Piano` handles during render.

**Chord search** (`utils/chordSearch.js`, `searchChord`) is a fourth way to select notes, alongside mouse and MIDI, and this is really the same "set the selection" mechanism as Clear keyboard, generalized: `App` holds `applyPayload` (`{ notes, mode }`) and `applySignal` state and bumps the signal to push a new selection down; `Piano` handles it with the identical render-time-diff pattern as `clearSignal` (a second `handledApplySignal` comparison), rather than an effect. Bundling `mode` into the payload, rather than reading it live off the `chordSearchMerge` checkbox as an earlier version did, matters once there's a second producer of `applySignal` (editing a saved chord, below) that needs `'replace'` regardless of what the checkbox happens to be set to.

`searchChord` itself: `normalizeChordQuery` first tolerates natural phrasing that Tonal's own parser rejects — a trailing "chord", spelled-out quality words ("Major", "diminished", ...), English ordinal suffixes after a number ("7th" → "7"), and parentheses/commas around altered extensions ("Ab9(#11)", "C7(b9,#11)") — Tonal rejects the punctuation outright but accepts the alterations run together ("Ab9#11", "C7b9#11"), which is exactly what stripping `(`, `)`, and `,` down to nothing produces. Two entries are order-sensitive within `WORD_ALIASES`: "half diminished" (any of `half diminished`/`half-diminished`/`halfdim`, with an optional redundant trailing "7"/"7th" absorbed too, since Tonal's own type name for this chord — `half-diminished` — already has a hyphen and no space, unlike every other spelled-out quality here) must be matched *before* the plain `diminished` → `dim` rule below it, or that rule would corrupt it into the nonsensical `halfdim` first; `dominant` is similarly special-cased, dropped before a following number (the number alone already implies dominant — `dom9` isn't recognized, but `9` is) and otherwise mapped to `dom` (bare "dominant" alone means a dominant 7th). Tonal's `Chord.get` then parses the normalized symbol into note names (root-first, or bass-first for a slash chord) with no octave — it already tolerates casing and slash-bass chords natively, so those need no help. Turning those note names into specific keys is `searchChord`'s own job: each note is placed in the lowest octave that keeps it above the previous one, so the result is always a single ascending voicing starting near the middle of the keyboard (`DEFAULT_START_OCTAVE`) rather than several notes piled into the same octave. An unrecognized symbol throws a user-facing `Error`, the same convention as the import parsers. Once applied, the searched notes are ordinary selected notes — there is no persistent "this came from search" state, so adjusting them afterward is identical to having clicked them by hand.

**Editing a saved chord** reuses the same `applyPayload`/`applySignal` mechanism a third way: `ChordCard`'s name/diagram is wrapped in a button (`onEdit`) rather than the usual five-icon actions row, both because the actions row is already sized for exactly five icons (`@media (pointer: coarse)` tunes them to fit five across a card) and because the diagram, otherwise purely decorative, is a natural click target for "load this chord to edit it." `App.startEditChord(id)` pushes `{ notes: entry.notes, mode: 'replace' }`, sets `editingChordId`, and scrolls the compose panel into view (`composePanelRef`) since the card being edited is often well below the keyboard. While `editingChordId` is set, `commitChord` — used by both the Add chord/Save changes button and the MIDI hands-free path — calls `updateChord(editingChordId, { notes, label })` instead of `addChord()`, so only `notes`/`label` change; `beats` and any repeat marks on the entry are untouched, since `updateChord` merges its patch rather than replacing the entry. Cancelling just clears `editingChordId`, leaving the keyboard as-is. Anything that can invalidate the id — `removeChord` (if you delete the card you're editing), `clearProgression`, `applyImportedSong` — also clears `editingChordId`, so a stale id can never be saved into.

## Chord detection

`utils/chordDetection.js` wraps Tonal's `Chord.detect`.

- Notes are sorted low to high first, because Tonal treats the first note as the bass and click order would otherwise change slash-chord names.
- `assumePerfectFifth: true` lets voicings that omit the 5th (common in jazz) still match.
- Note ids are sharp-spelled, so they are respelled for the flats preference (`Note.fromMidi` versus `fromMidiSharps`) before detection.
- `chordLabel` is the single formatter for both the live display and each saved chord's label: empty selection, a single note, unrecognized notes ("No chord match"), or the detected names joined with ` / `.

## Audio

`utils/audio.js` plays through one instrument at a time, chosen by `getInstrument()`:

- A `Tone.Sampler` of Salamander Grand Piano recordings (17 clips, a note every minor third from C2 to C6), bundled in `public/samples/salamander/`. `App` calls `loadPiano()` on mount so the download starts early.
- A `Tone.PolySynth` as the fallback. It is used until the sampler has loaded, and permanently if loading fails.

`stopNote` releases on both instruments, because a held MIDI note may have started on the synth just before the piano finished loading.

`playProgression` schedules every chord against `Tone.Transport` — not raw `Tone.now() + offset` timestamps, an earlier approach that made pausing impossible, since a wall-clock offset has no way to account for time spent paused. Each chord is scheduled at the running total of the beats before it (`Tone.Transport.schedule((time) => instrument.triggerAttackRelease(...), offset)`) and sounds for its own length; the highlight callback is scheduled the same way, via `Tone.Draw.schedule` so the React state update lands on the right visual frame rather than firing straight from the audio-scheduling callback. The chords come from `unfoldRepeats`, so playback follows repeats and a repeated chord highlights twice. `Tone.Transport.cancel()` runs at the start of every call to clear anything left over from a run that was stopped rather than finished. Audio can only start after a user gesture, so each entry point awaits `Tone.start()`.

**Pause, resume, stop.** `pauseProgression`/`resumeProgression` are thin wrappers over `Tone.Transport.pause()`/`.start()` — Transport has its own pausable clock, so every already-scheduled event stays correctly positioned relative to it regardless of how long the pause lasts, with no manual bookkeeping of "where was I" needed. `stopProgression` is different from pause: it calls `Transport.stop()` (which also rewinds position to 0) and `Transport.cancel()`, then explicitly `releaseAll()`s both instruments — pausing alone only stops *new* notes from firing, it doesn't cut off a chord that's already mid-release. `App.jsx` mirrors this with a three-state `playbackStatus` (`'stopped' | 'playing' | 'paused'`) rather than the earlier boolean, and completion is detected via `playProgression`'s `onComplete` callback — itself scheduled on the Transport timeline via `Tone.Draw` — rather than a `setTimeout(totalMs)` on the caller's side, which would fire at the wrong wall-clock moment the first time a session paused.

**Three ways in, one player.** `App.jsx`'s `runPlayback(chords)` is the single function that flips `playbackStatus` and calls `playProgression` — "Play progression" hands it the whole `progression`, "play from this section" hands it `progression.slice(index)`, and "Play form" hands it `buildPlayOrder(progression, formOrder)` (see [Song form](#song-form) below). None of them know or care which case they're in; `playProgression` itself is unchanged by any of this.

## Repeats

`utils/repeats.js` turns the flat array into play order. A repeated block starts at the latest `repeatStart`, section marker, or previous repeat end. Each repeat end jumps back once. On the second pass, chords with `ending: 1` are skipped, so ending 2 plays next. A set of already-taken repeat ends (tracked by array index) guarantees termination on malformed input. There is no nesting, no repeat count, and no D.S./D.C./Coda.

**A first ending's own last chord always closes the repeat, whether or not `:|` was separately toggled** — `endsRepeat(progression, index)` is `entry.repeatEnd === true`, *or* `entry.ending === 1` and the next entry isn't also `ending === 1` (so a multi-chord first ending only closes at its actual end, not partway through). This was a real bug, not a design choice: before this, `ending: 1`/`ending: 2` with no explicit `:|` played both endings back to back with no repeat at all — easy to hit, since marking "1." reads as "this is a first ending" regardless of whether you remembered the separate `:|` toggle, and musically a first ending always implies the loop-back by definition. `nextRepeatEnd` (used for the second-pass skip) calls `endsRepeat` too, so the implicit case is found the same way as an explicit one. Explicit `:|` is still the *only* way to mark a plain repeat that doesn't use endings at all — this only changes behavior for the `ending: 1`-without-`:|` case, so a song built the originally-documented way (`:|` explicitly set on the same chord as `ending: 1`) plays identically to before.

**The lead sheet uses `endsRepeat` too**, so the printed chart never disagrees with what plays: `LeadSheet.jsx` precomputes `impliedRepeatEndIds` by scanning the real `progression` (not a row's measures, so an ending that wraps onto a second printed row is still found correctly) and draws the end-repeat glyph when `measure.repeatEnd || impliedRepeatEndIds.has(measure.id)` — otherwise a first ending marked without `:|` would now correctly loop when played but print with no repeat barline, which would be invalid notation. This is the only place besides `unfoldRepeats` that interprets marks into anything beyond "where they're literally written" — the ending brackets themselves are unaffected, since they're drawn from `ending` alone.

## Song form

A song form is a *playback-only* concept layered on top of sections — it doesn't touch `progression` or the lead sheet at all, since real charts write each section once and rely on the player knowing the form rather than seeing it written out A-B1-A-B2-A.

`utils/sections.js` has both halves: `listSections(progression)` groups the flat array into `{ id, name, chords, hasEndings }` per section (`hasEndings` is `true` if any chord has `ending: 1 | 2` — this drives the chip UI below; the base grouping is the same the lead sheet already needed, extracted here since three different things now use it — the lead sheet, the section chips, and playback), and `buildPlayOrder(progression, order)` takes an array of **steps** — `{ sectionId, ending: 1 | 2 | null }`, repeats of the same section allowed — and concatenates each one's marker-plus-chords into a single flat, `playProgression`-shaped array. Chord entries are reused as-is, including their ids, so a chord played on its second pass through the form still highlights the one physical card that represents it in the editor.

`ending: null` ("as written") passes a section's chords through unchanged — repeat marks intact, so `unfoldRepeats` still handles a self-contained internal repeat normally for that visit, same as before per-step endings existed. `ending: 1` or `2` instead **filters** the section's chords to just that ending's (keeping any chord with no `ending` mark at all, dropping the other ending's) and **strips** `repeatStart`/`repeatEnd`/`ending` from what's kept — this step already IS one specific, resolved pass, so there's nothing left for `unfoldRepeats` to loop or skip within it. This is what makes `A · 1st → B → A · 2nd → B` possible: two revisits to the same section, each ending a different way, without a repeat that would otherwise be scoped to a single section and unable to jump out to B and back.

`App.jsx` holds the order as `formOrder` (an array of these step objects), persisted via `storage.js`'s `loadFormOrder`/`saveFormOrder`. Three things keep it honest:

- **Pruning.** If a section is renamed away or removed, any step referencing it needs to disappear rather than silently fail at playback time. This runs *during render*, not in a `useEffect` — mirroring the `clearSignal` pattern already used in `Piano.jsx` — keyed on a joined string of the current section ids (`sectionIdsKey`) compared against what was last pruned for (`prunedForKey`); when they differ, both are updated together in the same render-time `if`. Lint's `set-state-in-effect` rule exists to steer away from exactly the `useEffect` version of this, which would otherwise cause an extra render pass. Pruning checks `step.sectionId`, not the step itself — a step's `ending` choice isn't re-validated against whether that ending still has any chords, since a mismatch there just yields fewer chords for that step rather than a crash.
- **`<SongForm>`** (`components/SongForm/`) renders `null` outright when there are fewer than two sections — a form needs at least two to mean anything — so a pruned-down order can sit correctly in state without any UI for it until a second section exists again. A section with `hasEndings` gets a joined three-button pill (`.song-form-chip-group`: "as written" / "1st" / "2nd") instead of the single plain chip other sections get.
- **Backward compatibility.** This step shape shipped after a plain-section-id version of song form; `loadFormOrder` and `parseImportedSong` both accept the old shape (a bare string id in storage, a bare number index in a file) alongside the current one, normalizing either to `{ sectionId, ending: null }`.

**Export/import.** The exported JSON format never stored ids (`exportProgression.js`'s comment: "chord entries drop id" — true of sections too), and ids are regenerated wholesale on every import, so a step's `sectionId` can't be written to a file directly. Instead, `exportProgressionAsJson` converts each step to `{ section, ending }` — `section` is the section's *position* among the sections in document order (`listSections(progression)`, 0 = the first section), and `ending` is omitted entirely when `null` (`step.ending ? { section, ending } : { section }`), keeping an ordinary (no-ending-chosen) step's file representation exactly as terse as before this feature existed. `parseImportedSong` does the reverse once the new progression (and its freshly generated ids) exists, mapping each saved position back through a fresh `listSections` call. An out-of-range index, or an `ending` that isn't `1`/`2`, is dropped/normalized rather than thrown as an error — the rest of the song still imports fine.

Layout is split into a pure function and a component.

**`utils/leadsheetLayout.js`** (`buildLeadSheetRows`) groups the array into rows. A section always starts a new row and supplies its label. Chords wrap to a new row when the row's beats would exceed a limit. The limit can be a number or a function of the row's measures.

**`LeadSheet.jsx`** measures its width with a `ResizeObserver` and supplies that function (`makeRowCapacity`). A row must give every beat at least 48 px and every chord enough width for its diagram at 80% of natural size (`utils/diagramSize.js`). Capacity is always a whole number of measures, at most four, so rows never break mid-measure.

**Alignment.** Each measure cell uses `flex: <beats> <beats> <beats × 30px>`, growing, shrinking, and starting from a size proportional to its beats. Its width therefore always tracks its beats. The staff SVG below it uses `viewBox="0 0 totalBeats 8"` with `preserveAspectRatio="none"`, so its barlines fall at the same proportional positions. Both layers derive their positions independently from the same beat ratios, so nothing syncs pixel positions by hand. If you change one sizing scheme, change the other.

**Overlays.** Repeat signs and ending brackets are absolutely positioned HTML elements at `beat / totalBeats × 100%`, not SVG, because the stretched SVG would squash the repeat dots. Staff lines use `vector-effect="non-scaling-stroke"` so they stay thin at any stretch.

**Diagrams.** `PianoDiagram` fits itself to its chord: it shows only the octaves the chord uses (at least two) and narrows its keys so it is never wider than 150 px, so a wide two-handed voicing gets a denser diagram rather than overflowing. It is fluid (`max-width: 100%`, percentage key positions) so a narrow cell can shrink it. The sheet shows only the first chord name.

**Clef.** The treble clef is an inline SVG path outlined from the Bravura font (SIL OFL). A font glyph rendered at different sizes on different devices, and in the exported PNG, and sat off the staff.

**Handwritten chord names** is an optional style, not a fixed choice: a checkbox (`handwritten` state in `LeadSheet.jsx`, persisted via `storage.js`'s standalone `loadHandwrittenChords`/`saveHandwrittenChords` — a dedicated key rather than folded into `loadPreferences`'s bundled object, since nothing outside `LeadSheet` needs it) toggles a `.handwritten` class on `.leadsheet-paper`, which `LeadSheet.css` uses to swap `.leadsheet-chord-name`'s font to Architects Daughter (SIL OFL, bundled in `public/fonts/`, credited in that folder's `README.txt`) at a larger size and normal weight — a script font has no bold face of its own, and forcing one gets a browser-synthesized bold that looks poor, so weight is reset explicitly rather than inherited. `useSheetImage`'s `version` memo includes `handwritten`, or toggling it wouldn't invalidate the cached PNG and Download PNG/Share would keep exporting the old font. `renderSheetPng` awaits `document.fonts.ready` before capturing, since the font is fetched lazily on first use (the toggle is off by default) and html-to-image would otherwise rasterize the fallback font if capture ran before the woff2 finished loading.

## Image export and sharing

`utils/sheetImage.js` and the `useSheetImage` hook in `LeadSheet.jsx` produce the PNG.

- The captured element is `.leadsheet-paper`, the inner paper without the card border and shadow.
- The image is **rendered in the background** (400 ms debounce, re-run when the rows, title, or width change) and the blob is kept ready. `navigator.share()` must be called synchronously inside the tap on iOS Safari, so rendering after the tap can lose the user-gesture permission. The share button uses the ready blob.
- `renderSheetPng` renders twice and keeps the second result, because html-to-image can return a blank first pass in Safari.
- Share appears only when `navigator.canShare` accepts a file, which needs a secure context. A failed share falls back to a download; dismissing the share sheet does nothing.
- **Gotcha:** html-to-image copies computed styles onto HTML elements but not onto shapes inside an SVG, and the standalone image has no stylesheet. An SVG shape styled only by a CSS class is invisible in the PNG. Give SVG shapes their `stroke`, `fill`, and `vector-effect` as attributes.

## Styling

All colors, radii, and shadows are CSS custom properties in `src/index.css`, with a `prefers-color-scheme: dark` override block. There is no manual theme toggle. Shared controls (`.btn`, `.icon-btn`, `.input`, `.panel`) live there too, and grow under `@media (pointer: coarse)` for touch.

The lead sheet is deliberately **always light "paper"**. `.leadsheet-sheet` re-declares the text and key tokens with fixed light values, and the `@media print` block re-declares the light tokens globally so printing from dark mode gives dark-on-white. **When you add a token that the lead sheet or the diagrams use, add it to both the paper scope and the print block.**

Printing hides chrome with the `.no-print` class and calls `window.print()`; there is no PDF library, and the browser produces a vector PDF. Browsers drop background colors when printing unless "Background graphics" is on, which would erase the black and highlighted keys, so the print block sets `print-color-adjust: exact` on the sheet.

## Testing and verification

There is no test runner, and no committed tests. Behavior has been checked with throwaway [Playwright](https://playwright.dev) scripts run against `npm run dev` (for example: chord detection, repeats, layout geometry, MIDI, PNG export). If you write similar scripts:

- Piano keys are buttons with `aria-label="C4"`.
- Seed a song by setting the `localStorage` keys above in `addInitScript`.
- Fake MIDI by replacing `navigator.requestMIDIAccess` with an object whose input you call `onmidimessage` on. Note-on is `[0x90, note, velocity]`, note-off is `[0x80, note, 0]`, and the sustain pedal is `[0xb0, 64, 127]` (down) and `[0xb0, 64, 0]` (up).
- Fake sharing by stubbing `navigator.share` and `navigator.canShare`.
- To check print output, use `page.pdf({ printBackground: false })`, which reproduces the browser's default print settings.

Not testable in a desktop headless browser: real iPad Safari (the share sheet, html-to-image rendering there) and real audio output.

## Deployment

The app is a static site. `npm run build` produces `dist/`; upload it to any static host. `public/` is copied as-is, including the piano samples and `_headers`, which gives the samples a long cache lifetime on Netlify. Vite's `base` is the default `/`. Under a subpath (for example a GitHub Pages project site), set `base` in `vite.config.js`; the sample URLs already use `import.meta.env.BASE_URL`. The Share button needs https.

## Making common changes

**Add a field to chords.**
1. Add the field to the entry shape and its validation (`cleanMarks` if it is a mark, otherwise `normalizeEntry` in `storage.js`).
2. Carry it through `exportProgression.js` and `importProgression.js`.
3. Copy it in `buildLeadSheetRows`, if the sheet needs it.
4. Decide whether `duplicateChord` should copy it.
5. Update this guide.

**Change the octave range.** Edit `START_OCTAVE` and `OCTAVE_COUNT` in `constants.js`. The keyboard and diagrams both read from it. If the range moves outside C2–C6, add samples for it in `public/samples/salamander/` and the list in `audio.js`.

**Add a time signature.** Add its beat count to `TIME_SIGNATURE_OPTIONS`. Time signatures are all N/4, so compound meters like 6/8 would need a change to how beats and barlines are counted. The per-chord `meter` field uses the same list.

**Change the piano sound.** Replace the files in `public/samples/salamander/` and update the note map in `audio.js`. Keep the license note and the credit line in the app footer if you keep the Salamander recordings.

**Add UI instructions.** Update the help dialog and the empty state in `Progression.jsx` along with the user guide.

## Known limitations

- Songs live only in the browser they were made in; moving them needs Save as file and Open file.
- Only first and second endings; no nested repeats, repeat counts, D.S./D.C./Coda.
- Time signatures are N/4 only.
- The sheet shows chords only: there is no melody, rhythm marks, or lyrics.
- Clearing the progression and deleting chords cannot be undone.
- MIDI input needs Web MIDI, so desktop Chrome or Edge.
- The Share button is untested on real iPad Safari; the rest of the image pipeline is verified in a desktop browser.
- MIDI import assumes quantized block chords; an expressive performance recording (arpeggios, a melody layered over the harmony, pedal overlap) will cluster into the wrong chords. There's no rest/silence detection, so a gap in the file is absorbed into the chord before it.
- A song form is playback-only — it doesn't reorder the progression or the printed lead sheet, which always show each section once, in document order.
