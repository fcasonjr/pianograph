import { useEffect, useMemo, useRef, useState } from 'react'
import PianoDiagram from '../PianoDiagram/PianoDiagram'
import { buildLeadSheetRows } from '../../utils/leadsheetLayout'
import { endsRepeat } from '../../utils/repeats'
import { diagramNaturalWidth } from '../../utils/diagramSize'
import { DEFAULT_BEATS_PER_MEASURE } from '../../constants'
import { TREBLE_CLEF_PATH } from './trebleClef'
import {
  canShareImageFiles,
  downloadSheetPng,
  renderSheetPng,
  shareSheetPng,
} from '../../utils/sheetImage'
import { loadHandwrittenChords, saveHandwrittenChords } from '../../utils/storage'
import './LeadSheet.css'

const STAFF_LINE_YS = [2, 3, 4, 5, 6]
// Clef width (28px) + gap (6px) in LeadSheet.css; keep in sync.
const CLEF_GUTTER = 34
const MIN_PX_PER_BEAT = 48
const MAX_MEASURES_PER_ROW = 4
// A chord's cell must fit its diagram at no less than this fraction of natural size, plus cell padding.
const MIN_DIAGRAM_SCALE = 0.8
const CELL_PADDING = 12

// Barlines sit on measure boundaries (every `meter` beats from the row start, where the meter is the
// one in effect at the chord the barline falls in), not between chords, so several short chords can
// share one measure and a 2/4 bar can sit among 4/4 ones.
function barlinePositions(placed, totalBeats) {
  const xs = []
  let x = 0
  while (x < totalBeats) {
    xs.push(x)
    const here = placed.find((m) => m.start <= x && x < m.end)
    x += here?.meter ?? DEFAULT_BEATS_PER_MEASURE
  }
  xs.push(totalBeats)
  return xs
}

// How many beats a row holds: a whole number of measures, as many as fit at a legible width. The width
// per beat is at least MIN_PX_PER_BEAT and grows when the row has short chords, so their diagrams stay large.
// A row mixing meters counts measures of its longest one.
function makeRowCapacity(contentWidth, defaultMeter) {
  return (measures) => {
    const beatsPerMeasure = Math.max(...measures.map((m) => m.meter ?? defaultMeter))
    if (contentWidth <= 0) return MAX_MEASURES_PER_ROW * beatsPerMeasure
    const pxPerBeat = Math.max(
      MIN_PX_PER_BEAT,
      ...measures.map((m) => (MIN_DIAGRAM_SCALE * diagramNaturalWidth(m.notes) + CELL_PADDING) / m.beats),
    )
    const fitBeats = Math.floor((contentWidth - CLEF_GUTTER) / pxPerBeat)
    const measuresFit = Math.min(MAX_MEASURES_PER_ROW, Math.max(1, Math.floor(fitBeats / beatsPerMeasure)))
    return measuresFit * beatsPerMeasure
  }
}

// A lead sheet shows one chord symbol; labels can list several readings joined by " / ".
function primaryName(label) {
  return label.split(' / ')[0]
}

function useContentWidth() {
  const ref = useRef(null)
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return [ref, width]
}

