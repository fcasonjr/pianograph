import { MAX_CHORD_BEATS } from '../constants'

// Chord lengths are multiples of this many beats (a half-beat is an eighth note in N/4).
export const BEAT_STEP = 0.5

export function isValidBeats(beats) {
  return Number.isFinite(beats) && beats >= BEAT_STEP && beats <= MAX_CHORD_BEATS && beats % BEAT_STEP === 0
}

// "1½", "2", "½" — for card labels.
export function formatBeats(beats) {
  const whole = Math.floor(beats)
  const half = beats % 1 !== 0
  if (!half) return String(whole)
  return whole === 0 ? '½' : `${whole}½`
}

// One-click chord lengths: half a beat, a beat, two beats, one measure, two measures. Expressed in beats
// (not "half"/"whole") because half of a 3/4 measure isn't a whole number of beats.
export function beatPresets(beatsPerMeasure) {
  return [...new Set([0.5, 1, 2, beatsPerMeasure, beatsPerMeasure * 2])]
    .filter((beats) => beats <= MAX_CHORD_BEATS)
    .sort((a, b) => a - b)
}
