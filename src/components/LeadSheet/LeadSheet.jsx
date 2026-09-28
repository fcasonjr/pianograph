import { useEffect, useMemo, useRef, useState } from 'react'
import PianoDiagram from '../PianoDiagram/PianoDiagram'
import { buildLeadSheetRows } from '../../utils/leadsheetLayout'
import { TREBLE_CLEF_PATH } from './trebleClef'
import {
  canShareImageFiles,
  downloadSheetPng,
  renderSheetPng,
  shareSheetPng,
} from '../../utils/sheetImage'
import './LeadSheet.css'

const STAFF_LINE_YS = [2, 3, 4, 5, 6]
// Clef width (28px) + gap (6px) in LeadSheet.css; keep in sync.
const CLEF_GUTTER = 34
const MIN_PX_PER_BEAT = 48
const MAX_MEASURES_PER_ROW = 4

// Barlines sit on measure boundaries (every beatsPerMeasure beats from the row start),
// not between chords, so several short chords can share one measure.
function barlinePositions(totalBeats, beatsPerMeasure) {
  const xs = []
  for (let x = 0; x < totalBeats; x += beatsPerMeasure) xs.push(x)
  xs.push(totalBeats)
  return xs
}

// Rows hold a whole number of measures, as many as fit at a legible width per beat.
function beatsPerRowFor(contentWidth, beatsPerMeasure) {
  if (contentWidth <= 0) return MAX_MEASURES_PER_ROW * beatsPerMeasure
  const fitBeats = Math.floor((contentWidth - CLEF_GUTTER) / MIN_PX_PER_BEAT)
  const measures = Math.min(MAX_MEASURES_PER_ROW, Math.max(1, Math.floor(fitBeats / beatsPerMeasure)))
  return measures * beatsPerMeasure
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
function useSheetImage(sheetRef, enabled, rows, title, contentWidth) {
  const version = useMemo(() => ({ rows, title, contentWidth }), [rows, title, contentWidth])
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

function StaffRow({ row, beatsPerMeasure }) {
  const totalBeats = row.measures.reduce((sum, m) => sum + m.beats, 0) || 1

  let cursor = 0
  const placed = row.measures.map((measure) => {
    const start = cursor
    cursor += measure.beats
    return { ...measure, start, end: cursor }
  })

  // Repeat glyphs sit at chord boundaries and replace the plain barline at the same position.
  const repeatMarks = []
  placed.forEach((m) => {
    if (m.repeatStart) repeatMarks.push({ kind: 'start', x: m.start })
    if (m.repeatEnd) repeatMarks.push({ kind: 'end', x: m.end })
  })
  const repeatXs = new Set(repeatMarks.map((mark) => mark.x))
  const barlineXs = barlinePositions(totalBeats, beatsPerMeasure).filter((x) => !repeatXs.has(x))

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
          </div>
        </div>
      </div>
    </div>
  )
}

function LeadSheet({ progression, title, beatsPerMeasure }) {
  const [sheetRef, contentWidth] = useContentWidth()
  const maxBeatsPerRow = beatsPerRowFor(contentWidth, beatsPerMeasure)
  const rows = useMemo(
    () => buildLeadSheetRows(progression, maxBeatsPerRow),
    [progression, maxBeatsPerRow],
  )
  const image = useSheetImage(sheetRef, rows.length > 0, rows, title, contentWidth)
  const [canShare] = useState(() => canShareImageFiles())

  return (
    <div className="leadsheet-page">
      {rows.length > 0 && (
        <div className="leadsheet-toolbar no-print">
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
        <div className="leadsheet-paper" ref={sheetRef}>
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
                    beatsPerMeasure={beatsPerMeasure}
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
