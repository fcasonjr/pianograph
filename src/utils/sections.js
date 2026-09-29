// A section "owns" the chord entries between its marker and the next section marker (or the end of
// the progression) — the same grouping the lead sheet already uses to break the progression into rows.

// Sections in document order, each with the chord entries that belong to it.
export function listSections(progression) {
  const sections = []
  let current = null
  progression.forEach((entry) => {
    if (entry.type === 'section') {
      current = { id: entry.id, name: entry.name, chords: [] }
      sections.push(current)
    } else if (current) {
      current.chords.push(entry)
    }
  })
  return sections
}

// Builds a flat, progression-shaped array for a custom play order (e.g. play section A, then B1, then A
// again): each section id in `order` becomes a fresh marker for that section's name, followed by its
// chords. The chord entries themselves — and their ids — are reused as-is from the original progression,
// so a chord played on its second pass through the form still lights up the one card that represents it.
// Unknown ids (a section that's since been renamed away or removed) are silently skipped.
export function buildPlayOrder(progression, order) {
  const byId = new Map(listSections(progression).map((section) => [section.id, section]))
  return order.flatMap((sectionId) => {
    const section = byId.get(sectionId)
    if (!section) return []
    return [{ id: crypto.randomUUID(), type: 'section', name: section.name }, ...section.chords]
  })
}
