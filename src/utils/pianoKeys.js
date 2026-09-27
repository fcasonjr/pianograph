const WHITE_NOTES = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
const HAS_BLACK_KEY_AFTER = new Set(['C', 'D', 'F', 'G', 'A'])

export function generateKeys(startOctave, octaveCount) {
  const whiteKeys = []
  const blackKeys = []

  for (let i = 0; i < octaveCount; i++) {
    const octave = startOctave + i
    WHITE_NOTES.forEach((note) => {
      whiteKeys.push({ id: `${note}${octave}`, note, octave })
      if (HAS_BLACK_KEY_AFTER.has(note)) {
        blackKeys.push({
          id: `${note}#${octave}`,
          note: `${note}#`,
          octave,
          afterIndex: whiteKeys.length - 1,
        })
      }
    })
  }

  return { whiteKeys, blackKeys }
}
