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
