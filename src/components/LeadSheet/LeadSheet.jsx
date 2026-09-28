import { useMemo } from 'react'
import PianoDiagram from '../PianoDiagram/PianoDiagram'
import { buildLeadSheetRows } from '../../utils/leadsheetLayout'
import './LeadSheet.css'

const STAFF_LINE_YS = [2, 3, 4, 5, 6]

function StaffRow({ row }) {
  const totalBeats = row.measures.reduce((sum, m) => sum + m.beats, 0) || 1

  let cursor = 0
  const barlineXs = [0]
  row.measures.forEach((measure) => {
    cursor += measure.beats
    barlineXs.push(cursor)
  })

  return (
    <div className="leadsheet-row">
      {row.label && <div className="leadsheet-row-label">{row.label}</div>}
      <div className="leadsheet-staff-line">
        <div className="leadsheet-clef" aria-hidden="true">
          𝄞
        </div>
        <div className="leadsheet-staff-body">
          <div className="leadsheet-annotations">
            {row.measures.map((measure) => (
              <div
                key={measure.id}
                className="leadsheet-annotation"
                style={{ flex: `${measure.beats} ${measure.beats} ${measure.beats * 30}px` }}
              >
                <div className="leadsheet-chord-name">{measure.label}</div>
                <PianoDiagram notes={measure.notes} />
              </div>
            ))}
          </div>
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
        </div>
      </div>
    </div>
  )
}

function LeadSheet({ progression, title }) {
  const rows = useMemo(() => buildLeadSheetRows(progression), [progression])

  if (rows.length === 0) {
    return <p className="leadsheet-empty">Add some chords to see your lead sheet.</p>
  }

  return (
    <div className="leadsheet-page">
      <div className="leadsheet-toolbar no-print">
        <button
          type="button"
          className="btn btn-primary print-button no-print"
          onClick={() => window.print()}
        >
          Print / Save as PDF
        </button>
      </div>
      <div className="leadsheet-sheet">
        {title.trim() && <h2 className="leadsheet-title">{title.trim()}</h2>}
        <div className="leadsheet">
          {rows.map((row, index) => (
            <StaffRow key={row.measures[0]?.id ?? `label-${index}`} row={row} />
          ))}
        </div>
      </div>
    </div>
  )
}

export default LeadSheet
