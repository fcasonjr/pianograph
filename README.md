# Pianograph

Build piano chords by clicking keys (or playing a MIDI keyboard), arrange them into a progression, and turn it into a printable **lead sheet**: a staff with a piano-key diagram and chord name for each chord, section rows, and repeat signs. Print it to PDF or share it as an image, and read it on an iPad.

## Features

- **Chord builder.** Click keys across four octaves (C2–B5), so two-handed voicings with a low bass note fit. The chord name is detected as you play (`Cmaj7`, `Dm7 / F6/D`, slash chords and jazz voicings included), with a Sharps/Flats setting for spelling. Or type a chord symbol into the search box to select its notes for you, then adjust by hand from there.
- **Sound.** Real piano samples for previewing notes, chords, and the whole progression at a tempo you choose, with Pause/Resume and Stop for playback. If the samples can't load, it falls back to a synth.
- **MIDI keyboard input** (Chrome or Edge on a computer). Notes stay selected after you let go, so both hands can play a chord. The chord is added automatically a moment after you lift your hands, or when you press a sustain pedal.
- **Progression.** Reorder, copy, and remove chords; edit an already-added chord's notes right on its card; set how long each lasts in half-beat steps (several short chords can share a measure); choose a 2/4–6/4 time signature, and change it mid-song for a short or long bar; add section labels (A, B, Bridge…) and repeat signs with first and second endings.
- **Song form.** Play sections in any order — A, B1, A, B2, A — without retyping or duplicating chords, and play from any section to the end. The order is saved with the song.
- **Lead sheet.** Prints to PDF from the browser, downloads as a PNG, or uses the native share sheet on iPad and phone. An optional handwritten font for the chord names gives it more of a classic hand-copied fake-book feel.
- **Save and move songs.** Work is saved automatically in the browser. Save as file / Open file to back up, move a song to another device, or keep variations as their own files — export it as plain text too, if you just need a chart to paste elsewhere.
- **Import a MIDI file.** Bring in a file of block chords — a chord-chart or fake-book export — and it's turned straight into a progression, ready to clean up and use.

## Getting started

Requires Node 20.19+ or 22.12+.

```bash
npm install
npm run dev      # http://localhost:5173
```

Other commands: `npm run build` (production build to `dist/`), `npm run preview` (serve that build locally), `npm run lint`, and `npm test` (unit tests for the layout and beat utilities).

## Notes

- **Data stays in your browser.** There is no server or account. Songs live in this browser on this device, so use Save as file and Open file to move them.
- **Sharing on a phone or iPad needs https.** The Share button appears only where the browser allows sharing files, which requires a secure page. Download PNG and Print / Save as PDF work everywhere.
- **MIDI needs a browser with Web MIDI**, which means desktop Chrome or Edge. Safari and iPad browsers don't support it.

## Deploying

It's a static site: run `npm run build` and upload `dist/` to any static host (Netlify, Cloudflare Pages, GitHub Pages, and so on). The piano samples are bundled in `public/samples/`, so nothing is fetched from a third party. If you host under a subpath, set Vite's `base` option to match.

`netlify.toml` has the build settings for Netlify's "Import from Git": build command `npm run build`, publish directory `dist`. Push this repo to GitHub, then in Netlify choose **Add new site → Import from Git** and pick it; every push after that redeploys automatically.

## Built with

React and Vite, [Tone.js](https://tonejs.github.io/) for audio, [Tonal](https://github.com/tonaljs/tonal) for chord detection, and [html-to-image](https://github.com/bubkoo/html-to-image) for the PNG export. The staff and diagrams are hand-drawn SVG and CSS.

## Documentation

- [User guide](docs/USER_GUIDE.md): how to build chords, use a MIDI keyboard, add sections and repeats, and print or share the lead sheet. Also available as a [designed PDF](docs/Pianograph-User-Guide.pdf) with screenshots.
- [Developer guide](docs/DEVELOPER_GUIDE.md): architecture, data model, file formats, and how to change things. [CLAUDE.md](CLAUDE.md) holds the same notes for AI coding assistants.

## Credits

- Piano sound: [Salamander Grand Piano](https://archive.org/details/SalamanderGrandPianoV3) by Alexander Holm, [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/).
- The treble clef shape is outlined from the Bravura font (SIL Open Font License).
- Handwritten chord names: [Architects Daughter](https://fonts.google.com/specimen/Architects+Daughter) by Kimberly Geswein, SIL Open Font License.
