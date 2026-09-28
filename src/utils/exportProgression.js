function downloadFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function fileBase(title) {
  const slug = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return slug || 'pianograph-progression'
}

export function exportProgressionAsJson(progression, title = '', beatsPerMeasure = 4) {
  const entries = progression.map((entry) =>
    entry.type === 'section'
      ? { type: 'section', name: entry.name }
      : { type: 'chord', label: entry.label, notes: entry.notes, beats: entry.beats },
  )
  const data = { title: title.trim(), beatsPerMeasure, progression: entries }
  downloadFile(`${fileBase(title)}.json`, JSON.stringify(data, null, 2), 'application/json')
}

export function exportProgressionAsText(progression, title = '') {
  const chords = progression
    .map((entry) => (entry.type === 'section' ? `-- ${entry.name} --` : entry.label))
    .join('  |  ')
  const text = title.trim() ? `${title.trim()}\n\n${chords}` : chords
  downloadFile(`${fileBase(title)}.txt`, text, 'text/plain')
}
