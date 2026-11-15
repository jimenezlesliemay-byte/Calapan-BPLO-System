import React, { useEffect, useRef, useState } from 'react';
import { LayoutDashboard, Files, Users, FolderCheck, Bell, ChartNoAxesCombined, Settings as Cog, LogOut, Menu, Search, Plus, Eye, Pencil, Trash2, ArrowLeft, Printer, X, Download, CalendarDays, History, MapPin } from 'lucide-react';
import { api, defaultCfg } from '../api';
import { openDocument } from '../shared/files';
import { getRequirements, saveRequirements } from '../shared/requirements';
import { BPLO_SERVICES, serviceLabel } from '../shared/services';
import { printApplication, mapUrl, downloadInspectionCalendar } from '../shared/exports';
import './admin.css';
import PaymentsPage, { PaymentPanel } from '../shared/Payments';
import ReportsPage from './ReportsPage';

const NAV = [['Dashboard', LayoutDashboard], ['Services', FolderCheck], ['Applications', Files], ['Payments', FolderCheck], ['Applicants', Users], ['Documents', FolderCheck], ['Inspections', CalendarDays], ['Notifications', Bell], ['Reports', ChartNoAxesCombined], ['Audit Logs', History], ['Settings', Cog]];
const STATUS = ['Pending', 'Under Review', 'Missing Requirements', 'Approved', 'Rejected', 'Released'];
const STATUS_COLORS = ['#e7a24b', '#8eaa76', '#d47a35', '#4f8966', '#bd6848', '#39745a'];
const SERVICE_COLORS = ['#4f8966', '#d47a35', '#79a176', '#e7a24b', '#39745a', '#bd8a45', '#8eaa76'];
const HEAD = {
  Dashboard: ['Dashboard', 'Overview of business permit applications.'],
  Services: ['BPLO Services', 'View the seven service categories and related demo applications.'],
  Applications: ['Manage Applications', 'View and handle all business permit applications.'],
  Payments: ['Payments', 'Assess fees and verify manual payment transactions.'],
  Applicants: ['Manage Applicants', 'View and manage registered applicants.'],
  Documents: ['Document Verification', 'Review and verify uploaded documents from applicants.'],
  Inspections: ['Inspection Scheduling', 'Plan site inspections and export calendar invitations.'],
  'Audit Logs': ['Audit Logs', 'Trace changes made to the demo records.'],
  Notifications: ['Notifications', 'Updates about applications and documents.'],
  Reports: ['Reports', 'View and generate system reports.'],
  Settings: ['Settings', 'Manage system settings and configuration.'],
};
const fmt = (v) => { const d = new Date(v); return isNaN(d) ? '—' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); };
const oldestFirst = (items, getDate) => [...items].sort((a, b) => {
  const aTime = Date.parse(getDate(a) || '');
  const bTime = Date.parse(getDate(b) || '');
  return (Number.isFinite(aTime) ? aTime : 0) - (Number.isFinite(bTime) ? bTime : 0);
});
const Badge = ({ s }) => <span className={'ad-badge ' + String(s).toLowerCase().replace(/\s+/g, '-')}>{s}</span>;
const Info = ({ rows }) => <dl className="ad-info">{rows.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v || '—'}</dd></div>)}</dl>;
const Empty = ({ children }) => <div className="ad-empty">{children}</div>;

