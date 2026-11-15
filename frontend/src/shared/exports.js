import { serviceLabel } from './services.js';
export const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
export function printApplication(app, kind = 'Application') {
  const rows = [
    ['Application type', app.applicationType || 'New'],
    ['BPLO service', serviceLabel(app.serviceType)],
    ['Business category', app.businessType],
    ['Nature of business', app.natureOfBusiness],
    ['Business address', app.businessAddress],
    ['Applicant', app.fullName],
    ['Email', app.email],
    ['Phone', app.contactNumber],
    ['Current status', app.status],
    ['Inspection date', app.inspection?.date],
    ['Date submitted', app.submittedAt ? new Date(app.submittedAt).toLocaleDateString('en-PH') : '—'],
  ];
  const sections = [
    ['Application details', rows.slice(0, 2)],
    ['Business details', rows.slice(2, 5)],
    ['Applicant details', rows.slice(5, 8)],
    ['Processing details', rows.slice(8)],
  ];
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>BPLO ${escapeHTML(kind)} - ${escapeHTML(app.referenceNumber)}</title><style>
    @page{size:A4 portrait;margin:8mm}
    *{box-sizing:border-box}
    body{margin:0;padding:24px;background:#edf1ed;color:#263b32;font:14px/1.5 Georgia,"Times New Roman",serif}
    .paper{max-width:800px;min-height:1050px;margin:0 auto;padding:16px;background:#fff;box-shadow:0 5px 24px #17281b1c}
    .certificate{min-height:1018px;border:3px double #a88943;padding:30px 38px;position:relative}
    .letterhead{display:flex;align-items:center;justify-content:center;gap:18px;text-align:center;padding:0 0 20px;border-bottom:1px solid #a88943}
    .seal{width:78px;height:78px;object-fit:contain;flex:0 0 auto}
    .letterhead-copy{color:#40584b;font:12px/1.6 Arial,sans-serif}
    .letterhead-copy strong{display:block;color:#193e31;font:700 17px/1.4 Georgia,"Times New Roman",serif;letter-spacing:.04em}
    .letterhead-copy span{display:block;text-transform:uppercase;letter-spacing:.12em;font-size:10px}
    .heading{text-align:center;padding:24px 0 18px}
    .demo-label{display:inline-block;border:1px solid #a88943;padding:4px 10px;color:#76602e;font:700 9px Arial,sans-serif;letter-spacing:.12em}
    h1{margin:14px 0 3px;color:#193e31;font-size:29px;font-weight:600;line-height:1.2}
    .subtitle{margin:0;color:#7a6230;font:700 12px Arial,sans-serif;letter-spacing:.2em;text-transform:uppercase}
    .not-permit{display:inline-block;margin-top:14px;padding:6px 12px;background:#f8eee8;color:#8b3d2c;font:700 10px Arial,sans-serif;letter-spacing:.1em}
    .reference{display:flex;align-items:center;justify-content:space-between;gap:16px;margin:8px 0 16px;padding:13px 16px;border:1px solid #d6c69d;background:#fbfaf6}
    .reference span{color:#786638;font:700 9px Arial,sans-serif;letter-spacing:.13em}
    .reference strong{color:#193e31;font:700 15px Arial,sans-serif;overflow-wrap:anywhere}
    .intro{margin:0 0 18px;color:#536258;text-align:center;font-size:13px}
    .record-section{margin:0 0 14px}
    .record-section h2{margin:0;padding:7px 10px;background:#f3f5f0;border-left:3px solid #a88943;color:#294a3a;font:700 10px Arial,sans-serif;letter-spacing:.11em;text-transform:uppercase}
    table{width:100%;border-collapse:collapse;font:12px/1.45 Arial,sans-serif}
    td{padding:7px 10px;border-bottom:1px solid #e5e8e2;vertical-align:top;overflow-wrap:anywhere}
    td:first-child{width:34%;color:#526257;font-weight:600}
    td:last-child{color:#263b32}
    .status{font-weight:700;color:#254f3d}
    .notice{margin:22px 0 0;padding:12px 14px;border:1px solid #d8b8a8;background:#fbf5f1;color:#713d2d;font:11px/1.55 Arial,sans-serif;text-align:center}
    .foot{margin:12px 0 0;color:#788078;font:10px/1.5 Arial,sans-serif;text-align:center}
    .actions{text-align:center;margin:18px auto 0}
    button{padding:10px 18px;border:0;border-radius:4px;background:#214b3a;color:#fff;font:600 13px Arial,sans-serif;cursor:pointer}
    @media print{
      body{padding:0;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}
      .paper{max-width:none;min-height:0;margin:0;padding:0;box-shadow:none}
      .certificate{min-height:0;padding:10px 18px}
      .letterhead{gap:12px;padding-bottom:9px}
      .seal{width:52px;height:52px}
      .letterhead-copy{font-size:10px;line-height:1.35}
      .letterhead-copy strong{font-size:14px}
      .letterhead-copy span{font-size:8px}
      .heading{padding:10px 0 8px}
      .demo-label{padding:3px 8px;font-size:8px}
      h1{margin:7px 0 2px;font-size:23px}
      .subtitle{font-size:10px}
      .not-permit{margin-top:7px;padding:4px 9px;font-size:8px}
      .reference{gap:10px;margin:4px 0 8px;padding:7px 10px}
      .reference span{font-size:8px}
      .reference strong{font-size:12px}
      .intro{margin:0 0 8px;font-size:10px;line-height:1.35}
      .record-section{margin:0 0 6px;break-inside:avoid}
      .record-section h2{padding:4px 8px;font-size:8px}
      table{font-size:10px;line-height:1.25}
      td{padding:3px 8px}
      .notice{margin:9px 0 0;padding:7px 9px;font-size:9px;line-height:1.35}
      .foot{margin:6px 0 0;font-size:8px}
      .actions{display:none}
    }
    @media screen and (max-width:600px){body{padding:8px}.paper{min-height:0;padding:8px}.certificate{min-height:0;padding:18px 14px}.letterhead{gap:10px}.seal{width:58px;height:58px}.letterhead-copy strong{font-size:14px}h1{font-size:23px}.reference{align-items:flex-start;flex-direction:column;gap:5px}}
  </style></head><body><main class="paper"><article class="certificate">
    <header class="letterhead"><img class="seal" src="/calapan-bplo-logo.png" alt="Calapan City seal"><div class="letterhead-copy">Republic of the Philippines<strong>City Government of Calapan</strong><span>Business Permits and Licensing Office</span></div></header>
    <section class="heading"><span class="demo-label">STUDENT DEMONSTRATION • UNOFFICIAL RECORD</span><h1>Business Permit Application</h1><p class="subtitle">Application Record</p><span class="not-permit">APPLICATION COPY — NOT A BUSINESS PERMIT</span></section>
    <div class="reference"><span>APPLICATION REFERENCE</span><strong>${escapeHTML(app.referenceNumber || '—')}</strong></div>
    <p class="intro">This record summarizes the application details submitted through the Calapan City BPLO prototype. It does not certify approval, payment, inspection, or issuance.</p>
    ${sections.map(([title, sectionRows]) => `<section class="record-section"><h2>${title}</h2><table><tbody>${sectionRows.map(([label, value]) => `<tr><td>${escapeHTML(label)}</td><td${label === 'Current status' ? ' class="status"' : ''}>${escapeHTML(value || '—')}</td></tr>`).join('')}</tbody></table></section>`).join('')}
    <p class="notice"><strong>DEMONSTRATION DOCUMENT — NOT GOVERNMENT-ISSUED</strong><br>This prototype-generated record is for demonstration and application tracking only. It is not a permit, proof of approval, or proof of payment.</p>
    <p class="foot">For official requirements and permit status, contact the appropriate Calapan City office.</p>
  </article></main><div class="actions"><button onclick="window.print()">Print / Save as PDF</button></div><script>window.addEventListener('load',()=>setTimeout(()=>window.print(),300));<\/script></body></html>`;
  const win=window.open('','_blank'); if(!win) throw Error('Please allow pop-ups to print or save as PDF.'); win.document.open(); win.document.write(html); win.document.close();
}
export function printReport(title, data) {
  const [head, ...rows] = data;
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHTML(title)}</title><style>
    :root{color-scheme:light}*{box-sizing:border-box}body{font-family:Arial,sans-serif;padding:30px;color:#263b32;background:#f3f6f2}
    .report{max-width:1100px;margin:0 auto;padding:32px;background:#fff;border-top:8px solid #c65a0a;box-shadow:0 4px 20px #263b3218}
    .letterhead{display:flex;align-items:center;justify-content:center;gap:18px;padding:0 0 20px;border-bottom:2px solid #d8c49a;text-align:center}
    .logo{width:76px;height:76px;object-fit:contain}.office{color:#536258;font-size:13px;line-height:1.55}.office strong{display:block;color:#214b3a;font-size:19px}.office span{display:block;color:#a34b0a;font-weight:700;letter-spacing:.08em;text-transform:uppercase}
    h1{font-size:24px;color:#214b3a;margin:24px 0 6px}.subtitle{margin:0 0 20px;color:#6b7c70;font-size:13px}
    .table-wrap{overflow-x:auto}table{width:100%;border-collapse:collapse}td,th{padding:10px 12px;border:1px solid #d9e3dc;text-align:left;font-size:12px}th{background:#214b3a;color:#fff;font-weight:700}tbody tr:nth-child(even){background:#f1f7f3}tbody tr:hover{background:#fff1df}
    footer{font-size:11px;color:#6b7c70;margin-top:24px;padding-top:12px;border-top:2px solid #d8c49a}button{margin-top:20px;padding:10px 16px;border:0;border-radius:6px;background:#c65a0a;color:#fff;font-weight:700;cursor:pointer}
    @media print{body{padding:0;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}.report{max-width:none;padding:12px;border-top-width:6px;box-shadow:none}.table-wrap{overflow:visible}button{display:none}}
    @media(max-width:600px){body{padding:8px}.report{padding:16px}.logo{width:58px;height:58px}.office strong{font-size:16px}}
  </style></head><body><main class="report"><header class="letterhead"><img class="logo" src="/calapan-bplo-logo.png" alt="Calapan City logo"><div class="office">Republic of the Philippines<strong>City Government of Calapan</strong><span>Business Permits and Licensing Office</span></div></header><h1>${escapeHTML(title)}</h1><p class="subtitle">Calapan City BPLO • Student demonstration report</p><div class="table-wrap"><table><thead><tr>${head.map(h=>`<th>${escapeHTML(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(v=>`<td>${escapeHTML(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div><footer>Unofficial demonstration report. Not sourced from a production database.</footer><button onclick="window.print()">Print / Save as PDF</button></main><script>window.addEventListener('load',()=>setTimeout(()=>window.print(),300));<\/script></body></html>`;
  const w=window.open('','_blank');if(!w)throw Error('Please allow pop-ups for PDF printing.');w.document.open();w.document.write(html);w.document.close();
}
export function downloadInspectionCalendar(app) {
  const i = app.inspection; if (!i?.date || !i?.time) throw Error('No inspection schedule.');
  const start = new Date(`${i.date}T${i.time}:00`); if (Number.isNaN(start.getTime())) throw Error('Invalid inspection date.');
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const fmt = d => `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}T${String(d.getHours()).padStart(2,'0')}${String(d.getMinutes()).padStart(2,'0')}00`;
  const esc = s => String(s||'').replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');
  const ics = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//BPLO Student Prototype//EN','BEGIN:VEVENT',`UID:${app.referenceNumber}@bplo-demo`,`DTSTAMP:${new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'')}`,`DTSTART:${fmt(start)}`,`DTEND:${fmt(end)}`,`SUMMARY:${esc('BPLO Inspection - ' + app.businessName)}`,`LOCATION:${esc(app.businessAddress)}`,`DESCRIPTION:${esc('Reference: ' + app.referenceNumber + ' | Inspector: ' + i.inspector)}`,'END:VEVENT','END:VCALENDAR'].join('\r\n');
  const a=document.createElement('a'); const url=URL.createObjectURL(new Blob([ics],{type:'text/calendar'})); a.href=url;a.download=`${app.referenceNumber}-inspection.ics`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
export const mapUrl = app => app.latitude && app.longitude ? `https://www.google.com/maps?q=${encodeURIComponent(`${app.latitude},${app.longitude}`)}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(app.businessAddress||'Calapan City')}`;
