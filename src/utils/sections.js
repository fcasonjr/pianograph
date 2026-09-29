// A section "owns" the chord entries between its marker and the next section marker (or the end of
// the progression) — the same grouping the lead sheet already uses to break the progression into rows.

// Sections in document order, each with the chord entries that belong to it and whether any of them
// carry a 1st/2nd ending mark (which is what lets a song-form step pick just one ending — see
// buildPlayOrder below).
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
  sections.forEach((section) => {
    section.hasEndings = section.chords.some((chord) => chord.ending === 1 || chord.ending === 2)
  })
  return sections
}

// A song-form step: which section, and — only meaningful for a section with endings — which one to
// play. `ending: null` means "as written" (every chord, repeat marks intact, so a self-contained
// internal repeat still plays out normally within that one visit).
// { sectionId: string, ending: 1 | 2 | null }

// Builds a flat, progression-shaped array for a custom play order (e.g. play section A's 1st ending,
// then B, then A's 2nd ending, then B again): each step becomes a fresh marker for that section's name,
// followed by its chords. Chord entries — and their ids — are reused as-is from the original
// progression, so a chord played on its second pass through the form still lights up the one card that
// represents it. Unknown section ids (a section since renamed away or removed) are silently skipped.
export function buildPlayOrder(progression, order) {
  const byId = new Map(listSections(progression).map((section) => [section.id, section]))
  return order.flatMap((step) => {
    const section = byId.get(step.sectionId)
    if (!section) return []
    const chords =
      step.ending == null
        ? section.chords
        : section.chords
            // Keep this step's ending plus every chord with no ending mark at all; drop the other
            // ending's chords entirely, since the choice of which one to play is now made here, not
            // left for unfoldRepeats to work out mid-song.
            .filter((chord) => chord.ending == null || chord.ending === step.ending)
            // The repeat that would normally jump between endings doesn't apply once a specific ending
            // has already been chosen for this visit — strip those flags so unfoldRepeats treats this
            // as a single ordinary pass, not a block that tries to loop back on its own.
            .map(({ repeatStart: _repeatStart, repeatEnd: _repeatEnd, ending: _ending, ...rest }) => rest)
    return [{ id: crypto.randomUUID(), type: 'section', name: section.name }, ...chords]
  })
}
