import { DEFAULT_BEATS_PER_MEASURE, TIME_SIGNATURE_OPTIONS } from '../constants'
import { cleanMarks } from './repeats'
import { isValidBeats } from './beats'

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
    beats: isValidBeats(entry.beats) ? entry.beats : 4,
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
    return {
      accidentals: parsed?.accidentals === 'flats' ? 'flats' : 'sharps',
      midiAutoAdd: parsed?.midiAutoAdd !== false,
    }
  } catch {
    return { accidentals: 'sharps', midiAutoAdd: true }
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

const PLAY_ORDER_KEY = 'pianograph:playOrder'

// A song form: an ordered list of { sectionId, ending } steps to play (e.g. A's 1st ending, B, A's 2nd
// ending, B). Ids that no longer match an existing section (renamed away, removed, or a stale save from
// a different song) are the caller's responsibility to prune against the current progression — this
// just returns what was last saved. Normalizes a plain section-id string (the shape this shipped with
// before per-step endings existed) into a step with `ending: null`.
export function loadFormOrder() {
  try {
    const parsed = JSON.parse(localStorage.getItem(PLAY_ORDER_KEY) ?? '[]')
    if (!Array.isArray(parsed)) return []
    return parsed
      .map((step) => {
        if (typeof step === 'string') return { sectionId: step, ending: null }
        if (step && typeof step.sectionId === 'string') {
          return { sectionId: step.sectionId, ending: step.ending === 1 || step.ending === 2 ? step.ending : null }
        }
        return null
      })
      .filter(Boolean)
  } catch {
    return []
  }
}

export function saveFormOrder(order) {
  try {
    localStorage.setItem(PLAY_ORDER_KEY, JSON.stringify(order))
  } catch {
    // best-effort, same as saveProgression
  }
}

const HANDWRITTEN_CHORDS_KEY = 'pianograph:handwrittenChords'

export function loadHandwrittenChords() {
  try {
    return localStorage.getItem(HANDWRITTEN_CHORDS_KEY) === 'true'
  } catch {
    return false
  }
}

export function saveHandwrittenChords(enabled) {
  try {
    localStorage.setItem(HANDWRITTEN_CHORDS_KEY, String(enabled))
  } catch {
    // best-effort, same as saveProgression
  }
}