function Modal({ title, onClose, children }) {
  return (
    <div className="ad-overlay" onClick={onClose}>
      <section className="ad-modal" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <button className="ad-x" aria-label="Close" onClick={onClose}><X size={18} /></button>
        <h2>{title}</h2>
        {children}
      </section>
    </div>
  );
}
function Confirm({ title, text, label, onYes, onClose }) {
  return (
    <Modal title={title} onClose={onClose}>
      <p className="muted">{text}</p>
      <div className="ad-actions"><button className="ad-btn" onClick={onClose}>Cancel</button><button className="ad-btn danger" onClick={onYes}>{label}</button></div>
    </Modal>
  );
}
function ReviewForm({ options, status, remarks, needRemarks, onSave, label }) {
  const [s, setS] = useState(status);
  const [r, setR] = useState(remarks || '');
  const [saving, setSaving] = useState(false);
  return (
    <form onSubmit={async (e) => { e.preventDefault(); setSaving(true); try { await onSave(s, r); } finally { setSaving(false); } }}>
      <label>Status<select disabled={saving} value={s} onChange={(e) => setS(e.target.value)}>{options.map((o) => <option key={o}>{o}</option>)}</select></label>
      <label>Remarks{s === needRemarks && ' *'}<input disabled={saving} value={r} required={s === needRemarks} onChange={(e) => setR(e.target.value)} placeholder="Add remarks" /></label>
      <div className="ad-actions"><button className="ad-btn primary" disabled={saving}>{saving ? 'Saving…' : label}</button></div>
    </form>
  );
}
function PersonForm({ initial, people, onSave, onCancel }) {
  const [f, setF] = useState(initial);
  const [err, setErr] = useState({});
  const fields = [['name', 'Full name', 'text'], ['email', 'Email address', 'email'], ['phone', 'Contact number', 'tel'], ['address', 'Address', 'text']];
  function submit(e) {
    e.preventDefault();
    const x = {};
    if (!initial.id && (f.password||'').length < 8) x.password = 'Enter an initial password with 8 or more characters.';
    if (f.name.trim().length < 3) x.name = 'Enter the full name (at least 3 characters).';
    if (!/^\S+@\S+\.\S+$/.test(f.email)) x.email = 'Enter a valid email address.';
    else if (people.some((p) => p.id !== f.id && p.email.toLowerCase() === f.email.toLowerCase())) x.email = 'This email is already registered.';
    if (!/^(09|\+639)\d{9}$/.test(f.phone.replace(/[\s-]/g, ''))) x.phone = 'Use a PH mobile number, e.g. 0917 123 4567.';
    if (f.address.trim().length < 5) x.address = 'Enter the complete address.';
    setErr(x);
    if (!Object.keys(x).length) onSave({ ...f, name: f.name.trim(), email: f.email.trim(), address: f.address.trim() });
  }
  return (
    <form onSubmit={submit} noValidate>
      {fields.map(([k, label, type]) => (
        <label key={k}>{label} *<input type={type} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} aria-invalid={!!err[k]} />{err[k] && <em className="ad-err" role="alert">{err[k]}</em>}</label>
      ))}
      {!initial.id && <label>Initial password *<input type="password" autoComplete="new-password" required minLength={8} value={f.password||''} onChange={e=>setF({...f,password:e.target.value})}/></label>}
      <div className="ad-actions"><button type="button" className="ad-btn" onClick={onCancel}>Cancel</button><button className="ad-btn primary">Save applicant</button></div>
    </form>
  );
}
function AdminNewApplication({ onSave, onCancel }) {
  const [data,setData]=useState({serviceType:'business-registration',applicationType:'New',businessName:'',businessType:'Retail',natureOfBusiness:'',businessAddress:'',fullName:'',email:'',contactNumber:'',ownerAccountEmail:''});
  const [error,setError]=useState('');
  const field=(k,v)=>setData(s=>({...s,[k]:v}));
  function submit(e) { e.preventDefault();
    if(!data.businessName.trim() || !data.businessAddress.trim() || !data.fullName.trim() || !/^\S+@\S+\.\S+$/.test(data.email) || !/^(09\d{9}|\+639\d{9})$/.test(data.contactNumber.replace(/[\s-]/g,''))) return setError('Complete the required business and applicant details with a valid email and Philippine mobile number.');
    onSave({...data,ownerAccountEmail:data.email.toLowerCase()});
  }
  const input=(k,label,type='text')=><label key={k}>{label} *<input type={type} required value={data[k]} onChange={e=>field(k,e.target.value)}/></label>;
  return <form onSubmit={submit}><div className="ad-grid"><label className="span-2">BPLO service<select value={data.serviceType} onChange={e=>field('serviceType',e.target.value)}>{BPLO_SERVICES.map(service=><option key={service.id} value={service.id}>{service.name}</option>)}</select></label><label>Application type<select value={data.applicationType} onChange={e=>field('applicationType',e.target.value)}><option>New</option><option>Renewal</option></select></label><label>Business type<select value={data.businessType} onChange={e=>field('businessType',e.target.value)}>{['Retail','Service','Agriculture','Accommodation','Manufacturing','Food & Beverage','Other'].map(s=><option key={s}>{s}</option>)}</select></label>{input('businessName','Business name')}{input('businessAddress','Business address')}{input('fullName','Applicant name')}{input('email','Applicant email','email')}{input('contactNumber','Mobile number','tel')}{input('natureOfBusiness','Nature of business')}</div>{error&&<p className="ad-err" role="alert">{error}</p>}<div className="ad-actions"><button type="button" className="ad-btn" onClick={onCancel}>Cancel</button><button className="ad-btn primary" type="submit">Save new application</button></div></form>;
}
function SettingsPage({ cfg, onSave, user }) {
  const [tab, setTab] = useState('General');
  const [f, setF] = useState(cfg);
  const [requirements, setRequirements] = useState(getRequirements);
  const [newReq, setNewReq] = useState('');
  const [reqMessage, setReqMessage] = useState('');
  const [err, setErr] = useState({});
  function submit(e) {
    e.preventDefault();
    const x = {};
    if (!f.system.trim()) x.system = 'System name is required.';
    if (!f.city.trim()) x.city = 'City name is required.';
    if (!/^\S+@\S+\.\S+$/.test(f.email)) x.email = 'Enter a valid email address.';
    if (f.phone.trim().length < 7) x.phone = 'Enter a valid phone number.';
    setErr(x);
    if (!Object.keys(x).length) onSave(f);
  }
  return (
    <>
      <div className="ad-tabs">{['General', 'Email/SMS', 'Requirements', 'System', 'Users'].map((t) => <button key={t} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>{t}</button>)}</div>
      <section className="ad-card">
        <form onSubmit={submit} noValidate>
          {tab === 'General' && <><h3>General Settings</h3><div className="ad-grid">{[['system', 'System Name'], ['city', 'City Name'], ['email', 'Email Address'], ['phone', 'Phone Number']].map(([k, l]) => <label key={k}>{l}<input value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} />{err[k] && <em className="ad-err" role="alert">{err[k]}</em>}</label>)}</div></>}
          {tab === 'Email/SMS' && <><h3>Notification channels</h3><label className="ad-check"><input type="checkbox" checked={f.emailOn} onChange={(e) => setF({ ...f, emailOn: e.target.checked })} />Send optional email updates to applicants</label><label className="ad-check"><input type="checkbox" checked={f.smsOn} onChange={(e) => setF({ ...f, smsOn: e.target.checked })} />Send SMS updates to applicants</label><p className="muted">Inspection schedule emails are sent when a schedule is saved. Configure SMTP in the backend environment; these settings do not configure the email server.</p></>}
          {tab === 'Requirements' && <><h3>Manage Document Requirements</h3><p className="muted">Changes affect the applicant checklist in this browser on next visit.</p>{requirements.map((name,i)=><div className="ad-requirement-item" key={name}><span>{i+1}. {name}</span><button type="button" className="ad-btn sm danger" onClick={()=>{if(requirements.length<=1)return setReqMessage('Keep at least one requirement.');const updated=requirements.filter(x=>x!==name);saveRequirements(updated);setRequirements(updated);setReqMessage('Requirement removed.');}}>Remove</button></div>)}<label>New requirement<input value={newReq} onChange={e=>setNewReq(e.target.value)} placeholder="e.g., Sanitary clearance"/></label><div className="ad-actions left"><button type="button" className="ad-btn primary" onClick={()=>{if(!newReq.trim())return setReqMessage('Type a requirement name.');if(requirements.some(x=>x.toLowerCase()===newReq.trim().toLowerCase()))return setReqMessage('Already in the checklist.');const updated=saveRequirements([...requirements,newReq]);setRequirements(updated);setNewReq('');setReqMessage('Requirement added.');}}>Add Requirement</button></div>{reqMessage&&<p role="status" className="muted">{reqMessage}</p>}</>}
          {tab === 'System' && <><h3>System</h3><p className="muted">Application records are stored in the Aiven MySQL database. Manage database records through the authorized application workflows.</p></>}
          {tab === 'Users' && <><h3>Admin users</h3><div className="ad-table"><table><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th></tr></thead><tbody><tr><td>{user?.name || 'Current administrator'}</td><td>{user?.email || '—'}</td><td>Administrator</td><td><Badge s="Active" /></td></tr></tbody></table></div></>}
          {(tab === 'General' || tab === 'Email/SMS') && <div className="ad-actions"><button className="ad-btn primary">Save Changes</button></div>}
        </form>
      </section>
    </>
  );
}