// Renders the sheet to a PNG in the background (debounced) and keeps the blob ready, so Share can be
// called straight from a tap: iOS only allows share() during a user gesture. Whatever the sheet depends
// on gets a fresh `version`; a result only counts if it was rendered for the current version, which
// makes "preparing" derived state rather than something set inside the effect.
function useSheetImage(sheetRef, enabled, rows, title, contentWidth, handwritten) {
  const version = useMemo(
    () => ({ rows, title, contentWidth, handwritten }),
    [rows, title, contentWidth, handwritten],
  )
  const [result, setResult] = useState({ version: null, blob: null, failed: false })

  useEffect(() => {
    if (!enabled) return undefined
    let cancelled = false
    const timer = setTimeout(async () => {
      try {
        const blob = await renderSheetPng(sheetRef.current)
        if (!cancelled) setResult({ version, blob, failed: false })
      } catch {
        if (!cancelled) setResult({ version, blob: null, failed: true })
      }
    }, 400)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [sheetRef, enabled, version])

  const current = result.version === version ? result : null
  if (current?.blob) return { status: 'ready', blob: current.blob }
  return { status: current?.failed ? 'error' : 'preparing', blob: null }
}

function StaffRow({ row, impliedRepeatEndIds }) {
  const totalBeats = row.measures.reduce((sum, m) => sum + m.beats, 0) || 1

  const placed = row.measures.map((measure, i) => {
    const start = row.measures.slice(0, i).reduce((sum, m) => sum + m.beats, 0)
    return { ...measure, start, end: start + measure.beats }
  })

  // Repeat glyphs sit at chord boundaries and replace the plain barline at the same position. A first
  // ending's own last chord draws the end-repeat glyph even without an explicit `:|` — see
  // utils/repeats.js's endsRepeat, which playback follows the same way, so what's printed matches what's
  // heard.
  const repeatMarks = []
  placed.forEach((m) => {
    if (m.repeatStart) repeatMarks.push({ kind: 'start', x: m.start })
    if (m.repeatEnd || impliedRepeatEndIds.has(m.id)) repeatMarks.push({ kind: 'end', x: m.end })
  })
  const repeatXs = new Set(repeatMarks.map((mark) => mark.x))
  const barlineXs = barlinePositions(placed, totalBeats).filter((x) => !repeatXs.has(x))

  // Contiguous chords in the same ending share one bracket.
  const endings = []
  placed.forEach((m) => {
    if (!m.ending) return
    const last = endings[endings.length - 1]
    if (last && last.number === m.ending && last.end === m.start) last.end = m.end
    else endings.push({ number: m.ending, start: m.start, end: m.end })
  })
  const pct = (beats) => `${(beats / totalBeats) * 100}%`

  return (
    <div className="leadsheet-row">
      {row.label && <div className="leadsheet-row-label">{row.label}</div>}
      <div className="leadsheet-staff-line">
        <svg className="leadsheet-clef" viewBox="0 0 28 76" width="28" height="76" aria-hidden="true">
          <path d={TREBLE_CLEF_PATH} fill="#16131d" />
        </svg>
        <div className="leadsheet-staff-body">
          {endings.length > 0 && (
            <div className="leadsheet-endings">
              {endings.map((ending) => (
                <div
                  key={ending.start}
                  className="leadsheet-ending"
                  style={{ left: pct(ending.start), width: pct(ending.end - ending.start) }}
                >
                  {ending.number}.
                </div>
              ))}
            </div>
          )}
          <div className="leadsheet-annotations">
            {row.measures.map((measure) => (
              <div
                key={measure.id}
                className="leadsheet-annotation"
                style={{ flex: `${measure.beats} ${measure.beats} ${measure.beats * 30}px` }}
              >
                <div className="leadsheet-chord-name">{primaryName(measure.label)}</div>
                <PianoDiagram notes={measure.notes} />
              </div>
            ))}
          </div>
          <div className="leadsheet-staff-wrap">
          <svg
            className="leadsheet-staff-svg"
            viewBox={`0 0 ${totalBeats} 8`}
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            {STAFF_LINE_YS.map((y) => (
              <line
                key={y}
                x1={0}
                y1={y}
                x2={totalBeats}
                y2={y}
                className="leadsheet-staff-hairline"
                stroke="#8d8a99"
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
              />
            ))}
            {barlineXs.map((x) => (
              <line
                key={x}
                x1={x}
                y1={1.5}
                x2={x}
                y2={6.5}
                className="leadsheet-barline"
                stroke="#2a2733"
                strokeWidth={1.5}
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </svg>
          {repeatMarks.map((mark) => (
            <div
              key={`${mark.kind}-${mark.x}`}
              className={`repeat-mark ${mark.kind}`}
              style={{ left: pct(mark.x) }}
              aria-hidden="true"
            >
              <span className="rm-thick" />
              <span className="rm-thin" />
              <span className="rm-dots">
                <i />
                <i />
              </span>
            </div>
          ))}
          {placed
            .filter((m) => m.meterChange)
            .map((m) => (
              <div
                key={`meter-${m.id}`}
                className="time-signature"
                style={{ left: pct(m.start), marginLeft: m.repeatStart ? 20 : 6 }}
                aria-label={`${m.meter}/4 time`}
              >
                <span>{m.meter}</span>
                <span>4</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function LeadSheet({ progression, title, beatsPerMeasure }) {
  const [sheetRef, contentWidth] = useContentWidth()
  const rowCapacity = useMemo(
    () => makeRowCapacity(contentWidth, beatsPerMeasure),
    [contentWidth, beatsPerMeasure],
  )
  const rows = useMemo(
    () => buildLeadSheetRows(progression, rowCapacity, beatsPerMeasure),
    [progression, rowCapacity, beatsPerMeasure],
  )
  // A first ending's own last chord always closes its repeat when played (see utils/repeats.js), even
  // without an explicit `:|` — computed here, once, over the real progression (not a row's measures, so
  // an ending that wraps onto a second printed row is still identified correctly either way).
  const impliedRepeatEndIds = useMemo(
    () =>
      new Set(
        progression
          .map((entry, i) => (entry.type === 'chord' && endsRepeat(progression, i) ? entry.id : null))
          .filter(Boolean),
      ),
    [progression],
  )
  const [canShare] = useState(() => canShareImageFiles())
  const [handwritten, setHandwritten] = useState(() => loadHandwrittenChords())
  const image = useSheetImage(sheetRef, rows.length > 0, rows, title, contentWidth, handwritten)

  function changeHandwritten(next) {
    setHandwritten(next)
    saveHandwrittenChords(next)
  }

  return (
    <div className="leadsheet-page">
      {rows.length > 0 && (
        <div className="leadsheet-toolbar no-print">
          <label className="leadsheet-handwritten-toggle">
            <input
              type="checkbox"
              checked={handwritten}
              onChange={(event) => changeHandwritten(event.target.checked)}
            />
            Handwritten chord names
          </label>
          <span className="leadsheet-image-status" role="status">
            {image.status === 'preparing' && 'Preparing image…'}
            {image.status === 'error' &&
              "Couldn't create the image. Use Print / Save as PDF instead."}
          </span>
          {canShare && (
            <button
              type="button"
              className="btn btn-secondary share-button"
              disabled={!image.blob}
              onClick={() => shareSheetPng(image.blob, title)}
            >
              Share
            </button>
          )}
          <button
            type="button"
            className="btn btn-secondary download-png-button"
            disabled={!image.blob}
            onClick={() => downloadSheetPng(image.blob, title)}
          >
            Download PNG
          </button>
          <button
            type="button"
            className="btn btn-primary print-button no-print"
            onClick={() => window.print()}
          >
            Print / Save as PDF
          </button>
        </div>
      )}
      <div className="leadsheet-sheet">
        {/* The paper is a separate inner element so the PNG captures it without the card's border and shadow. */}
        <div className={`leadsheet-paper ${handwritten ? 'handwritten' : ''}`} ref={sheetRef}>
          {rows.length === 0 ? (
            <p className="leadsheet-empty">Add some chords to see your lead sheet.</p>
          ) : (
            <>
              {title.trim() && <h2 className="leadsheet-title">{title.trim()}</h2>}
              <div className="leadsheet">
                {rows.map((row, index) => (
                  <StaffRow
                    key={row.measures[0]?.id ?? `label-${index}`}
                    row={row}
                    impliedRepeatEndIds={impliedRepeatEndIds}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default LeadSheet
