import { BPLO_SERVICES } from './services.js';

const validDay = value => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

// SQL dates without an offset keep their calendar day. Offset-bearing timestamps use Philippine time.
export function reportDay(value) {
  if (typeof value !== 'string') return '';
  const match = value.trim().match(/^(\d{4}-\d{2}-\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,6})?)?(Z|[+-]\d{2}:?\d{2})?)?$/);
  if (!match || !validDay(match[1]) || Number(match[2] || 0) > 23 || Number(match[3] || 0) > 59 || Number(match[4] || 0) > 59) return '';
  if (!match[5]) return match[1];
  const date = new Date(value.trim().replace(' ', 'T'));
  if (!Number.isFinite(date.getTime())) return '';
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en', { timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date).map(part => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function rangeError({ from = '', to = '' } = {}) {
  if (!from && !to) return '';
  if (!from || !to) return 'Select both From and To dates, or clear the date range.';
  if (!validDay(from) || !validDay(to)) return 'Select valid From and To dates.';
  return from > to ? 'From date must be on or before To date.' : '';
}

export function inReportRange(value, range = {}) {
  if (rangeError(range)) return false;
  if (!range.from && !range.to) return true;
  const day = reportDay(value);
  // Comparing calendar dates includes the entire To day, including late-night timestamps.
  return Boolean(day && day >= range.from && day <= range.to);
}

const ordered = (items, getDate) => [...items].sort((a, b) => reportDay(getDate(a)).localeCompare(reportDay(getDate(b))) || String(getDate(a) || '').localeCompare(String(getDate(b) || '')));
const dayCells = value => {
  const day = reportDay(value);
  if (!day) return ['—', '—', '—'];
  const date = new Date(`${day}T00:00:00Z`);
  return [day, date.toLocaleDateString('en-PH', { month: 'long', timeZone: 'UTC' }), date.getUTCFullYear()];
};

export function buildReports({ apps = [], people = [] }, range = {}) {
  const applications = ordered(apps.filter(app => inReportRange(app.submittedAt, range)), app => app.submittedAt);
  const applicants = [...people].filter(person => inReportRange(person.createdAt, range))
    .sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
  const inspections = ordered(apps.filter(app => app.inspection?.date && inReportRange(app.inspection.date, range)), app => app.inspection.date);
  const documents = ordered(apps.flatMap(app => (app.documents || []).map(doc => ({ app, doc })))
    .filter(({ doc }) => inReportRange(doc.savedAt, range)), ({ doc }) => doc.savedAt);
  const ranked = rows => rows.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const types = [...new Set(applications.map(app => app.businessType).filter(Boolean))];
  return [
    { id: 'applications', title: 'Application Report', description: 'By submission date, oldest first.', dateBasis: 'Submission date', count: applications.length,
      data: [['Application No.', 'Business', 'Status', 'Date Submitted', 'Month', 'Year'], ...applications.map(app => [app.referenceNumber, app.businessName, app.status, ...dayCells(app.submittedAt)])] },
    { id: 'applicants', title: 'Applicant Report', description: 'By registration date, sorted by applicant name.', dateBasis: 'Registration date', count: applicants.length,
      data: [['ID', 'Name', 'Email', 'Contact', 'Address', 'Registration Date'], ...applicants.map(person => [person.id, person.name, person.email, person.phone, person.address, reportDay(person.createdAt) || '—'])] },
    { id: 'inspections', title: 'Inspection Report', description: 'By scheduled inspection date, oldest first.', dateBasis: 'Inspection date', count: inspections.length,
      data: [['Application No.', 'Business', 'Date', 'Month', 'Year', 'Time', 'Inspector'], ...inspections.map(app => [app.referenceNumber, app.businessName, ...dayCells(app.inspection.date), app.inspection.time, app.inspection.inspector])] },
    { id: 'documents', title: 'Document Report', description: 'By document upload date, oldest first.', dateBasis: 'Upload date', count: documents.length,
      data: [['Application No.', 'Document', 'File', 'Status', 'Upload Date', 'Month', 'Year'], ...documents.map(({ app, doc }) => [app.referenceNumber, doc.documentType, doc.fileName, doc.reviewStatus || 'Pending', ...dayCells(doc.savedAt)])] },
    { id: 'services', title: 'BPLO Services Report', description: 'Counts applications submitted within the selected dates.', dateBasis: 'Submission date', count: applications.length,
      data: [['Service', 'Applications'], ...ranked(BPLO_SERVICES.map(service => [service.name, applications.filter(app => app.serviceType === service.id).length]))] },
    { id: 'types', title: 'Business Type Report', description: 'Counts applications submitted within the selected dates.', dateBasis: 'Submission date', count: applications.length,
      data: [['Business Type', 'Applications'], ...ranked(types.map(type => [type, applications.filter(app => app.businessType === type).length]))] },
  ];
}

export function reportRangeLabel({ from, to }) {
  if (!from && !to) return 'All dates';
  if (rangeError({ from, to })) return 'Complete a valid date range';
  const format = day => new Date(`${day}T00:00:00Z`).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  return `${format(from)} to ${format(to)} (inclusive)`;
}
