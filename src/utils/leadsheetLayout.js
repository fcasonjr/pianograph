const DEFAULT_MAX_BEATS_PER_ROW = 16

export function buildLeadSheetRows(progression, maxBeatsPerRow = DEFAULT_MAX_BEATS_PER_ROW) {
  const rows = []
  let currentRow = null

  function startNewRow(label) {
    currentRow = { label: label ?? null, measures: [] }
    rows.push(currentRow)
  }

  progression.forEach((entry) => {
    if (entry.type === 'section') {
      startNewRow(entry.name)
      return
    }

    if (!currentRow) startNewRow(null)

    const rowBeats = currentRow.measures.reduce((sum, m) => sum + m.beats, 0)
    if (currentRow.measures.length > 0 && rowBeats + entry.beats > maxBeatsPerRow) {
      startNewRow(null)
    }

    currentRow.measures.push({
      id: entry.id,
      label: entry.label,
      notes: entry.notes,
      beats: entry.beats,
    })
  })

  return rows.filter((row) => row.measures.length > 0 || row.label)
}
