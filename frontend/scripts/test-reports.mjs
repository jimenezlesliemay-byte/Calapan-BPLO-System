import assert from 'node:assert/strict';
import { buildReports, inReportRange, rangeError, reportDay, reportRangeLabel } from '../src/shared/reporting.js';

const range = { from: '2026-11-01', to: '2026-12-31' };
assert.equal(rangeError(range), '');
assert.equal(rangeError({}), '');
assert(rangeError({ from: '2026-11-01' }));
assert(rangeError({ to: '2026-12-31' }));
assert(rangeError({ from: '2026-12-31', to: '2026-11-01' }));
assert(rangeError({ from: '2026-11-31', to: '2026-12-31' }));
assert.equal(reportDay('2026-11-31 12:00:00'), '');
assert.equal(reportDay('2026-11-01 24:00:00'), '');
assert.equal(reportDay(null), '');
assert.equal(reportDay('2026-11-01'), '2026-11-01');
assert.equal(reportDay('2026-10-31T16:00:00Z'), '2026-11-01');
assert.equal(reportDay('2026-12-31T15:59:59.999Z'), '2026-12-31');
assert.equal(reportDay('2026-12-31T16:00:00Z'), '2027-01-01');
assert.equal(inReportRange('2026-11-01 00:00:00', range), true);
assert.equal(inReportRange('2026-12-31 23:59:59.999999', range), true);
assert.equal(inReportRange('2026-10-31 23:59:59', range), false);
assert.equal(inReportRange('2027-01-01 00:00:00', range), false);
assert.equal(inReportRange('2026-12-31T16:00:00Z', range), false);
assert.equal(inReportRange(undefined, range), false);
assert.equal(inReportRange(undefined, {}), true);
assert.equal(inReportRange('2026-11-01', { from: range.from }), false);
assert.equal(inReportRange('2026-11-01 23:59:59', { from: range.from, to: range.from }), true);
assert(reportRangeLabel(range).includes('2026') && reportRangeLabel(range).includes('inclusive'));
assert.equal(reportRangeLabel({}), 'All dates');

const app = (referenceNumber, submittedAt, businessType = 'Retail') => ({ referenceNumber, submittedAt, businessType,
  businessName: referenceNumber, serviceType: 'business-registration', status: 'Pending', documents: [] });
const apps = [
  { ...app('BEFORE', '2026-10-31 23:59:59'), inspection: { date: '2026-11-17', time: '09:00', inspector: 'Inspector A' },
    documents: [{ documentType: 'Inside', fileName: 'inside.pdf', savedAt: '2026-11-02 08:00:00' }] },
  { ...app('END', '2026-12-31 23:59:59.999', 'Services'), inspection: { date: '2026-12-31', time: '10:00', inspector: 'Inspector B' },
    documents: [{ documentType: 'Last day', fileName: 'last.pdf', savedAt: '2026-12-31 23:59:59' }] },
  { ...app('START', '2026-11-01 00:00:00'), inspection: { date: '2027-01-01', time: '11:00', inspector: 'Inspector C' },
    documents: [{ documentType: 'Before range', savedAt: '2026-10-31 23:59:59' }, { documentType: 'Missing date' }] },
  app('OFFSET-INSIDE', '2026-10-31T16:00:00Z'),
  app('OFFSET-AFTER', '2026-12-31T16:00:00Z'),
  { ...app('AFTER', '2027-01-01 00:00:00'), documents: [{ savedAt: '2027-01-01 00:00:00' }] },
  app('UNDATED', null),
];
const people = [
  { id: 'outside', name: 'Outside', createdAt: '2026-10-31 23:59:59' },
  { id: 'last', name: 'Zeta', createdAt: '2026-12-31 23:59:59' },
  { id: 'first', name: 'Alpha', createdAt: '2026-11-01 00:00:00' },
  { id: 'missing', name: 'Unknown' },
  { id: 'future', name: 'Future', createdAt: '2027-01-01 00:00:00' },
];
const original = JSON.stringify({ apps, people });
const reports = buildReports({ apps, people }, range);
const byId = Object.fromEntries(reports.map(report => [report.id, report]));
assert.equal(reports.length, 6);
assert.deepEqual(new Set(byId.applications.data.slice(1).map(row => row[0])), new Set(['START', 'END', 'OFFSET-INSIDE']));
assert.equal(byId.applications.data.at(-1)[0], 'END');
assert.deepEqual(byId.applicants.data.slice(1).map(row => row[0]), ['first', 'last']);
assert.deepEqual(byId.inspections.data.slice(1).map(row => row[0]), ['BEFORE', 'END'], 'Inspection date applies independently of application submission');
assert.deepEqual(byId.documents.data.slice(1).map(row => row[1]), ['Inside', 'Last day'], 'Document upload date applies independently of parent application date');
assert.equal(byId.services.data.slice(1).reduce((total, row) => total + row[1], 0), 3, 'Service counts exclude outside-range applications');
assert.deepEqual(byId.types.data.slice(1), [['Retail', 2], ['Services', 1]], 'Business counts use only in-range applications');
assert.equal(byId.services.count, 3);
assert.equal(byId.documents.count, 2);
for (const report of reports) {
  const width = report.data[0].length;
  assert(report.data.every(row => row.length === width), `${report.id}: exported cells match column headers`);
}
assert.equal(JSON.stringify({ apps, people }), original, 'Report filters do not mutate dashboard records');
const allDates = Object.fromEntries(buildReports({ apps, people }).map(report => [report.id, report]));
assert.equal(allDates.applications.count, apps.length);
assert.equal(allDates.applicants.count, people.length);
const empty = buildReports({ apps, people }, { from: '2030-01-01', to: '2030-12-31' });
assert(empty.every(report => report.count === 0), 'No matching data means every report export is empty/disabled');
const invalid = buildReports({ apps, people }, { from: '2026-12-31', to: '2026-11-01' });
assert(invalid.every(report => report.count === 0), 'Invalid range never returns all records');
console.log('PASS: inclusive dates, last-day timestamps, Philippine timezone boundaries, invalid ranges, six report datasets, filtered totals, empty results and unchanged source records.');
