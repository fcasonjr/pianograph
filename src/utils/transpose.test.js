import { describe, expect, it } from 'vitest'
import { chordToneLabels } from './chordTones'
import { parseImportedSong } from './importProgression'
import { buildPlayOrder } from './sections'
import { buildTransposingPasses, formatTranspose, keySpelling, transposeNotes, transposeProgression } from './transpose'

const chord = (id, notes, label = id, extra = {}) => ({ id, type: 'chord', label, notes, beats: 4, ...extra })

describe('transposeNotes', () => {
  it('shifts by semitones and keeps sharp-spelled ids', () => {
    expect(transposeNotes(['C4', 'E4', 'G4'], 3)).toEqual(['D#4', 'G4', 'A#4'])
    expect(transposeNotes(['C4', 'E4', 'G4'], -1)).toEqual(['B3', 'D#4', 'F#4'])
  })

  it('moves the whole chord by an octave when it would leave the keyboard', () => {
    // B5 is the top key: +2 would be C#6, so the chord drops an octave and keeps its voicing.
    expect(transposeNotes(['G5', 'B5'], 2)).toEqual(['A4', 'C#5'])
    // C2 is the bottom key: -1 would be B1, so the chord rises an octave.
    expect(transposeNotes(['C2', 'G2'], -1)).toEqual(['B2', 'F#3'])
  })

  it('returns the same notes at 0', () => {
    const notes = ['C4', 'E4']
    expect(transposeNotes(notes, 0)).toBe(notes)
  })
})

describe('transposeProgression', () => {
  const song = [chord('a', ['C4', 'E4', 'G4', 'B4'], 'Cmaj7'), { id: 's', type: 'section', name: 'B' }]

  it('relabels chords, spelled by the accidentals preference, and leaves sections and the original alone', () => {
    const flats = transposeProgression(song, 3, 'flats')
    expect(flats[0].label).toBe('Ebmaj7')
    expect(transposeProgression(song, 3, 'sharps')[0].label).toBe('D#maj7')
    expect(flats[1]).toBe(song[1])
    expect(song[0].notes).toEqual(['C4', 'E4', 'G4', 'B4'])
  })

  it('returns the stored progression itself at 0 and round-trips back to it', () => {
    expect(transposeProgression(song, 0, 'sharps')).toBe(song)
    const there = transposeProgression(song, 5, 'sharps')
    expect(transposeProgression(there, -5, 'sharps')[0].notes).toEqual(song[0].notes)
  })

  it('keeps chord-tone numbers the same, since the intervals do not change', () => {
    const [moved] = transposeProgression(song, 7, 'sharps')
    const numbers = (notes) => [...chordToneLabels(notes, 'numbers')].map(([, label]) => label)
    expect(numbers(moved.notes)).toEqual(numbers(song[0].notes))
  })
})

describe('keySpelling', () => {
  const inC = [chord('a', ['C4', 'E4', 'G4'])]

  it('picks flats for flat keys and sharps for sharp keys, from the first chord', () => {
    expect(keySpelling(inC, 3)).toBe('flats') // Eb
    expect(keySpelling(inC, 4)).toBe('sharps') // E
    expect(keySpelling(inC, 10)).toBe('flats') // Bb
  })

  it('leaves spelling alone in C, and with no chord to go on', () => {
    expect(keySpelling(inC, 0)).toBeNull()
    expect(keySpelling([], 3)).toBeNull()
  })

  it('treats a minor first chord as its relative major', () => {
    const dMinor = [chord('a', ['D4', 'F4', 'A4'])]
    expect(keySpelling(dMinor, 0)).toBe('flats') // Dm lives in F major
    expect(keySpelling([chord('a', ['A3', 'C4', 'E4'])], 0)).toBeNull() // Am lives in C
  })
})

describe('formatTranspose', () => {
  it('names the amount', () => {
    expect(formatTranspose(0)).toBe('Original key')
    expect(formatTranspose(1)).toBe('+1 semitone')
    expect(formatTranspose(-3)).toBe('−3 semitones')
  })
})

describe('importing a transposed save', () => {
  const file = (extra) =>
    JSON.stringify({ progression: [{ type: 'chord', notes: ['C4', 'E4', 'G4'], beats: 4 }], ...extra })

  it('restores the saved transposition and keeps the chords in the original key', () => {
    const song = parseImportedSong(file({ transpose: 3 }), 'sharps')
    expect(song.transpose).toBe(3)
    expect(song.progression[0].notes).toEqual(['C4', 'E4', 'G4'])
  })

  it('ignores a missing or out-of-range transposition', () => {
    expect(parseImportedSong(file({}), 'sharps').transpose).toBe(0)
    expect(parseImportedSong(file({ transpose: 40 }), 'sharps').transpose).toBe(0)
    expect(parseImportedSong(file({ transpose: 1.5 }), 'sharps').transpose).toBe(0)
  })
})

describe('buildTransposingPasses', () => {
  const sec = { id: 's', type: 'section', name: 'A' }
  const song = [sec, chord('a', ['C4', 'E4', 'G4']), chord('b', ['F4', 'A4', 'C5'])]
  const whole = (progression) => progression

  it('plays the song once per pass, each a step higher, tagged with its shift', () => {
    const list = buildTransposingPasses(song, whole, { base: 0, step: 2, passes: 3 })
    expect(list.map((c) => c.id)).toEqual(['a', 'b', 'a', 'b', 'a', 'b'])
    expect(list.map((c) => c.practiceShift)).toEqual([0, 0, 2, 2, 4, 4])
    expect(list[0].notes).toEqual(['C4', 'E4', 'G4'])
    expect(list[2].notes).toEqual(['D4', 'F#4', 'A4'])
  })

  it('starts from the current transposition and goes past an octave without leaving the keyboard', () => {
    const list = buildTransposingPasses(song, whole, { base: 3, step: 5, passes: 4 })
    expect(list[0].notes).toEqual(['D#4', 'G4', 'A#4']) // already +3
    for (const c of list) for (const n of c.notes) expect(n).toMatch(/^[A-G]#?[2-5]$/)
  })

  it('resolves repeats within each pass and strips the marks, so they cannot leak across the join', () => {
    const repeated = [chord('a', ['C4']), chord('b', ['D4'], 'b', { repeatEnd: true }), chord('c', ['E4'])]
    const list = buildTransposingPasses(repeated, whole, { base: 0, step: 1, passes: 2 })
    expect(list.map((c) => c.id)).toEqual(['a', 'b', 'a', 'b', 'c', 'a', 'b', 'a', 'b', 'c'])
    expect(list.some((c) => c.repeatEnd || c.repeatStart || c.ending)).toBe(false)
  })

  it('applies the same builder as a single play, such as a song form order', () => {
    const form = (p) => buildPlayOrder(p, [{ sectionId: 's', ending: null }, { sectionId: 's', ending: null }])
    const list = buildTransposingPasses(song, form, { base: 0, step: 1, passes: 2 })
    expect(list.map((c) => c.id)).toEqual(['a', 'b', 'a', 'b', 'a', 'b', 'a', 'b'])
    expect(list.map((c) => c.practiceShift)).toEqual([0, 0, 0, 0, 1, 1, 1, 1])
  })
})
