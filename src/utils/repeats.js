// Chords carry optional repeat marks: `repeatStart` (a |: before the chord), `repeatEnd`
// (a :| after it) and `ending` (1 or 2, inside a first/second ending).

function nextRepeatEnd(progression, from) {
  for (let j = from; j < progression.length; j++) {
    if (progression[j].type === 'chord' && progression[j].repeatEnd) return j
  }
  return -1
}

// Returns the chords in play order. A repeated block starts at the latest repeatStart chord, section
// marker, or previous repeatEnd (so a lone :| repeats back to there). Each :| jumps back exactly once,
// and on the second pass first-ending chords are skipped so the second ending plays next.
export function unfoldRepeats(progression) {
  const played = []
  const takenRepeatEnds = new Set()
  let blockStart = 0
  let i = 0

  while (i < progression.length) {
    const entry = progression[i]
    if (entry.type === 'section') {
      blockStart = i + 1
      i++
      continue
    }
    if (entry.type !== 'chord') {
      i++
      continue
    }

    if (entry.repeatStart) blockStart = i

    if (entry.ending === 1) {
      const end = nextRepeatEnd(progression, i)
      if (end !== -1 && takenRepeatEnds.has(end)) {
        blockStart = end + 1
        i = end + 1
        continue
      }
    }

    played.push(entry)

    if (entry.repeatEnd) {
      if (!takenRepeatEnds.has(i)) {
        takenRepeatEnds.add(i)
        i = blockStart
        continue
      }
      blockStart = i + 1
    }
    i++
  }
  return played
}

// Keeps only valid, set marks so stored/exported/imported chords stay tidy.
export function cleanMarks(raw) {
  const marks = {}
  if (raw?.repeatStart === true) marks.repeatStart = true
  if (raw?.repeatEnd === true) marks.repeatEnd = true
  if (raw?.ending === 1 || raw?.ending === 2) marks.ending = raw.ending
  return marks
}
