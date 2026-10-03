import { describe, expect, it } from 'vitest'
import { buildLeadSheetRows } from './leadsheetLayout'
import { cleanMarks } from './repeats'
import { formatBeats, isValidBeats } from './beats'

const chord = (id, beats, extra = {}) => ({ id, type: 'chord', label: id, notes: ['C4'], beats, ...extra })
const section = (id, name) => ({ id, type: 'section', name })

describe('buildLeadSheetRows', () => {
  it('starts a new row at each section and wraps past the row capacity', () => {
    const rows = buildLeadSheetRows([section('s', 'A'), chord('a', 4), chord('b', 4), chord('c', 4)], 8)
    expect(rows.map((r) => r.measures.map((m) => m.id))).toEqual([['a', 'b'], ['c']])
    expect(rows[0].label).toBe('A')
  })

  it('carries a meter change across rows and flags only the chord that changes it', () => {
    const rows = buildLeadSheetRows(
      [chord('a', 4), chord('b', 2, { meter: 2 }), section('s', 'B'), chord('c', 2), chord('d', 4, { meter: 4 })],
      16,
      4,
    )
    const byId = Object.fromEntries(rows.flatMap((r) => r.measures).map((m) => [m.id, m]))
    expect([byId.a.meter, byId.b.meter, byId.c.meter, byId.d.meter]).toEqual([4, 2, 2, 4])
    expect([byId.a.meterChange, byId.b.meterChange, byId.c.meterChange, byId.d.meterChange]).toEqual([
      false,
      true,
      false,
      true,
    ])
  })

  it('does not flag an explicit meter equal to the one already in effect', () => {
    const [row] = buildLeadSheetRows([chord('a', 4, { meter: 4 })], 16, 4)
    expect(row.measures[0].meterChange).toBe(false)
  })

  it('accepts half-beat lengths', () => {
    const [row] = buildLeadSheetRows([chord('a', 1.5), chord('b', 0.5), chord('c', 2)], 16)
    expect(row.measures.map((m) => m.beats)).toEqual([1.5, 0.5, 2])
  })
})

describe('cleanMarks', () => {
  it('keeps valid marks and meters and drops the rest', () => {
    expect(cleanMarks({ repeatStart: true, repeatEnd: false, ending: 2, meter: 3 })).toEqual({
      repeatStart: true,
      ending: 2,
      meter: 3,
    })
    expect(cleanMarks({ ending: 3, meter: 7 })).toEqual({})
    expect(cleanMarks({ meter: null })).toEqual({})
  })
})

describe('beats helpers', () => {
  it('validates multiples of a half-beat within range', () => {
    expect([0.5, 1, 1.5, 32].every(isValidBeats)).toBe(true)
    expect([0, 0.25, 33, NaN, undefined].some(isValidBeats)).toBe(false)
  })

  it('formats half-beats', () => {
    expect([0.5, 1, 1.5, 4].map(formatBeats)).toEqual(['½', '1', '1½', '4'])
  })
})
