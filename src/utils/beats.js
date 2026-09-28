import { MAX_CHORD_BEATS } from '../constants'

// One-click chord lengths: a beat, two beats, one measure, two measures. Expressed in beats
// (not "half"/"whole") because half of a 3/4 measure isn't a whole number of beats.
export function beatPresets(beatsPerMeasure) {
  return [...new Set([1, 2, beatsPerMeasure, beatsPerMeasure * 2])]
    .filter((beats) => beats <= MAX_CHORD_BEATS)
    .sort((a, b) => a - b)
}
