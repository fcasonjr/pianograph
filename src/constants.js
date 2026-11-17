export const START_OCTAVE = 2
export const OCTAVE_COUNT = 4
// Beats are quarter notes; a song's time signature is N/4.
export const DEFAULT_BEATS_PER_MEASURE = 4
export const TIME_SIGNATURE_OPTIONS = [2, 3, 4, 5, 6]
export const MAX_CHORD_BEATS = 32

// What the keyboard and chord-card diagrams print on highlighted keys.
export const CHORD_LABEL_MODES = ['off', 'numbers', 'names']

// Transposition is limited to one octave either way.
export const MAX_TRANSPOSE = 12

// Auto-transpose practice mode: how far the key rises each pass (semitones; 5 = up a fourth), and the
// most passes one play can chain.
export const AUTO_TRANSPOSE_STEPS = [1, 2, 5]
export const MIN_AUTO_PASSES = 2
export const MAX_AUTO_PASSES = 24
