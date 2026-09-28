import { useEffect, useMemo, useRef, useState } from 'react'
import PianoDiagram from '../PianoDiagram/PianoDiagram'
import { buildLeadSheetRows } from '../../utils/leadsheetLayout'
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
        <div className="leadsheet-clef" aria-hidden="true">
          𝄞
        </div>
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
              <line key={y} x1={0} y1={y} x2={totalBeats} y2={y} className="leadsheet-staff-hairline" />
            ))}
            {barlineXs.map((x) => (
              <line key={x} x1={x} y1={1.5} x2={x} y2={6.5} className="leadsheet-barline" />
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

  return (
    <div className="leadsheet-page">
      {rows.length > 0 && (
        <div className="leadsheet-toolbar no-print">
          <button
            type="button"
            className="btn btn-primary print-button no-print"
            onClick={() => window.print()}
          >
            Print / Save as PDF
          </button>
        </div>
      )}
      <div className="leadsheet-sheet" ref={sheetRef}>
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
  )
}

export default LeadSheet
