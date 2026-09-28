import { cleanMarks } from './repeats'
import { downloadFile, fileBase } from './download'

export function exportProgressionAsJson(progression, title = '', beatsPerMeasure = 4) {
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
  const data = { title: title.trim(), beatsPerMeasure, progression: entries }
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
