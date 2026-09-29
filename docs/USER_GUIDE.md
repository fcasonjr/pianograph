# Pianograph user guide

Pianograph turns chords you play into a lead sheet you can print or share. You build each chord on a piano keyboard, arrange the chords into a song, and the app draws a staff with a piano-key diagram and the chord name over every chord.

- [Quick start](#quick-start)
- [Building chords](#building-chords)
- [Using a MIDI keyboard](#using-a-midi-keyboard)
- [Arranging the progression](#arranging-the-progression)
- [Measures and time signatures](#measures-and-time-signatures)
- [Sections](#sections)
- [Song form](#song-form)
- [Repeats and endings](#repeats-and-endings)
- [Playing it back](#playing-it-back)
- [The lead sheet](#the-lead-sheet)
- [Printing, PDF, and sharing](#printing-pdf-and-sharing)
- [Saving, backing up, and moving songs](#saving-backing-up-and-moving-songs)
- [Importing a MIDI file](#importing-a-midi-file)
- [Troubleshooting](#troubleshooting)

## Quick start

1. Click piano keys to select the notes of a chord. The chord name appears above the keyboard.
2. Press **Add chord**. The chord is saved as a card in the Progression panel below.
3. Press **Clear keyboard** (or click the keys again to deselect them) and build the next chord.
4. When you have all your chords, type a song title and open the **Lead sheet** tab at the top.
5. Use **Print / Save as PDF**, **Download PNG**, or **Share**.

The **?** button in the top right opens a short version of this guide inside the app.

## Building chords

The keyboard covers four octaves, C2 to B5, so a two-handed voicing with a low bass note fits. On a narrow screen the keyboard scrolls sideways instead of shrinking the keys.

**Selecting notes.** Click a key to select it and click it again to deselect it. You hear each note as you select it, so you can check it's the right one. Selected keys are highlighted.

**Chord names.** As you select notes, the app detects the chord and shows its name above the keyboard, for example `Cmaj7`, `Dm7`, or a slash chord such as `C/E`. Some note groups fit more than one name, and then you see several separated by slashes, for example `Dm7 / F6/D`. The lowest note is treated as the bass, so the same notes played with a different bass note can have a different name. A single note is shown as just its letter name.

If the notes don't match a known chord, the display says **No chord match**. You can still add the chord. The card and lead sheet will show that text, so add it only if that is what you want.

**Sharps or flats.** The **♯ Sharps / ♭ Flats** switch in the header decides how chord names are spelled (`D#maj7` or `Ebmaj7`). Changing it renames every chord already in your song.

**Clear keyboard** deselects all notes and empties the search box, without touching your saved chords, so you can move on to the next chord without deselecting each note by hand.

**Search a chord.** Instead of clicking every note by hand, type a chord into the search box and press **Search** (or Enter). Its notes are selected on the keyboard for you, voiced starting around the middle of the range. From there it's just like a chord you clicked in by hand: click any key to add or drop a note. Tick **Add to keyboard** first if you want the searched chord added to whatever's already selected, rather than replacing it — useful for playing a bass note yourself and searching the chord that goes over it. If the text isn't a chord Pianograph recognizes, it says so and leaves the keyboard as it was.

Spaces and capitalization never matter (`Eb Maj7` and `ebmaj7` are the same search), and both short chord-symbol notation and natural phrasing work: `Ebmaj7` or `Eb Major 7th`, `Cm7` or `C minor 7th chord`, `Bb7` or `Bb dominant 7`, `Gdim7` or `G diminished 7th`. Slash chords work too, for a chord over a specific bass note: `Gm7b5/Db`. Altered extensions in parentheses, the way a chart often writes them, work the same with or without the parentheses: `Ab9(#11)` and `Ab9#11` find the same chord, and so do several stacked together, comma or no comma: `C7(b9,#11)`. Half-diminished works as `Cm7b5`, `Cø`, `Ch7`, or spelled out (`C half diminished`, with or without a hyphen) — all the same chord, and distinct from full diminished (`Cdim7`). What doesn't: numbers spelled out as words (`seventh` rather than `7` or `7th`) and chords the app can't otherwise name.

## Using a MIDI keyboard

Plug in a MIDI keyboard and open Pianograph in **Chrome or Edge on a computer**. When the browser asks for permission to use MIDI devices, allow it. The status line above the keyboard changes to "MIDI connected" and shows the device name. Safari, Firefox, and iPad browsers can't use MIDI.

- Pressing a key selects that note and plays it. Notes stay selected after you let go, so you can play a chord with both hands and lift them.
- Notes outside the on-screen range (C2 to B5) are ignored.

There are three ways to add the chord you played:

| Way | How it works |
|---|---|
| **Add chord when I lift my hands** | A checkbox next to the MIDI status, on by default. About a third of a second after the last key comes up, the chord is added and the keyboard clears for the next chord. The short pause means hands that lift a moment apart still make one chord, and notes you press within that pause join the same chord. |
| **Sustain pedal** | Pressing the pedal adds the chord immediately and clears the keyboard. It does nothing if no notes are selected. |
| **Add chord button** | Works as always. It does not clear the keyboard afterwards. |

Untick the checkbox if you'd rather add chords yourself. Your choice is remembered. If you habitually use the sustain pedal while playing, note that pressing it mid-chord adds the chord.

Mouse clicks never add a chord automatically.

## Arranging the progression

Each saved chord is a card showing its name, a small keyboard diagram of its notes, and its controls:

| Control | What it does |
|---|---|
| **▶** | Plays that chord. |
| **← →** | Moves the chord earlier or later in the song. |
| **⧉** | Duplicates the chord right after itself. Handy when a chord returns later. |
| **×** | Removes the chord. There is no undo. |
| **§** | Starts a section just before this chord (see [Sections](#sections)). |
| Number buttons and **− / +** | Set how many beats the chord lasts (see below). |
| **\|:  :\|  1.  2.** | Repeat and ending marks (see [Repeats and endings](#repeats-and-endings)). |

**Editing a chord you've already added.** Click the chord's name or its diagram on the card, and its notes load onto the keyboard above — the card gets a dashed outline so you can see which one you're editing. Add a bass note, drop the 5th, search a different voicing, anything you'd normally do while building a chord, then press **Save changes** to write it back into that same card. Its position, length, and any repeat marks stay exactly as they were — only the notes and name change. **Cancel** backs out without saving. Editing one card while already editing another just switches to the new one; nothing is lost, since nothing is saved until you press Save changes.

**Clear** at the top of the Progression panel removes every chord and section, and clears the song title too, so you're starting a new song rather than just emptying the current one. It doesn't ask for confirmation and can't be undone, so Save as file first if you might want the song back.

## Measures and time signatures

A chord's **length is measured in beats**, and a measure is a fixed number of beats. So a measure can hold one long chord or several short ones.

- New chords fill one full measure by default.
- The number buttons on a card are one-click lengths: 1 beat, 2 beats, one measure, and two measures. Use **−** and **+** for anything else, up to 32 beats.
- Two chords of 2 beats each in 4/4 share one measure. On the lead sheet they sit side by side above the same measure.

The **Time** menu next to the tempo sets the time signature for the whole song: 2/4, 3/4, 4/4, 5/4, or 6/4. When you change it, chords that filled exactly one measure are changed to fill one measure of the new length. Chords with any other length keep their lengths.

## Sections

Sections are labels such as **A**, **B**, or **Bridge**, common in jazz standards. Each section starts a new row on the lead sheet, with its label at the left.

- **Add section:** type a name in the "Section name" box and press **Add section** to append the section at the end of the song. Chords you add next go after it.
- **§ button on a card:** starts a section right before that chord. Use this to label a part of a song you've already entered. The app suggests the next unused letter, and you can type a different name. The button is disabled on a chord that already starts a section.
- **Rename:** click the section's name badge in the progression.
- **Move or delete:** sections have ← → and × buttons, and move like chords.

## Song form

Once a song has two or more sections, a **Song form** box appears above the progression: a way to play sections in whatever order you like — A, B1, A, B2, A — without retyping or duplicating any chords.

- Tap a section's chip (**+ A**, **+ B1**, ...) to add it to the play order. Tap the same section again to add it a second time — the order shown below the chips grows one step at a time: `A → B1 → A → B2 → A`.
- Each step has its own **×** to remove just that step.
- **▶ Play form** plays exactly that sequence — each step with its own tempo intact, as if you'd written it out in full.
- **Clear form** empties the order so you can build a different one.

**If a section has 1st and 2nd endings on it,** its chip becomes three joined options instead of one: **+ A** (as written — plays through with its own repeat, exactly like a normal chord chart), **1st**, and **2nd**. Use **1st**/**2nd** when the *same* section is meant to come back later in the form ending a different way, without leaving the section itself — for example a bridge that returns twice with a different final chord each time: build the order as **A · 1st → B → A · 2nd → B**, and each visit to A plays only its own ending, no repeat or skip needed. (This is different from **B1**/**B2** — use separate sections like that when the two versions are different chords throughout, not just a different ending.)

Your song form is saved with the song, including in **Save as file**, so reopening a song later doesn't mean rebuilding the order from scratch. If you remove a section that's part of a saved form, that step is quietly dropped from the order rather than left pointing at nothing.

## Repeats and endings

Each card has four small toggle buttons for repeat marks:

- **|:** puts a start-repeat sign before the chord.
- **:|** puts an end-repeat sign after the chord. The music goes back and plays the repeated part once more.
- **1.** and **2.** mark the chord as part of a first or second ending. Click again to turn one off.

A typical chart: put **|:** on the first chord of the section, mark the last chord of the first pass with **1.**, then mark the chord (or chords) that follow with **2.**. On playback you get the section, then the section again with the second ending in place of the first.

Things to know:

- If a repeat has no **|:**, it goes back to the start of its section (or the last repeat).
- Marking **1.** always loops back at the end of that ending, even if you never toggled **:|** — that's what a first ending means. **:|** is only something you need to set yourself for a plain repeat that doesn't use endings at all.
- Only first and second endings are supported. There are no repeat counts, nested repeats, D.S., D.C., or Coda.
- Repeats are drawn as proper repeat barlines, and endings as bracketed "1." and "2." marks above the staff — including the end-repeat barline after a first ending, even if you didn't toggle **:|** yourself, so the printed chart always matches what plays. If a repeat runs onto a second row, the bracket is continued there.
- Duplicating a chord copies its ending but not its repeat signs, so you never get two start signs by accident.

## Playing it back

- **▶ Play progression** plays the whole song from the top. The card being played is highlighted.
- Each section also has its own **▶** next to its label, for playing from that point to the end without starting over — handy for auditioning just the bridge. For a custom order of sections, see [Song form](#song-form).
- While it's playing, the button becomes **⏸ Pause** and **■ Stop**. Pause holds playback exactly where it is — press **▶ Resume** to continue from that same spot, not from the beginning. Stop ends playback and rewinds to the start, ready for a fresh **▶ Play progression** next time.
- **Tempo** sets the speed in beats per minute (40 to 300). Each chord sounds for as many beats as you gave it.
- Playback follows your repeats and endings, so a repeated chord plays, and lights up, twice.
- The sound is a real piano recording. While the recordings load at startup, or if they can't load, you hear a simpler synth instead.
- Sound starts only after you click something, which is a browser rule. On an iPad, tap once if you hear nothing at first.

## The lead sheet

Open the **Lead sheet** tab to see the finished chart. It is always drawn as black ink on white paper, even if your device uses dark mode.

- **Title** at the top comes from the Song title box. Set it before printing or sharing, because it also names the files you save.
- Each **section** starts a new row. Within a row, chords are spaced by how long they last, and barlines mark each measure.
- Each chord has its **name** and a **piano diagram** with the played keys highlighted. Where a chord has several possible names, the sheet shows the first one.
- The number of measures per row adapts to the screen width, up to four, so an iPad shows shorter rows than a desktop. Rows with very short chords hold fewer measures so that the diagrams stay readable.
- **Handwritten chord names**, a checkbox in the toolbar, switches the chord names to a handwritten-style font, closer to a classic hand-copied jazz fake book than to typeset text. It only changes the chord names — the title and everything else stay as they are. Your choice is remembered, on or off, and it carries through to Print, Download PNG, and Share.

## Printing, PDF, and sharing

The lead sheet toolbar has these buttons:

- **Print / Save as PDF** opens your browser's print dialog. Choose "Save as PDF" as the destination for a PDF. The PDF is vector-based, so it stays sharp when zoomed, and your song title appears in the suggested file name.
- **Download PNG** saves the sheet as an image at twice the on-screen size.
- **Share** opens the phone or iPad share sheet so you can send the image by Messages, Mail, AirDrop, and so on. It appears only in browsers that can share files, and only on secure (https) pages.

While the image is being prepared you may see "Preparing image…" for a moment. If the image can't be created, use Print / Save as PDF instead.

On an iPad, printing from Safari's Share menu also gives you a PDF you can save to Files or open in another app.

## Saving, backing up, and moving songs

Your song is **saved automatically** in your browser as you work, including its title, time signature, and chords. There is no account and no server. That has two consequences:

- The song exists only in that browser on that device. Your computer and your iPad each have their own separate copy.
- Clearing your browser's site data, or using a private window, can lose it.

To back up, move, or keep versions of a song, use the buttons in the Progression panel:

- **Save as file** downloads the whole song — chords, title, time signature, everything — as a file you can come back to later. **Open file** loads one back in. If you already have chords, the app asks before replacing them. A file that can't be read is rejected with a message, and nothing changes.
- **Export text** downloads a plain-text version of the chord chart, such as `|: Cmaj7  |  Am7 :|`. It's one-way — there's no way to open it back up as a song.

To move a song to your iPad: on the computer, choose Save as file, send the file to the iPad (AirDrop or email works), then on the iPad open Pianograph and use Open file.

**Keeping variations as their own files.** Save as file is also how you branch a song — say, a version with only root and 5th, or a specific inversion, alongside the original. Save the original first, then make your changes (the [editing](#arranging-the-progression) on each chord's card works well for this — add a note, drop one, or pick a specific voicing), give the song a different name in the title box, and Save as file again. That's a second, independent file; Open file brings back either one, anytime.

## Importing a MIDI file

**Import MIDI**, next to Open file, reads a `.mid` file and turns it straight into a progression, so you don't have to click in every chord by hand. It works well for a **file of block chords**: a chart, fake-book export, or backing track where the chords are struck together and held for a clean length — the kind of file you'd get from chord-chart software, not a recording of someone playing expressively.

- Each group of notes that starts together becomes one chord card, with its length taken from the file's own timing.
- The song's time signature comes from the file; if it isn't a plain N/4 meter, it falls back to 4/4.
- Chord names are worked out by Pianograph itself from the notes, the same way a chord you click in is named — they may not always match a chord name embedded in the file, especially for an inversion or a voicing missing its fifth.
- Sections and repeat marks aren't detected. Add those afterward the normal way.

A file recorded from a live performance — arpeggiated chords, a melody note mixed in with the harmony, notes that overlap because of the sustain pedal — will import messily, since the app can't tell melody from harmony or separate a smear of overlapping notes into clean chords. Check the result over card by card, and use the ← → ⧉ × controls to fix anything that came in wrong, the same as with any other chord.

As with Open file, importing asks before replacing a progression you've already started.

## Troubleshooting

**The chord shows "No chord match."** The notes may not form a chord the app knows, or a note may be missing. Check the selected keys, or add the chord anyway if it's what you want.

**I can't hear anything.** Check that your volume is up and the device isn't muted. Click a key or press ▶ to start the sound, since browsers block audio until you interact with the page. Sound needs a moment to load when the app first opens.

**The MIDI keyboard isn't detected.** Use Chrome or Edge on a computer, allow the MIDI permission prompt, and reconnect the keyboard. Close other programs that may be using it.

**A chord got added by mistake with a MIDI keyboard.** Delete it with **×**, or turn off "Add chord when I lift my hands".

**The Share button isn't there.** It appears only where the browser can share files over https. Use Download PNG or Print / Save as PDF instead.

**My songs are missing.** Songs are stored per browser. If you switched browsers or devices, use Save as file and Open file to bring the song across.

**The keys are hard to read on the lead sheet.** Chords with wide voicings are drawn a bit smaller. Making the browser window wider, or using a landscape iPad, gives each diagram more room.
