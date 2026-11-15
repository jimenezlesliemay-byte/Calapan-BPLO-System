import React, { useState } from 'react';
import { Files, Users, CalendarDays, FolderCheck, ChartNoAxesCombined, Download, Printer } from 'lucide-react';
import { buildReports, rangeError, reportRangeLabel } from '../shared/reporting';
import { printReport } from '../shared/exports';

const icons = { applications: Files, applicants: Users, inspections: CalendarDays, documents: FolderCheck, services: FolderCheck, types: ChartNoAxesCombined };

export default function ReportsPage({ apps, people, onCsv }) {
  const [range, setRange] = useState({ from: '', to: '' });
  const error = rangeError(range);
  const label = reportRangeLabel(range);
  const reports = buildReports({ apps, people }, range);
  const change = (key, value) => setRange(current => ({ ...current, [key]: value }));
  const fileSuffix = range.from && range.to ? `_${range.from}_to_${range.to}` : '_all-dates';
  return <>
    <section className="ad-card ad-report-range">
      <div><h3>Report date range</h3><p className="muted">Select the dates to include in CSV and Print / PDF exports. Both dates are included.</p></div>
      <div className="ad-report-range-fields">
        <label>From date<input type="date" value={range.from} max={range.to || undefined} onChange={event => change('from', event.target.value)} /></label>
        <label>To date<input type="date" value={range.to} min={range.from || undefined} onChange={event => change('to', event.target.value)} /></label>
        <button className="ad-btn" onClick={() => setRange({ from: '', to: '' })} disabled={!range.from && !range.to}>Clear dates</button>
      </div>
      {error ? <p className="ad-err" role="alert">{error}</p> : <p className="ad-report-range-summary" role="status">Export range: <strong>{label}</strong></p>}
    </section>
    <div className="ad-two">{reports.map(report => {
      const Icon = icons[report.id];
      const disabled = Boolean(error) || report.count === 0;
      return <section className="ad-card ad-report" key={report.id}>
        <span className="ad-box"><Icon size={24} /></span><div>
          <h3>{report.title}</h3><p className="muted">{report.description}</p>
          <p className="ad-report-count">{error ? 'Complete the date range to export.' : `${report.count} matching record${report.count === 1 ? '' : 's'}`}<small>Date used: {report.dateBasis}</small></p>
          {!error && !report.count && <p className="muted">No records found for this date range.</p>}
          <div className="ad-actions left">
            <button className="ad-btn sm" disabled={disabled} onClick={() => { if (!disabled) onCsv(report.title + fileSuffix, report.data); }}><Download size={14} />CSV</button>
            <button className="ad-btn sm" disabled={disabled} onClick={() => { if (!disabled) printReport(`${report.title} — ${label}`, report.data); }}><Printer size={14} />Print / PDF</button>
          </div>
        </div>
      </section>;
    })}</div>
  </>;
}