// Top-level components keep their identity while search/filter state changes.
function AppTable({ rows, compact = false, onView }) {
  return <div className="ad-table"><table>
    <thead><tr><th>Application No.</th><th>Business Name</th>{!compact && <><th>Applicant</th><th>BPLO Service</th><th>Type</th></>}<th>Status</th><th>Date Submitted</th><th>Action</th></tr></thead>
    <tbody>{rows.map((a) => <tr key={a.referenceNumber}>
      <td className="mono">{a.referenceNumber}</td><td><strong>{a.businessName}</strong></td>
      {!compact && <><td>{a.fullName}</td><td>{serviceLabel(a.serviceType)}</td><td>{a.businessType || '—'}</td></>}
      <td><Badge s={a.status} /></td><td>{fmt(a.submittedAt)}</td>
      <td><button className="ad-btn sm" onClick={() => onView(a)}><Eye size={15}/>View</button></td>
    </tr>)}</tbody>
  </table>{!rows.length && <Empty>No applications found.</Empty>}</div>;
}
function InspectionTable({ rows, scheduled, onSchedule, onCalendar }) {
  return <div className="ad-table"><table>
    <thead><tr><th>Reference</th><th>Business</th>{scheduled && <><th>Date</th><th>Time</th><th>Inspector</th></>}<th>Action</th></tr></thead>
    <tbody>{rows.map(a => <tr key={a.referenceNumber}>
      <td className="mono">{a.referenceNumber}</td><td>{a.businessName}</td>
      {scheduled && <><td>{a.inspection.date}</td><td>{a.inspection.time}</td><td>{a.inspection.inspector || '—'}</td></>}
      <td className="ad-rowact"><button className="ad-btn sm" onClick={() => onSchedule(a)}>{scheduled ? 'Edit schedule' : 'Schedule'}</button>{scheduled && <button className="ad-btn sm" onClick={() => onCalendar(a)}>Calendar .ics</button>}</td>
    </tr>)}</tbody>
  </table>{!rows.length && <Empty>{scheduled ? 'No inspections scheduled yet.' : 'All applications have an inspection schedule.'}</Empty>}</div>;
}
function Toolbar({ children, ph, q, onQ }) {
  return <div className="ad-toolbar"><div className="ad-search"><Search size={16}/><input aria-label="Search" placeholder={ph} value={q} onChange={(e) => onQ(e.target.value)}/></div>{children}</div>;
}

