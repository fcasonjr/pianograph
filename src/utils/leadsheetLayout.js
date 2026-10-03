import { cleanMarks } from './repeats'
import { DEFAULT_BEATS_PER_MEASURE } from '../constants'

const DEFAULT_MAX_BEATS_PER_ROW = 16

// `maxBeatsPerRow` is a number, or a function of a row's measures (including the one being added) that
// returns how many beats that row may hold — so rows with short, wide-diagram chords can hold fewer.
//
// Each measure also gets `meter` (the bar length in effect at that chord: the latest chord-level `meter`
// so far, carried across rows and sections, else `defaultMeter`) and `meterChange` (true when this chord
// is the one that switches it, so the sheet prints a time signature there).
export function buildLeadSheetRows(
  progression,
  maxBeatsPerRow = DEFAULT_MAX_BEATS_PER_ROW,
  defaultMeter = DEFAULT_BEATS_PER_MEASURE,
) {
  const capacityFor = typeof maxBeatsPerRow === 'function' ? maxBeatsPerRow : () => maxBeatsPerRow
  const rows = []
  let currentRow = null
  let meter = defaultMeter

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

    const marks = cleanMarks(entry)
    const meterChange = marks.meter !== undefined && marks.meter !== meter
    if (marks.meter !== undefined) meter = marks.meter

    const measure = {
      id: entry.id,
      label: entry.label,
      notes: entry.notes,
      beats: entry.beats,
      ...marks,
      meter,
      meterChange,
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
