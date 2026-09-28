import { DEFAULT_BEATS_PER_MEASURE, TIME_SIGNATURE_OPTIONS } from '../constants'
import { cleanMarks } from './repeats'

const STORAGE_KEY = 'pianograph:progression'

function normalizeEntry(entry) {
  if (entry?.type === 'section') {
    return { id: entry.id, type: 'section', name: entry.name ?? 'Section' }
  }
  return {
    id: entry.id,
    type: 'chord',
    label: entry.label,
    notes: entry.notes ?? [],
    beats: entry.beats ?? 4,
    ...cleanMarks(entry),
  }
}

export function loadProgression() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.map(normalizeEntry)
  } catch {
    return []
  }
}

export function saveProgression(progression) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progression))
  } catch {
    // localStorage unavailable (private browsing, quota, etc.) — persistence is best-effort
  }
}

const PREFS_KEY = 'pianograph:preferences'

export function loadPreferences() {
  try {
    const parsed = JSON.parse(localStorage.getItem(PREFS_KEY) ?? '{}')
    return { accidentals: parsed?.accidentals === 'flats' ? 'flats' : 'sharps' }
  } catch {
    return { accidentals: 'sharps' }
  }
}

export function savePreferences(prefs) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
  } catch {
    // best-effort, same as saveProgression
  }
}

const TITLE_KEY = 'pianograph:title'

export function loadTitle() {
  try {
    return localStorage.getItem(TITLE_KEY) ?? ''
  } catch {
    return ''
  }
}

export function saveTitle(title) {
  try {
    localStorage.setItem(TITLE_KEY, title)
  } catch {
    // best-effort, same as saveProgression
  }
}

const BEATS_PER_MEASURE_KEY = 'pianograph:beatsPerMeasure'

export function loadBeatsPerMeasure() {
  try {
    const value = Number(localStorage.getItem(BEATS_PER_MEASURE_KEY))
    return TIME_SIGNATURE_OPTIONS.includes(value) ? value : DEFAULT_BEATS_PER_MEASURE
  } catch {
    return DEFAULT_BEATS_PER_MEASURE
  }
}

export function saveBeatsPerMeasure(beatsPerMeasure) {
  try {
    localStorage.setItem(BEATS_PER_MEASURE_KEY, String(beatsPerMeasure))
  } catch {
    // best-effort, same as saveProgression
  }
}
