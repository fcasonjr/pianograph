import { cleanMarks } from './repeats'

const DEFAULT_MAX_BEATS_PER_ROW = 16

// `maxBeatsPerRow` is a number, or a function of a row's measures (including the one being added) that
// returns how many beats that row may hold — so rows with short, wide-diagram chords can hold fewer.
export function buildLeadSheetRows(progression, maxBeatsPerRow = DEFAULT_MAX_BEATS_PER_ROW) {
  const capacityFor = typeof maxBeatsPerRow === 'function' ? maxBeatsPerRow : () => maxBeatsPerRow
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

    const measure = {
      id: entry.id,
      label: entry.label,
      notes: entry.notes,
      beats: entry.beats,
      ...cleanMarks(entry),
    }

    const rowBeats = currentRow.measures.reduce((sum, m) => sum + m.beats, 0)
    if (
      currentRow.measures.length > 0 &&
      rowBeats + measure.beats > capacityFor([...currentRow.measures, measure])
    ) {
      startNewRow(null)
    }

    currentRow.measures.push(measure)
  })

  return rows.filter((row) => row.measures.length > 0 || row.label)
}
