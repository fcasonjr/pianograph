import { cleanMarks } from './repeats'
import { downloadFile, fileBase } from './download'
import { listSections } from './sections'

export function exportProgressionAsJson(progression, title = '', beatsPerMeasure = 4, playOrder = []) {
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
  // The file never stores ids (they're regenerated on import), so a song form is saved as each step's
  // position among the sections in document order (0 = the first section, 1 = the second, ...) rather
  // than the id itself — importProgression.js maps these back to real ids once the new ones exist.
  const sectionIndex = new Map(listSections(progression).map((section, i) => [section.id, i]))
  const formIndices = playOrder.map((id) => sectionIndex.get(id)).filter((i) => i !== undefined)
  const data = { title: title.trim(), beatsPerMeasure, playOrder: formIndices, progression: entries }
  downloadFile(`${fileBase(title)}.json`, JSON.stringify(data, null, 2), 'application/json')
}

export function exportProgressionAsText(progression, title = '') {
  const chords = progression
    .map((entry) => {
      if (entry.type === 'section') return `-- ${entry.name} --`
      const marks = cleanMarks(entry)
      return `${marks.repeatStart ? '|: ' : ''}${marks.ending ? `[${marks.ending}.] ` : ''}${entry.label}${marks.repeatEnd ? ' :|' : ''}`
    })
    .join('  |  ')
  const text = title.trim() ? `${title.trim()}\n\n${chords}` : chords
  downloadFile(`${fileBase(title)}.txt`, text, 'text/plain')
}
