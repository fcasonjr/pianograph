# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start the Vite dev server (default port 5173)
- `npm run build` — production build to `dist/`
- `npm run preview` — serve the production build locally
- `npm run lint` — run Oxlint (config in `.oxlintrc.json`; react + oxc plugins, `react/rules-of-hooks` is an error)

There is no test runner configured in this project.

## Architecture

Pianograph is a React + Vite app for building piano chords/progressions. The core design decision that shapes everything else: **notes are represented as scientific-pitch-notation strings** (e.g. `"C4"`, `"C#4"`) everywhere — piano key ids, the MIDI hook's output, and both third-party libraries (Tone.js and Tonal.js) consume/produce this exact format natively, so there is no conversion layer between them.

### Key generation and octave range

`src/constants.js` defines `START_OCTAVE`/`OCTAVE_COUNT` (currently C2–B5, four octaves, to fit two-handed voicings with bass notes), the single source of truth for which octave range the interactive `Piano` renders. The piano scrolls horizontally (`.piano-scroll`, min 32px per key) instead of shrinking keys on narrow screens, and MIDI notes outside the rendered range are ignored in `Piano.jsx` (`validIds`) rather than becoming invisible phantom notes. `src/utils/pianoKeys.js` (`generateKeys`) builds the white/black key layout from that range and is shared by both the interactive `Piano` component and every read-only mini keyboard diagram — so the main keyboard and every diagram always agree on layout without duplicating the black-key positioning math. The mini-diagram rendering itself lives in one place, `src/components/PianoDiagram/PianoDiagram.jsx`, and is reused by both `ChordCard` and `LeadSheet` — don't reintroduce a second inline copy of that rendering loop. Unlike the main keyboard, each diagram *fits to its own notes*: it shows only the octaves the chord uses (minimum two) and shrinks its key width so it never exceeds 140px, so wide two-handed voicings get a wider, denser diagram instead of overflowing measures.

### Selection state lives in `Piano`, driven by two input sources

`Piano.jsx` owns the `activeNotes` Set (the single source of truth for "currently selected notes") and exposes it upward via an `onNotesChange` callback. Two independent inputs mutate this same state:
- Mouse clicks toggle a key (`toggleNote`) — click-to-select/deselect, sticky.
- MIDI note-on/off (via `hooks/useMidiInput.js`) calls `setNoteActive(id, isActive)` — press-and-hold semantics, matching how a real keyboard behaves.

Gotcha already hit once: the `onNotesChange` callback must be invoked from a `useEffect` keyed on `activeNotes`, not from inside the `setActiveNotes` updater function — calling a parent's `setState` from inside another component's state updater triggers a React "Cannot update a component while rendering a different component" warning.

`useMidiInput` keeps latest `onNoteOn`/`onNoteOff` callbacks in a ref rather than the effect's dependency array, so it doesn't tear down and resubscribe to MIDI inputs on every render.

### Chord detection

`src/utils/chordDetection.js` wraps Tonal's `Chord.detect`. Two non-obvious details: notes are sorted low-to-high by pitch first (Tonal treats the *first* note as the bass, so click order would otherwise change slash-chord names), and `assumePerfectFifth: true` is passed so voicings that omit the 5th (common in jazz) still match. Chord names are spelled from the input note ids, which use sharps only (`D#4`), so flat-key chords currently come out as e.g. `D#maj7` rather than `Ebmaj7`. `chordLabel(noteIds)` is the single formatting function used both for the live chord-name header and for the label stored on each saved progression entry — same fallback rules apply everywhere (empty selection / single note / unrecognized cluster / detected chord name(s)).

### Audio playback

`src/utils/audio.js` holds one lazily-created, module-level `Tone.PolySynth` singleton (`getSynth()`), shared across every audio path:
- `previewNote` — short blip on mouse-click key activation.
- `startNote`/`stopNote` — sustain-while-held, used by MIDI note-on/off.
- `playChord` — one-off preview for a saved chord card's play button.
- `playProgression(chords, bpm, { onStepChange })` — schedules every chord's `triggerAttackRelease` up front using `Tone.now() + i * beatSeconds` offsets (no `Tone.Transport`), and returns total duration in ms so the caller can `setTimeout` to reset "is playing" UI state and step through the `onStepChange` highlight callback.

### Progression data model: two entry types in one flat array

The progression is a single flat array holding two kinds of entries, distinguished by `type`:

