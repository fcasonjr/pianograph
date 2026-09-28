function downloadFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function exportProgressionAsJson(progression) {
  const data = progression.map((entry) =>
    entry.type === 'section'
      ? { type: 'section', name: entry.name }
      : { type: 'chord', label: entry.label, notes: entry.notes, beats: entry.beats },
  )
  downloadFile('pianograph-progression.json', JSON.stringify(data, null, 2), 'application/json')
}

export function exportProgressionAsText(progression) {
  const text = progression
    .map((entry) => (entry.type === 'section' ? `-- ${entry.name} --` : entry.label))
    .join('  |  ')
  downloadFile('pianograph-progression.txt', text, 'text/plain')
}
