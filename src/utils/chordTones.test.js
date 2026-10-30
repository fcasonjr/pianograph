import { describe, expect, it } from 'vitest'
import { chordToneLabels, chordToneText } from './chordTones'

const nums = (notes) => Object.fromEntries(chordToneLabels(notes, 'numbers'))

describe('chordToneLabels', () => {
  it('numbers a seventh chord from its root', () => {
    expect(nums(['C4', 'E4', 'G4', 'A#4'])).toEqual({ C4: '1', E4: '3', G4: '5', 'A#4': 'b7' })
  })

  it('follows the root, not the bass, in an inversion', () => {
    expect(nums(['E3', 'G3', 'C4'])).toMatchObject({ C4: '1', E3: '3', G3: '5' })
  })

  it('keeps extensions as 9/11/13 and flats the minor third', () => {
    expect(nums(['C3', 'D#3', 'G3', 'A#3', 'D4'])).toMatchObject({ 'D#3': 'b3', 'A#3': 'b7', D4: '9' })
  })

  it('shows nothing for an unrecognized cluster', () => {
    expect(chordToneLabels(['C4', 'C#4', 'D4'], 'numbers').size).toBe(0)
  })

  it('names notes without octaves, respelled for flats', () => {
    expect(Object.fromEntries(chordToneLabels(['A#3', 'D4'], 'names', 'flats'))).toEqual({ 'A#3': 'Bb', D4: 'D' })
  })
})

describe('chordToneText', () => {
  it('lists labels low to high, each once', () => {
    expect(chordToneText(['G3', 'C3', 'E4', 'C4'], 'numbers')).toBe('1 5 3')
  })

  it('is empty when nothing is labelled', () => {
    expect(chordToneText(['C4', 'C#4', 'D4'], 'numbers')).toBe('')
  })
})
