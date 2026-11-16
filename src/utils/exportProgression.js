import { cleanMarks } from './repeats'
import { downloadFile, fileBase } from './download'
import { listSections } from './sections'
import { formatTranspose } from './transpose'

// `progression` is the stored (untransposed) song, and `transpose` is saved beside it: this file is a save
// of the document, so reopening it restores both and Reset still gets back to the original key.
export function exportProgressionAsJson(
  progression,
  title = '',
  beatsPerMeasure = 4,
  playOrder = [],
  transpose = 0,
) {
  const entries = progression.map((entry) =>
    entry.type === 'section'
      ? { type: 'section', name: entry.name }
      : {
          type: 'chord',
          label: entry.label,
          notes: entry.notes,
          beats: entry.beats,
          ...cleanMarks(entry),
        },
  )
  // The file never stores ids (they're regenerated on import), so a song-form step is saved as its
  // section's position among the sections in document order (0 = the first section, 1 = the second,
  // ...) rather than the id itself, plus which ending it plays, if any — importProgression.js maps the
  // position back to a real id once the new ones exist.
  const sectionIndex = new Map(listSections(progression).map((section, i) => [section.id, i]))
  const formSteps = playOrder
    .map((step) => {
      const section = sectionIndex.get(step.sectionId)
      if (section === undefined) return null
      return step.ending ? { section, ending: step.ending } : { section }
    })
    .filter(Boolean)
  const data = {
    title: title.trim(),
    beatsPerMeasure,
    // Omitted at 0, so an ordinary file stays as terse as before transposition existed.
    ...(transpose ? { transpose } : {}),
    playOrder: formSteps,
    progression: entries,
  }
  downloadFile(`${fileBase(title)}.json`, JSON.stringify(data, null, 2), 'application/json')
}

// `progression` here is the transposed view (what the user sees); the amount is noted in the file.
export function exportProgressionAsText(progression, title = '', transpose = 0) {
  const chords = progression
    .map((entry) => {
      if (entry.type === 'section') return `-- ${entry.name} --`
      const marks = cleanMarks(entry)
      return `${marks.meter ? `(${marks.meter}/4) ` : ''}${marks.repeatStart ? '|: ' : ''}${marks.ending ? `[${marks.ending}.] ` : ''}${entry.label}${marks.repeatEnd ? ' :|' : ''}`
    })
    .join('  |  ')
  const text = [title.trim(), transpose ? `Transposed: ${formatTranspose(transpose)}` : '', chords]
    .filter(Boolean)
    .join('\n\n')
  downloadFile(`${fileBase(title)}.txt`, text, 'text/plain')
}