export default function AdminApp({ user, onLogout }) {
  const readPage = () => { const h = decodeURIComponent(location.hash.slice(1)); return NAV.some((n) => n[0] === h) ? h : 'Dashboard'; };
  const [page, setPage] = useState(readPage);
  const [apps, setApps] = useState([]);
  const [people, setPeople] = useState([]);
  const [notes, setNotes] = useState([]);
  const [cfg, setCfg] = useState(defaultCfg);
  const [auditRows, setAuditRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const initialLoadStarted = useRef(false);
  const loadAll = async () => {
    setError('');
    const supportingData = Promise.all([api.people.list(), api.notes.list(), api.settings.get(), api.audit.list()])
      .then(([p, n, c, history]) => { setPeople(p); setNotes(n); setCfg(c); setAuditRows(history); })
      .catch(e => setError(e.message));
    try { setApps(await api.apps.list()); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
    await supportingData;
  };
  useEffect(() => {
    if (initialLoadStarted.current) return;
    initialLoadStarted.current = true;
    loadAll();
  }, []);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('All');
  const [ftype, setFtype] = useState('All');
  const [serviceFilter, setServiceFilter] = useState('All');
  const [sel, setSel] = useState(null);
  const [tab, setTab] = useState('Business Information');
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState('');
  const [menu, setMenu] = useState(false);
  const [inspectionForm, setInspectionForm] = useState({date:'',time:'09:00',inspector:'',remarks:''});

  useEffect(() => { const f = () => setPage(readPage()); addEventListener('hashchange', f); return () => removeEventListener('hashchange', f); }, []);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(''), 3200); return () => clearTimeout(t); }, [toast]);

  const go = (p, f = 'All') => { location.hash = encodeURIComponent(p); setPage(p); setSel(null); setQ(''); setFilter(f); setFtype('All'); setServiceFilter('All'); setMenu(false); window.scrollTo({top:0,behavior:'auto'}); };
  const count = (s) => apps.filter((a) => a.status === s).length;
  const unread = notes.filter((n) => !n.read).length;
  const cur = apps.find((a) => a.referenceNumber === sel);
  const recent = [...apps].sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
  const monthLabels = Array.from({ length: 6 }, (_, index) => {
    const month = new Date();
    month.setDate(1);
    month.setMonth(month.getMonth() - (5 - index));
    return { key: `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`, label: month.toLocaleDateString('en', { month: 'short' }) };
  });
  const monthlyApplications = monthLabels.map(month => ({
    ...month,
    count: apps.filter(app => {
      const submitted = new Date(app.submittedAt);
      return !Number.isNaN(submitted.getTime()) && `${submitted.getFullYear()}-${String(submitted.getMonth() + 1).padStart(2, '0')}` === month.key;
    }).length,
  }));
  const monthlyMax = Math.max(1, ...monthlyApplications.map(month => month.count));
  const serviceApplications = BPLO_SERVICES.map(service => ({
    name: service.name,
    count: apps.filter(app => app.serviceType === service.id).length,
  })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  const serviceMax = Math.max(1, ...serviceApplications.map(service => service.count));
  const types = [...new Set(apps.map((a) => a.businessType).filter(Boolean))];
  const docs = apps.flatMap((a) => (a.documents || []).map((d) => ({ a, d })));
  const scheduledInspections = apps.filter(a => a.inspection?.date && a.inspection?.time);
  const unscheduledInspections = apps.filter(a => !a.inspection?.date || !a.inspection?.time);
  const sortedAuditRows = oldestFirst(auditRows, a => a.at || a.created_at);
  const has = (s, t) => String(s ?? '').toLowerCase().includes(String(t ?? '').toLowerCase());
  const filteredPeople = people.filter((p) => has([p.name, p.email, p.phone].join(' '), q)).sort((a, b) => {
    const aId = Number(a.id);
    const bId = Number(b.id);
    return Number.isFinite(aId) && Number.isFinite(bId) ? aId - bId : String(a.id).localeCompare(String(b.id), undefined, { numeric: true });
  });
  const list = oldestFirst(apps.filter((a) => (filter === 'All' || a.status === filter) && (ftype === 'All' || a.businessType === ftype) && (serviceFilter === 'All' || a.serviceType === serviceFilter) && has([a.referenceNumber, a.businessName, a.fullName, a.businessType, serviceLabel(a.serviceType)].join(' '), q)), a => a.submittedAt);
  const week = apps.filter((a) => Date.now() - new Date(a.submittedAt) < 7 * 864e5).length;

  function csv(name, data) {
    const body = data.map((r) => r.map((v) => '"' + String(v ?? '').replaceAll('"', '""') + '"').join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([body], { type: 'text/csv' }));
    a.download = name + '.csv'; a.click(); URL.revokeObjectURL(a.href);
    setToast('Report downloaded');
  }
  const run = async (fn, ok) => { try { await fn(); if (ok) setToast(ok); } catch (e) { setToast(e.message); } };
  const reload = async () => { const [a, n, history] = await Promise.all([api.apps.list(), api.notes.list(), api.audit.list()]); setApps(a); setNotes(n); setAuditRows(history); };
  const loadPeople = async () => setPeople(await api.people.list());
  const changeStatus = (a, status, remarks) => run(async () => { await api.apps.setStatus(a.referenceNumber, status, remarks); await reload(); setModal(null); }, 'Status updated');
  const reviewDoc = (a, d, status, remarks) => run(async () => {
    await api.apps.reviewDoc(a.referenceNumber, d.documentType, status, remarks);
    setApps(current => current.map(app => app.referenceNumber !== a.referenceNumber ? app : {
      ...app,
      documents: (app.documents || []).map(doc => doc.documentType !== d.documentType ? doc : {
        ...doc,
        reviewStatus: status,
        reviewRemarks: remarks,
      }),
    }));
    setModal(null);
    void Promise.all([api.notes.list(), api.audit.list()])
      .then(([nextNotes, nextAudit]) => { setNotes(nextNotes); setAuditRows(nextAudit); })
      .catch(e => setToast(e.message));
  }, 'Document review saved');
  const saveInspection = (a, form) => run(async () => {
    const result = await api.apps.schedule(a.referenceNumber, form);
    await reload();
    setModal(null);
    setToast(result.emailSent ? 'Inspection schedule saved and email sent to applicant.' : result.message);
  });
  const addApplication = (details) => run(async () => { await api.apps.create(details); await reload(); setModal(null); }, 'Application created');
  const removeApp = (a) => run(async () => { await api.apps.remove(a.referenceNumber); await reload(); setSel(null); setModal(null); }, 'Application deleted');
  const savePerson = (p) => run(async () => { await (modal.p ? api.people.update(p) : api.people.add(p)); await loadPeople(); setModal(null); }, modal.p ? 'Applicant updated' : 'Applicant added');
  const removePerson = (p) => run(async () => { await api.people.remove(p.id); await loadPeople(); setModal(null); }, 'Applicant deleted');
  const togglePerson = (p) => run(async () => { await api.people.update({ ...p, active: !p.active }); await loadPeople(); }, p.active ? 'Account deactivated' : 'Account activated');
  const markRead = (id) => run(async () => { await api.notes.markRead(id); setNotes(await api.notes.list()); });
  const markAll = () => run(async () => { await api.notes.markAll(); setNotes(await api.notes.list()); });
  const saveCfg = (c) => run(async () => { await api.settings.save(c); setCfg(c); }, 'Settings saved');

  if (loading) return <div className="ad-loading">Loading records…</div>;


  let acc = 0;
  const stops = apps.length ? STATUS.map((s, i) => { const from = acc; acc += (count(s) / apps.length) * 100; return `${STATUS_COLORS[i]} ${from}% ${acc}%`; }) : [];
  const donut = apps.length ? `conic-gradient(${stops.join(',')}${acc < 99.9 ? `,#dfe6dc ${acc}% 100%` : ''})` : '#e5ebe3';
  const [title, sub] = HEAD[page];

  return (
    <div className="ad-shell">
      <aside className={'ad-side' + (menu ? ' open' : '')}>
        <div className="ad-user"><span className="ad-avatar"><img src="/calapan-bplo-logo.png" alt="" /></span><div><strong>{user?.name || 'Administrator'}</strong><small>Authorized Personnel</small></div></div>
        <nav>{NAV.map(([n, I]) => <button key={n} className={page === n ? 'on' : ''} onClick={() => go(n)}><I size={18} />{n}{n === 'Notifications' && unread > 0 && <b>{unread}</b>}</button>)}
        </nav>
        <button className="ad-sidebar-logout" onClick={() => setModal({ k: 'logout' })}><LogOut size={18} />Logout</button>
      </aside>
      <div className="ad-main">
        <header className="ad-top">
          <button className="ad-menu" aria-label="Toggle menu" onClick={() => setMenu(!menu)}><Menu size={20} /></button>
          <span className="ad-brand">{cfg.city} {cfg.system}</span>
          <button className="ad-link" onClick={() => go('Notifications')}>Notifications{unread > 0 && <b className="ad-dot">{unread}</b>} | Admin ▾</button>
        </header>
        <main className="ad-content">
          {error && <div className="ad-banner" role="alert">{error} <button onClick={loadAll}>Retry</button></div>}
          {cur ? (
            <>
              <button className="ad-link" onClick={() => setSel(null)}><ArrowLeft size={16} />Back to Applications</button>
              <div className="ad-head"><div><h1>Application Details</h1><p className="muted">View complete information about the business permit application.</p></div>
                <div className="ad-actions"><button className="ad-btn primary" onClick={() => setModal({ k: 'status' })}>Update Status</button><button className="ad-btn" onClick={() => printApplication(cur, cur.status === 'Released' ? 'Permit Release Record' : 'Application Form')}><Printer size={16} />Print / PDF</button><button className="ad-btn" onClick={() => { setInspectionForm(cur.inspection || {date:'',time:'09:00',inspector:'',remarks:''}); setModal({k:'inspection',a:cur}); }}><CalendarDays size={16}/>Inspection</button><button className="ad-btn danger" onClick={() => setModal({ k: 'delapp' })}><Trash2 size={16} />Delete</button></div></div>
              <section className="ad-card ad-summary">
                <span className="ad-box"><Files size={26} /></span>
                <div><small className="mono">{cur.referenceNumber}</small><h2>{cur.businessName}</h2><Badge s={cur.status} /></div>
                <Info rows={[['Applicant', cur.fullName], ['Business Type', cur.businessType], ['Date Submitted', fmt(cur.submittedAt)], ['Application Type', cur.applicationType || 'New'], ['BPLO Service', serviceLabel(cur.serviceType)]]} />
              </section>
              <div className="ad-tabs">{['Business Information', 'Applicant Information', 'Documents', 'Payments', 'Status History'].map((t) => <button key={t} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>{t}</button>)}</div>
              {tab === 'Payments' && <PaymentPanel key={cur.referenceNumber} reference={cur.referenceNumber} applicationStatus={cur.status} admin />}
              {tab === 'Business Information' && <div className="ad-two">
                <section className="ad-card"><h3>Business Details</h3><Info rows={[['Business Name', cur.businessName], ['Business Address', cur.businessAddress], ['Business Type', cur.businessType], ['BPLO Service', serviceLabel(cur.serviceType)], ['Contact Number', cur.contactNumber], ['Email Address', cur.email], ['Nature of Business', cur.natureOfBusiness], ['Inspection', cur.inspection ? `${cur.inspection.date} ${cur.inspection.time}` : 'Not scheduled']]} /></section>
                <section className="ad-card"><h3>Submitted Documents</h3>{(cur.documents || []).map((d) => <div className="ad-docrow" key={d.documentType}><span>{d.documentType}</span><Badge s={d.reviewStatus || 'Pending'} /><button className="ad-btn sm" aria-label={'Review ' + d.documentType} onClick={() => setModal({ k: 'doc', a: cur, d })}><Eye size={14} /></button></div>)}{!(cur.documents || []).length && <Empty>No documents uploaded yet.</Empty>}</section>
              </div>}
              {tab === 'Business Information' && <section className="ad-card"><h3>Business Location & Inspection</h3><p>{cur.businessAddress}</p><a className="ad-link" href={mapUrl(cur)} target="_blank" rel="noreferrer"><MapPin size={16}/>Open in Google Maps</a>{cur.inspection && <div className="ad-inspection-inline"><span>Scheduled: {cur.inspection.date} at {cur.inspection.time} · Inspector: {cur.inspection.inspector}</span><button className="ad-btn sm" onClick={() => downloadInspectionCalendar(cur)}>Calendar .ics</button></div>}</section>}
              {tab === 'Applicant Information' && <section className="ad-card"><Info rows={[['Full Name', cur.fullName], ['Email Address', cur.email], ['Contact Number', cur.contactNumber], ['Address', cur.businessAddress]]} /></section>}
              {tab === 'Documents' && <section className="ad-card"><div className="ad-table"><table><thead><tr><th>Document</th><th>File</th><th>Status</th><th>Remarks</th><th>Action</th></tr></thead><tbody>{(cur.documents || []).map((d) => <tr key={d.documentType}><td>{d.documentType}</td><td>{d.fileName}</td><td><Badge s={d.reviewStatus || 'Pending'} /></td><td>{d.reviewRemarks || '—'}</td><td><button className="ad-btn sm" onClick={() => setModal({ k: 'doc', a: cur, d })}>Review</button></td></tr>)}</tbody></table>{!(cur.documents || []).length && <Empty>No documents uploaded yet.</Empty>}</div></section>}
              {tab === 'Status History' && <section className="ad-card"><ol className="ad-timeline">{(cur.statusHistory?.length ? cur.statusHistory : [{ status: 'Pending', updatedAt: cur.submittedAt }]).map((h, i) => <li key={i}><Badge s={h.status} /><span>{fmt(h.updatedAt)}</span>{h.remarks && <p>{h.remarks}</p>}</li>)}</ol></section>}
            </>
          ) : (
            <>
              <div className="ad-head"><div><h1>{title}</h1><p className="muted">{sub}</p></div>
                {page === 'Applicants' && <button className="ad-btn primary" onClick={() => setModal({ k: 'person' })}><Plus size={16} />Add Applicant</button>}
{page === 'Notifications' && <button className="ad-btn" onClick={markAll}>Mark all as read</button>}</div>

              {page === 'Dashboard' && <>
                <div className="ad-stats">{[['Total Applications', null], ['Pending', 'Pending'], ['Under Review', 'Under Review'], ['Approved', 'Approved'], ['Rejected', 'Rejected']].map(([l, s]) => { const v = s ? count(s) : apps.length; return <button key={l} className="ad-stat" onClick={() => go('Applications', s || 'All')}><span>{l}</span><strong>{v}</strong><small>{s ? `${apps.length ? Math.round((v / apps.length) * 100) : 0}% of total` : `+${week} this week`}</small></button>; })}</div>
                <div className="ad-two wide">
                  <section className="ad-card"><h3>Application Status Overview</h3><div className="ad-donutwrap"><div className="ad-donut" style={{ background: donut }}><div><strong>{apps.length}</strong><small>Total Applications</small></div></div>
                    <ul className="ad-legend">{STATUS.map((s, i) => <li key={s}><i style={{ background: STATUS_COLORS[i] }} />{s}<b>{count(s)} ({apps.length ? Math.round((count(s) / apps.length) * 100) : 0}%)</b></li>)}</ul></div></section>
                  <section className="ad-card"><div className="ad-cardhead"><h3>Recent Applications</h3><button className="ad-link" onClick={() => go('Applications')}>View All</button></div><AppTable rows={recent.slice(0, 5)} compact onView={a => {setSel(a.referenceNumber);setTab('Business Information');}} /></section>
                </div></>}
              {page === 'Dashboard' && <div className="ad-two">
                <section className="ad-card">
                  <div className="ad-cardhead"><div><h3>Applications by Month</h3><p className="muted">New applications received in the last six months</p></div></div>
                  <div className="ad-month-chart" role="img" aria-label="Bar chart showing applications submitted in the last six months">
                    {monthlyApplications.map(month => <div className="ad-month-column" key={month.key} title={`${month.label}: ${month.count} applications`}>
                      <strong>{month.count}</strong><div className="ad-month-track"><span style={{ height: `${month.count ? Math.max(6, month.count / monthlyMax * 100) : 0}%` }} /></div><small>{month.label}</small>
                    </div>)}
                  </div>
                </section>
                <section className="ad-card">
                  <div className="ad-cardhead"><div><h3>Applications by Service</h3><p className="muted">Application volume across BPLO services</p></div></div>
                  <div className="ad-service-chart" role="img" aria-label="Bar chart showing application counts by BPLO service">
                    {serviceApplications.map((service, index) => <div className="ad-service-row" key={service.name} title={`${service.name}: ${service.count} applications`}>
                      <span>{service.name}</span><div className="ad-service-track"><i style={{ width: `${service.count ? Math.max(3, service.count / serviceMax * 100) : 0}%`, background: SERVICE_COLORS[index % SERVICE_COLORS.length] }} /></div><strong>{service.count}</strong>
                    </div>)}
                  </div>
                </section>
              </div>}

              {page === 'Services' && <section className="ad-card"><div className="ad-cardhead"><h3>Service categories</h3><p className="muted">Select View Applications to review records under a service. Use Payments for fee assessments and manual payment verification.</p></div><div className="bplo-services-grid">{BPLO_SERVICES.map((service,index)=><div className="bplo-service-card" key={service.id}><span className="bplo-service-number">{String(index+1).padStart(2,'0')}</span><h3>{service.name}</h3><p>{service.summary}</p><small className="bplo-service-note">{service.note}</small><strong className="bplo-service-count">{apps.filter(a=>a.serviceType===service.id).length} application(s)</strong><button className="ad-btn sm primary" onClick={()=>{go('Applications');setServiceFilter(service.id);}}>View applications <Eye size={14}/></button></div>)}</div></section>}

              {page === 'Payments' && <PaymentsPage admin />}
              {page === 'Applications' && <section className="ad-card">
                <Toolbar q={q} onQ={setQ} ph="Search application number or business name…"><button className="ad-btn primary" onClick={() => setModal({k:'newapplication'})}><Plus size={16}/> Add Application</button><label className="ad-filter">Filter<select aria-label="Filter by business type" value={ftype} onChange={(e) => setFtype(e.target.value)}><option value="All">All types</option>{types.map((t) => <option key={t}>{t}</option>)}</select></label><label className="ad-filter">Service<select aria-label="Filter by BPLO service" value={serviceFilter} onChange={e=>setServiceFilter(e.target.value)}><option value="All">All services</option>{BPLO_SERVICES.map(service=><option key={service.id} value={service.id}>{service.name}</option>)}</select></label>
                  <button className="ad-btn" onClick={() => csv('applications', [['Application No.', 'Business', 'Applicant', 'BPLO Service', 'Type', 'Status', 'Date'], ...list.map((a) => [a.referenceNumber, a.businessName, a.fullName, serviceLabel(a.serviceType), a.businessType, a.status, fmt(a.submittedAt)])])}><Download size={15} />Export</button></Toolbar>
                <div className="ad-tabs">{['All', ...STATUS].map((s) => <button key={s} className={filter === s ? 'on' : ''} onClick={() => setFilter(s)}>{s} ({s === 'All' ? apps.length : count(s)})</button>)}</div>
                <AppTable rows={list} onView={a => {setSel(a.referenceNumber);setTab('Business Information');}} /></section>}

              {page === 'Applicants' && <section className="ad-card">
                <Toolbar q={q} onQ={setQ} ph="Search name, email or contact number…"><span className="muted">{filteredPeople.length} applicants</span></Toolbar>
                <div className="ad-table"><table><thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Contact Number</th><th>Address</th><th>Status</th><th>Action</th></tr></thead>
                  <tbody>{filteredPeople.map((p) => <tr key={p.id}><td className="mono">{p.id}</td><td><strong>{p.name}</strong></td><td>{p.email}</td><td>{p.phone}</td><td>{p.address}</td><td><Badge s={p.active ? 'Active' : 'Inactive'} /></td>
                    <td className="ad-rowact"><button className="ad-btn sm" aria-label={'View ' + p.name} onClick={() => setModal({ k: 'view', p })}><Eye size={14} /></button><button className="ad-btn sm" aria-label={'Edit ' + p.name} onClick={() => setModal({ k: 'person', p })}><Pencil size={14} /></button><button className="ad-btn sm" onClick={() => togglePerson(p)}>{p.active ? 'Deactivate' : 'Activate'}</button><button className="ad-btn sm danger" aria-label={'Delete ' + p.name} onClick={() => setModal({ k: 'delperson', p })}><Trash2 size={14} /></button></td></tr>)}</tbody></table>
                  {!people.length && <Empty>No applicants yet. Click Add Applicant.</Empty>}</div></section>}

              {page === 'Documents' && <section className="ad-card">
                <Toolbar q={q} onQ={setQ} ph="Search application number or document name…"><label className="ad-filter">Filter<select aria-label="Filter by status" value={filter} onChange={(e) => setFilter(e.target.value)}>{['All', 'Pending', 'Verified', 'Rejected'].map((s) => <option key={s}>{s}</option>)}</select></label></Toolbar>
                <div className="ad-table"><table><thead><tr><th>Application No.</th><th>Document Type</th><th>File Name</th><th>Status</th><th>Action</th></tr></thead>
                  <tbody>{docs.filter(({ a, d }) => (filter === 'All' || (d.reviewStatus || 'Pending') === filter) && has(a.referenceNumber + ' ' + d.documentType + ' ' + d.fileName, q)).map(({ a, d }) => <tr key={a.referenceNumber + d.documentType}><td className="mono">{a.referenceNumber}</td><td>{d.documentType}</td><td>{d.fileName}</td><td><Badge s={d.reviewStatus || 'Pending'} /></td><td><button className="ad-btn sm" onClick={() => setModal({ k: 'doc', a, d })}><Eye size={14} />View</button></td></tr>)}</tbody></table>
                  {!docs.length && <Empty>No documents uploaded yet.</Empty>}</div></section>}

              {page === 'Inspections' && <>
                <section className="ad-card"><div className="ad-cardhead"><div><h3>Scheduled Inspections ({scheduledInspections.length})</h3><p className="muted">Applications with an inspection date and time.</p></div></div><InspectionTable rows={scheduledInspections} scheduled onSchedule={a => {setInspectionForm(a.inspection);setModal({k:'inspection',a});}} onCalendar={downloadInspectionCalendar} /></section>
                <section className="ad-card"><div className="ad-cardhead"><div><h3>Not Yet Scheduled ({unscheduledInspections.length})</h3><p className="muted">Applications that still need an inspection schedule.</p></div></div><InspectionTable rows={unscheduledInspections} scheduled={false} onSchedule={a => {setInspectionForm(a.inspection || {date:'',time:'09:00',inspector:'',remarks:''});setModal({k:'inspection',a});}} /></section>
              </>}
              {page === 'Audit Logs' && <section className="ad-card"><div className="ad-cardhead"><h3>Record Activity History</h3><button className="ad-btn sm" onClick={loadAll}>Refresh</button></div><div className="ad-table"><table><thead><tr><th>Date</th><th>Action</th><th>Reference</th><th>Details</th><th>Actor</th></tr></thead><tbody>{sortedAuditRows.map(a=><tr key={a.id}><td>{fmt(a.at || a.created_at)}</td><td>{a.action}</td><td className="mono">{a.reference || a.application_no || '—'}</td><td>{a.details || '—'}</td><td>{a.actor || '—'}</td></tr>)}</tbody></table>{!sortedAuditRows.length && <Empty>No audit events yet. Perform a demo application action.</Empty>}</div></section>}
              {page === 'Notifications' && <section className="ad-card">{notes.map((n) => <button key={n.id} className={'ad-note' + (n.read ? '' : ' unread')} onClick={() => markRead(n.id)}><Bell size={18} /><div><strong>{n.title}</strong><p>{n.text}</p></div>{!n.read && <i />}</button>)}{!notes.length && <Empty>No notifications.</Empty>}</section>}

              {page === 'Reports' && <ReportsPage apps={apps} people={people} onCsv={csv} />}

              {page === 'Settings' && <SettingsPage cfg={cfg} onSave={saveCfg} user={user} />}
            </>
          )}
        </main>
      </div>

      {modal?.k === 'status' && cur && <Modal title="Update status" onClose={() => setModal(null)}><ReviewForm options={STATUS.includes(cur.status) ? STATUS : [cur.status, ...STATUS]} status={cur.status} remarks={cur.remarks} needRemarks="Missing Requirements" label="Save status" onSave={(s, r) => changeStatus(cur, s, r)} /></Modal>}
      {modal?.k === 'doc' && <Modal title={modal.d.documentType} onClose={() => setModal(null)}><p className="muted">{modal.a.referenceNumber} · {modal.d.fileName}</p><button className="ad-btn sm" type="button" onClick={() => openDocument(modal.a.referenceNumber, modal.d).catch(e => setToast(e.message))}><Eye size={14}/> Open file</button><ReviewForm options={['Pending', 'Verified', 'Rejected']} status={modal.d.reviewStatus || 'Pending'} remarks={modal.d.reviewRemarks} needRemarks="Rejected" label="Save review" onSave={(s, r) => reviewDoc(modal.a, modal.d, s, r)} /></Modal>}
      {modal?.k === 'inspection' && <Modal title={'Schedule Inspection · ' + modal.a.referenceNumber} onClose={() => setModal(null)}><form onSubmit={e=>{e.preventDefault();saveInspection(modal.a,inspectionForm);}}><label>Date *<input type="date" required value={inspectionForm.date} onChange={e=>setInspectionForm({...inspectionForm,date:e.target.value})}/></label><label>Time *<input type="time" required value={inspectionForm.time} onChange={e=>setInspectionForm({...inspectionForm,time:e.target.value})}/></label><label>Inspector *<input required value={inspectionForm.inspector} onChange={e=>setInspectionForm({...inspectionForm,inspector:e.target.value})}/></label><label>Remarks<input value={inspectionForm.remarks||''} onChange={e=>setInspectionForm({...inspectionForm,remarks:e.target.value})}/></label><div className="ad-actions"><button className="ad-btn primary">Save Schedule</button></div></form></Modal>}
      {modal?.k === 'newapplication' && <Modal title="New Business Permit Application" onClose={() => setModal(null)}><AdminNewApplication onSave={addApplication} onCancel={() => setModal(null)}/></Modal>}
      {modal?.k === 'person' && <Modal title={modal.p ? 'Edit applicant' : 'Add applicant'} onClose={() => setModal(null)}><PersonForm initial={modal.p || { name: '', email: '', phone: '', address: '' }} people={people} onSave={savePerson} onCancel={() => setModal(null)} /></Modal>}
      {modal?.k === 'view' && <Modal title={modal.p.name} onClose={() => setModal(null)}><Info rows={[['ID', modal.p.id], ['Email', modal.p.email], ['Contact', modal.p.phone], ['Address', modal.p.address], ['Status', modal.p.active ? 'Active' : 'Inactive'], ['Applications', apps.filter((a) => a.fullName === modal.p.name).length]]} /></Modal>}
      {modal?.k === 'delapp' && cur && <Confirm title="Delete this application?" text={`${cur.businessName} (${cur.referenceNumber}) will be permanently removed. This cannot be undone.`} label="Delete" onClose={() => setModal(null)} onYes={() => removeApp(cur)} />}
      {modal?.k === 'delperson' && <Confirm title="Delete this applicant?" text={`${modal.p.name} will be permanently removed. This cannot be undone.`} label="Delete" onClose={() => setModal(null)} onYes={() => removePerson(modal.p)} />}
      {modal?.k === 'logout' && <Confirm title="Log out?" text="Your records stay saved in this browser." label="Log out" onClose={() => setModal(null)} onYes={onLogout} />}
      {toast && <div className="ad-toast" role="status">{toast}</div>}
    </div>
  );
}