- Chord: `{ id, type: 'chord', label, notes, beats }` — `beats` is the entry's length in beats (default 4, fixed 4/4 assumption), used to size its measure in the leadsheet view.
- Section marker: `{ id, type: 'section', name }` — a structural marker (e.g. "A"/"B"/"Bridge") for song-form breaks, common in jazz standards. It carries no musical content.

This "marker as just another array entry" design is deliberate: reordering (`moveChord`), duplication (`duplicateChord`), and removal (`removeChord`) in `App.jsx` are all generic over `id` and don't care about `type`, so sections move/duplicate/delete exactly like chords with no special-casing. Anything that *does* need to distinguish them (rendering, playback, export) checks `entry.type === 'section'` explicitly — see `Progression.jsx` (branches to `SectionMarker` vs `ChordCard`), `utils/audio.js`'s `playProgression` (filters sections out before scheduling — they don't make sound or consume playback time), and `utils/exportProgression.js` (emits a different shape per type).

`ids` are generated with `crypto.randomUUID()`. `App.jsx` lazy-initializes progression state from `src/utils/storage.js` (`localStorage` key `pianograph:progression`) and persists on every change via `useEffect`. Storage reads/writes are wrapped in try/catch since `localStorage` is an external-boundary API that can throw (private browsing, quota); `loadProgression()` also normalizes entries loaded from before `type`/`beats` existed, so old saved data doesn't break — extend that normalization if the entry shape changes again.

`src/utils/exportProgression.js` builds `Blob` + synthetic anchor-click downloads for JSON and plain-text export — no backend involved.

### Leadsheet view and print/PDF export

`src/utils/leadsheetLayout.js` (`buildLeadSheetRows`) turns the flat progression array into rows ("systems"): a section marker always starts a new row (and supplies that row's label), and chords also wrap to a new row once a row's total `beats` would exceed `maxBeatsPerRow` (default 16). This is the one place that interprets the two entry types into a layout structure — keep it a pure function of `progression` so it stays easy to reuse (e.g. if print pagination ever needs the same row breaks).

`src/components/LeadSheet/LeadSheet.jsx` renders each row as a hand-drawn SVG staff (5 lines + barlines, no music-engraving library — there's no melody data in this app, only chords, so real notation engraving isn't needed) plus a treble clef glyph (`𝄞`, plain Unicode, no font dependency). The key layout trick: each measure's chord-name/`PianoDiagram` annotation cell uses `flex: <beats> <beats> <beats * 30px>` (grow, shrink, *and* basis all scaled by `beats`), so its rendered width stays proportional to `beats` whether the row is compressed or stretched — and the SVG staff below it uses `viewBox="0 0 totalBeats 8"` with `preserveAspectRatio="none"`, so its barlines land at the same proportional x-positions. Both layers independently resolve to the same per-measure width from the same `beats` ratios, which is what keeps chord annotations aligned with their barlines without any manual pixel syncing. If you change one sizing scheme, change the other to match.

`App.jsx` holds a `view` state (`'builder' | 'leadsheet'`) that swaps which panel renders — not two panels shown at once. Print support piggybacks on this: a global `.no-print` utility class (in `index.css`, under `@media print`) hides chrome (the view-toggle button, the leadsheet's own "Print / Save as PDF" button) when printing, and `#root`'s padding/min-height are relaxed under `@media print` so the leadsheet uses the full page. The print button just calls `window.print()` — no PDF-generation library; this relies on the browser's own print-to-PDF (works from Chrome/Edge's print dialog and from iPad Safari's print preview share sheet).

### Styling: tokens, shared controls, and the "paper" scope

All colors, radii, and shadows are CSS custom properties defined once in `src/index.css`, with a `prefers-color-scheme: dark` override block (dark mode follows the OS; there's no manual toggle). Component CSS should use those tokens (`var(--surface)`, `var(--accent)`, `var(--key-white)`, …) rather than hardcoded colors — the piano and mini-diagram keys have their own `--key-*` tokens so they stay correct in dark mode. Shared controls live in `index.css` too: `.btn` (+ `-primary`/`-secondary`/`-ghost`), `.icon-btn`, `.input`, `.panel`. Both button types grow under `@media (pointer: coarse)` for touch (the card icon buttons are 40px there, sized to fit five across a card; `.btn` is 44px).

The lead sheet is deliberately **always light "paper"**: `.leadsheet-sheet` in `LeadSheet.css` re-declares the text and `--key-*` tokens locally with fixed light values, so it stays white with dark ink in dark mode. Print does the same globally — the `@media print` block in `index.css` re-declares the light tokens, so printing from dark mode still produces dark-on-white output. If you add a new token that the lead sheet or piano diagrams use, add it to the paper scope and the print block too.
