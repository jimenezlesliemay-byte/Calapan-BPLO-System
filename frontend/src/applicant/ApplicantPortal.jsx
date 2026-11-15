import React, { useEffect, useState } from 'react';
import { LayoutDashboard, FilePlus2, Files, FolderOpen, Search, Bell, UserCircle, LogOut, MapPin, CheckCircle2, CalendarDays, Download, Pencil, Clock3, Menu, ArrowRight, FileCheck2 } from 'lucide-react';
import { api, uploadRemoteFile } from '../api';
import { updateProfile, changePassword } from '../auth';
import { openDocument } from '../shared/files';
import { getServiceRequirements, isOptionalRequirement } from '../shared/requirements';
import { BPLO_SERVICES, findService, serviceLabel } from '../shared/services';
import { SERVICE_TYPES, SERVICE_TRANSACTIONS, serviceTypeLabel } from '../shared/businessTypes';
import { printApplication, mapUrl, downloadInspectionCalendar } from '../shared/exports';
import PaymentsPage, { PaymentPanel } from '../shared/Payments';

const NAV = [['Dashboard',LayoutDashboard],['BPLO Services',FileCheck2],['New Application',FilePlus2],['My Applications',Files],['Payments',FileCheck2],['Track Application',Search],['Documents',FolderOpen],['Notifications',Bell],['Profile',UserCircle]];
// Requirement checklist is configurable in the admin demo Settings tab.
const EMPTY = { serviceType:'business-registration', applicationType:'New', businessName:'', businessType:'', otherBusinessType:'', transactionType:'', natureOfBusiness:'', businessAddress:'', contactNumber:'', latitude:'', longitude:'', fullName:'', email:'', ownerAddress:'' };
const date = v => v && !isNaN(new Date(v)) ? new Date(v).toLocaleDateString('en-PH',{year:'numeric',month:'short',day:'numeric'}) : '—';
const oldestApplicationsFirst = apps => [...apps].sort((a,b) => {
 const aTime=Date.parse(a.submittedAt||''); const bTime=Date.parse(b.submittedAt||'');
 return (Number.isFinite(aTime)?aTime:0)-(Number.isFinite(bTime)?bTime:0);
});
const statusOrder = ['Pending','Under Review','Approved','Released'];
const badge = s => <span className={'portal-badge '+ String(s||'Pending').toLowerCase().replaceAll(' ','-')}>{s||'Pending'}</span>;
function Notice({error,success}) {return <>{error && <div className="portal-error" role="alert">{error}</div>}{success && <div className="portal-success" role="status">{success}</div>}</>}
function LocationPreview({data}) {return <div className="portal-map"><div><MapPin size={20}/><strong>Business location</strong><small>{data.businessAddress || 'Add an address to preview'}</small></div>{data.businessAddress && <a href={mapUrl(data)} target="_blank" rel="noreferrer">Open in Google Maps ↗</a>}{data.latitude && data.longitude && <iframe title="Business map preview" loading="lazy" src={`https://www.openstreetmap.org/export/embed.html?bbox=${Number(data.longitude)-0.01}%2C${Number(data.latitude)-0.01}%2C${Number(data.longitude)+0.01}%2C${Number(data.latitude)+0.01}&layer=mapnik&marker=${Number(data.latitude)}%2C${Number(data.longitude)}`}/>}</div>}
function ApplicationWizard({user,onCreated,initialService}) {
 const [step,setStep]=useState(0);
 const [data,setData]=useState(() => {
  const service = initialService || sessionStorage.getItem('bplo-selected-service');
  sessionStorage.removeItem('bplo-selected-service');
  return {...EMPTY, serviceType: findService(service) ? service : EMPTY.serviceType, fullName:user.name,email:user.email,contactNumber:user.phone,ownerAddress:user.address};
 });
 const [files,setFiles]=useState({}); const requirements=getServiceRequirements(data.serviceType); const [loading,setLoading]=useState(false); const [uploading,setUploading]=useState(false); const [uploadedCount,setUploadedCount]=useState(0); const [error,setError]=useState(''); const [complete,setComplete]=useState(null);
 const update=(k,v)=>setData(d=>({...d,[k]:v}));
 const steps=['Business Information','Applicant Information','Required Documents','Review & Submit'];
 function validate() {
  if(step===0 && (!findService(data.serviceType) || !data.businessName.trim() || !data.businessAddress.trim() || !data.businessType || (data.businessType==='Others' && !data.otherBusinessType.trim()) || (SERVICE_TRANSACTIONS[data.serviceType] && !data.transactionType) || !data.natureOfBusiness.trim())) return 'Complete all required business details.';
  if(step===1 && (!data.fullName.trim() || !/^\S+@\S+\.\S+$/.test(data.email) || !/^(09\d{9}|\+639\d{9})$/.test(data.contactNumber.replace(/[\s-]/g,'')))) return 'Enter a name, valid email and Philippine mobile number.';
  if(step>=2) {
   const missing=requirements.filter(type=>!isOptionalRequirement(type) && !files[type]);
   if(missing.length) return `Upload all required documents before continuing. Missing: ${missing.join(', ')}.`;
  }
  if(data.latitude && (!Number.isFinite(Number(data.latitude)) || Math.abs(Number(data.latitude))>90)) return 'Latitude must be between -90 and 90.';
  if(data.longitude && (!Number.isFinite(Number(data.longitude)) || Math.abs(Number(data.longitude))>180)) return 'Longitude must be between -180 and 180.';
  return '';
 }
 async function submit(e) {
  e.preventDefault(); setError(''); if (step<3) { const issue=validate(); if(issue) return setError(issue); setStep(s=>s+1); return; }
  const issue=validate(); if(issue) return setError(issue);
  setLoading(true); setUploading(false); setUploadedCount(0); try {
   const saved=await api.apps.create({...data,ownerAccountEmail:user.email});
   const entries=Object.entries(files);
   setUploading(entries.length>0);
   const docs=await Promise.all(entries.map(async ([documentType,file]) => {
    await uploadRemoteFile(saved.referenceNumber,documentType,file);
    setUploadedCount(count=>count+1);
    return {documentType,fileName:file.name,mimeType:file.type,size:file.size,savedAt:new Date().toISOString(),reviewStatus:'Pending'};
   }));
   setComplete({...saved, documents:docs}); onCreated();
  } catch(e) {setError(e.message||'Unable to create application.');} finally {setLoading(false);}
 }
 if(complete) return <section className="portal-panel portal-complete"><CheckCircle2 size={54}/><h2>Application saved to the database</h2><p>Your reference number:</p><strong className="portal-reference">{complete.referenceNumber}</strong><p>The application is available to authorized users of this prototype. It is not an official BPLO submission until the system has been approved for deployment.</p><div className="portal-actions"><button className="portal-primary" onClick={()=>{setComplete(null);setStep(0);setData({...EMPTY,serviceType:data.serviceType,fullName:user.name,email:user.email,contactNumber:user.phone,ownerAddress:user.address});setFiles({});}}>Start another</button><button className="portal-secondary" onClick={()=>printApplication(complete)}>Print application / PDF</button></div></section>;
 const f=(key,label,props={})=><label>{label}{props.required?' *':''}<input value={data[key]} onChange={e=>update(key,e.target.value)} {...props}/></label>;
 return <section className="portal-panel"><div className="portal-wizard-steps">{steps.map((s,i)=><div key={s} className={step===i?'active':step>i?'finished':''}><span>{step>i?'✓':i+1}</span><small>{s}</small></div>)}</div><form onSubmit={submit} noValidate><div className="portal-panel-heading"><h2>{steps[step]}</h2><p>{step===0?'Tell us about the business you want to register.':step===1?'Confirm the applicant details.':step===2?'Upload at least one document from this service’s checklist before continuing.':'Check your details and attached documents before submitting.'}</p></div>
 {step===0 && <><div className="bplo-selected-service"><strong>Selected service</strong><p>{findService(data.serviceType)?.summary}</p><small>{findService(data.serviceType)?.note}</small></div><div className="portal-form-grid"><label className="span-2">BPLO service *<select value={data.serviceType} required onChange={e=>{setData(d=>({...d,serviceType:e.target.value,businessType:'',otherBusinessType:'',transactionType:''}));setFiles({});setError('');}}>{BPLO_SERVICES.map(service=><option key={service.id} value={service.id}>{service.name}</option>)}</select></label><label>Application type *<select value={data.applicationType} onChange={e=>update('applicationType',e.target.value)}><option>New</option><option>Renewal</option></select></label>{f('businessName','Business name',{required:true,placeholder:'e.g., Sunrise Store'})}<label>{serviceTypeLabel(data.serviceType)} *<select value={data.businessType} required onChange={e=>update('businessType',e.target.value)}><option value="">Select a type</option>{(SERVICE_TYPES[data.serviceType]||[]).map(x=><option key={x} value={x}>{x}</option>)}</select></label>{data.businessType==='Others'&&f('otherBusinessType','Specify business / establishment type',{required:true,placeholder:'Enter type'})}{SERVICE_TRANSACTIONS[data.serviceType]&&<label>Transaction / permit type *<select value={data.transactionType} required onChange={e=>update('transactionType',e.target.value)}><option value="">Select transaction</option>{SERVICE_TRANSACTIONS[data.serviceType].map(x=><option key={x}>{x}</option>)}</select></label>}{f('natureOfBusiness','Nature of business',{required:true,placeholder:'e.g., Grocery & dry goods'})}<div className="span-2">{f('businessAddress','Business address (Calapan City) ',{required:true,placeholder:'Street, barangay, Calapan City'})}</div>{f('latitude','Map latitude (optional)',{placeholder:'13.4115',type:'number',step:'any'})}{f('longitude','Map longitude (optional)',{placeholder:'121.1803',type:'number',step:'any'})}</div><LocationPreview data={data}/></>}
 {step===1 && <div className="portal-form-grid">{f('fullName','Applicant full name',{required:true})}{f('email','Email address',{required:true,type:'email'})}{f('contactNumber','Mobile number',{required:true,placeholder:'09171234567'})}{f('ownerAddress','Mailing address',{placeholder:'Barangay, Calapan City'})}</div>}
 {step===2 && <><p className="portal-hint">Upload every required document, using the matching checklist slot. Items marked Optional may be skipped when they do not apply. PDF, JPG or PNG, maximum 5 MB each. Requirements are illustrative; confirm official requirements with the issuing office.</p><div className="portal-upload-grid">{requirements.map(type=><label className="portal-upload-slot" key={type}><FileCheck2 size={19}/><span>{type} <small>{isOptionalRequirement(type)?'Optional':'Required'}</small></span><small>{files[type]?.name||'Choose matching document'}</small><input type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" onChange={e=>{const file=e.target.files?.[0]; if(!file)return; if(!['application/pdf','image/png','image/jpeg'].includes(file.type) || file.size>5*1024*1024 || !file.size){setError(`${type}: choose a nonempty PDF, JPG, or PNG no larger than 5 MB.`);return;} setError('');setFiles(p=>({...p,[type]:file}));}}/></label>)}</div></>}
 {step===3 && <><div className="portal-review-grid">{[['BPLO service',serviceLabel(data.serviceType)],['Application type',data.applicationType],['Business name',data.businessName],[serviceTypeLabel(data.serviceType),data.businessType==='Others'?data.otherBusinessType:data.businessType],['Transaction / permit type',data.transactionType],['Nature',data.natureOfBusiness],['Business address',data.businessAddress],['Applicant',data.fullName],['Email',data.email],['Mobile',data.contactNumber],['Attached documents',Object.keys(files).length+' selected']].map(([k,v])=><div key={k}><small>{k}</small><strong>{v||'—'}</strong></div>)}</div><p className="portal-hint">You are submitting a student prototype record, not a government permit application.</p></>}
 <Notice error={error}/><div className="portal-form-actions">{step>0&&<button type="button" className="portal-secondary" disabled={loading} onClick={()=>{setError('');setStep(s=>s-1);}}>← Previous</button>}<button type="submit" className="portal-primary" disabled={loading}>{loading?(uploading?`Uploading documents (${uploadedCount}/${Object.keys(files).length})…`:'Saving application…'):step===3?'Submit demo application':'Continue →'}</button></div></form></section>;
}
function ApplicationDetails({app,onBack,onChanged}) {
 const [editing,setEditing]=useState(false);const [data,setData]=useState(app);const [error,setError]=useState('');const [success,setSuccess]=useState('');
 async function save(e) {e.preventDefault();try {await api.apps.update(app.referenceNumber,data);setEditing(false);setSuccess('Application updated.');onChanged();} catch(e) {setError(e.message);} }
 useEffect(() => { if (!editing) setData(app); }, [app, editing]);
 const a = data;
 return <div className="portal-stack"><button className="portal-secondary" onClick={onBack}>← Back to applications</button><section className="portal-panel"><div className="portal-detail-head"><div><span className="portal-muted">{a.referenceNumber}</span><h2>{a.businessName}</h2>{badge(a.status)}</div><div className="portal-actions"><button className="portal-secondary" onClick={()=>printApplication(a)}>Print / Save PDF</button>{!['Approved','Released','Rejected'].includes(a.status) && !editing && <button className="portal-secondary" onClick={()=>setEditing(true)}><Pencil size={16}/> Edit</button>}</div></div><div className="portal-review-grid">{[['BPLO service',serviceLabel(a.serviceType)],['Application type',a.applicationType],[serviceTypeLabel(a.serviceType),a.businessType==='Others'?(a.otherBusinessType||'Others'):a.businessType],['Transaction / permit type',a.transactionType],['Applicant',a.fullName],['Email',a.email],['Phone',a.contactNumber],['Address',a.businessAddress],['Date submitted',date(a.submittedAt)],['Remarks',a.remarks]].map(([k,v])=><div key={k}><small>{k}</small><strong>{v||'—'}</strong></div>)}</div>{editing && <form onSubmit={save}><div className="portal-form-grid"><label className="span-2">BPLO service<select value={data.serviceType || 'business-registration'} onChange={e=>setData(d=>({...d,serviceType:e.target.value}))}>{BPLO_SERVICES.map(service=><option key={service.id} value={service.id}>{service.name}</option>)}</select></label>{[['businessName','Business name'],['businessAddress','Business address'],['natureOfBusiness','Nature of business'],['contactNumber','Contact number']].map(([key,label])=><label key={key}>{label}<input required value={data[key]||''} onChange={e=>setData(d=>({...d,[key]:e.target.value}))}/></label>)}</div><div className="portal-actions"><button className="portal-secondary" type="button" onClick={()=>setEditing(false)}>Cancel</button><button className="portal-primary">Save changes</button></div></form>}<Notice error={error} success={success}/></section>
 <PaymentPanel key={app.referenceNumber} reference={app.referenceNumber} applicationStatus={app.status} />
 <section className="portal-panel"><h3>Application progress</h3><div className="portal-progress">{statusOrder.map((s,i)=><div key={s} className={statusOrder.indexOf(a.status)>=i?'done':''}><span>{i+1}</span><small>{s==='Pending'?'Submitted':s}</small></div>)}</div>{['Rejected','Missing Requirements'].includes(a.status)&&<p className="portal-error">{a.status}: {a.remarks||'Please check with the reviewing office.'}</p>}<ol className="portal-history">{(a.statusHistory||[]).map((h,i)=><li key={i}><strong>{h.status}</strong><small>{date(h.updatedAt)}</small><p>{h.remarks}</p></li>)}</ol></section>
 <section className="portal-panel"><h3>Supporting documents</h3>{a.documents?.length ? <div className="portal-table"><table><thead><tr><th>Requirement</th><th>File</th><th>Review</th></tr></thead><tbody>{a.documents.map(d=><tr key={d.documentType}><td>{d.documentType}</td><td>{d.fileName}</td><td>{badge(d.reviewStatus)}</td></tr>)}</tbody></table></div>:<p className="portal-muted">No documents submitted yet.</p>}</section><section className="portal-panel"><h3>Business location & inspection</h3><LocationPreview data={a}/>{a.inspection && <p><CalendarDays size={16}/> {date(a.inspection.date)} at {a.inspection.time} — {a.inspection.inspector} <button className="portal-secondary" onClick={()=>downloadInspectionCalendar(a)}>Save calendar (.ics)</button></p>}</section></div>;
}
function ServiceDirectory({onChoose}) {
 return <section className="portal-panel"><div className="portal-panel-heading"><h2>BPLO services</h2><p>Seven categories available in the student prototype. Select one to prefill a new application.</p></div><div className="bplo-services-grid">{BPLO_SERVICES.map((service,index)=><div className="bplo-service-card" key={service.id}><span className="bplo-service-number">{String(index+1).padStart(2,'0')}</span><h3>{service.name}</h3><p>{service.summary}</p><small className="bplo-service-note">{service.note}</small><details className="bplo-service-requirements"><summary>View requirements ({getServiceRequirements(service.id).length})</summary><ul>{getServiceRequirements(service.id).map(item=><li key={item}>{item}</li>)}</ul></details><details className="bplo-service-requirements"><summary>View available types ({SERVICE_TYPES[service.id]?.length||0})</summary><ul>{(SERVICE_TYPES[service.id]||[]).map(item=><li key={item}>{item}</li>)}</ul>{SERVICE_TRANSACTIONS[service.id]&&<><strong>Transaction / permit type</strong><ul>{SERVICE_TRANSACTIONS[service.id].map(item=><li key={item}>{item}</li>)}</ul></>}</details><button className="portal-secondary" onClick={()=>onChoose(service.id)}>Select service <ArrowRight size={15}/></button></div>)}</div><p className="portal-hint">These are prototype categories, not confirmation of official service coverage or legal requirements.</p></section>;
}
function DocumentCenter({apps,onChanged}) {
 const [ref,setRef]=useState(apps[0]?.referenceNumber||'');const [files,setFiles]=useState({});const [error,setError]=useState('');const [success,setSuccess]=useState('');const [busy,setBusy]=useState(false);
 const app=apps.find(a=>a.referenceNumber===ref);const docs=app?.documents||[];const requirements=getServiceRequirements(app?.serviceType);
 async function save(e) {e.preventDefault();if(!app)return;setError('');setSuccess('');setBusy(true);try {await Promise.all(Object.entries(files).map(([type,file])=>uploadRemoteFile(ref,type,file)));setSuccess('Document uploads saved for this application.');setFiles({});onChanged();}catch(e){setError(e.message);}finally{setBusy(false);} }
 async function remove(doc) {if(!confirm(`Remove ${doc.documentType} from this application?`))return;try{await api.apps.removeDoc(ref,doc.id);setSuccess('Document removed.');onChanged();}catch(e){setError(e.message);} }
 return <section className="portal-panel"><div className="portal-panel-heading"><h2>Upload required documents</h2><p>Choose an application and upload supporting PDF/JPG/PNG files (up to 5 MB each). Actual documentation depends on your selected service.</p></div><label className="portal-select-label">Application<select value={ref} onChange={e=>{setRef(e.target.value);setFiles({});setError('');}}><option value="">Select application</option>{apps.map(a=><option key={a.referenceNumber} value={a.referenceNumber}>{a.referenceNumber} — {a.businessName}</option>)}</select></label>{!app?<p>No applications yet. Start with New Application.</p>:<><p className="bplo-inline-service"><strong>Selected service:</strong> {serviceLabel(app.serviceType)}</p><form onSubmit={save}><div className="portal-upload-grid">{requirements.map(type=><label className="portal-upload-slot" key={type}><FileCheck2 size={18}/><span>{type} <small>{isOptionalRequirement(type)?'Optional':'Required'}</small></span><small>{files[type]?.name || docs.find(d=>d.documentType===type)?.fileName || 'Choose file'}</small><input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e=>{const f=e.target.files?.[0];if(!f)return;if(!['application/pdf','image/jpeg','image/png'].includes(f.type)||!f.size||f.size>5*1024*1024){setError('Choose PDF/JPG/PNG files no larger than 5 MB.');return;}setFiles(p=>({...p,[type]:f}));setError('');}}/></label>)}</div><button className="portal-primary" disabled={busy||!Object.keys(files).length}>{busy?'Saving…':'Save selected documents'}</button></form><h3 className="portal-subheading">Uploaded documents</h3><div className="portal-table"><table><thead><tr><th>Requirement</th><th>Filename</th><th>Review</th><th>Actions</th></tr></thead><tbody>{docs.map(d=><tr key={d.documentType}><td>{d.documentType}</td><td>{d.fileName}</td><td>{badge(d.reviewStatus)}{d.reviewRemarks&&<small className="portal-note">{d.reviewRemarks}</small>}</td><td><div className="portal-actions"><button className="portal-secondary" onClick={async()=>{try{await openDocument(ref,d);}catch(e){setError(e.message);}}}>Open</button><button className="portal-secondary" onClick={()=>remove(d)}>Remove</button></div></td></tr>)}</tbody></table>{!docs.length&&<p className="portal-muted">No files uploaded.</p>}</div></>}<Notice error={error} success={success}/><p className="portal-hint">Files are stored on the backend server and can only be downloaded by authorized accounts.</p></section>;
}

function Inbox({ user, notes, notificationError, onNotificationsChanged }) {
  const [error, setError] = useState('');

  async function mark(id) {
    try {
      await api.notes.markRead(id);
      await onNotificationsChanged();
      setError('');
    } catch (err) { setError(err.message); }
  }

  async function markAll() {
    try {
      await api.notes.markAll();
      await onNotificationsChanged();
      setError('');
    } catch (err) { setError(err.message); }
  }

  return (
    <div className="portal-stack">
      <section className="portal-panel">
        <div className="portal-panel-heading split">
          <div><h2>Application notifications</h2><p>{notes.filter(n => !n.read).length} unread updates</p></div>
          <button className="portal-secondary" onClick={markAll}>Mark all as read</button>
        </div>
        <Notice error={notificationError || error}/>
        <div className="portal-inbox">
          {notes.map(n => (
            <button key={n.id} className={n.read ? 'read' : ''} onClick={() => mark(n.id)}>
              <span className="portal-notification-icon"><Bell size={18} /></span>
              <span><strong>{n.title}</strong><small>{n.reference} · {date(n.createdAt)}</small><p>{n.text}</p></span>
              {!n.read && <i />}
            </button>
          ))}
          {!notes.length && <p>No notifications yet.</p>}
        </div>
      </section>
      <section className="portal-panel">
        <h2>Automatic email and SMS updates</h2>
        <p className="portal-muted">Application confirmations, status updates, inspection schedules and fee assessments are sent automatically to your registered email and mobile number.</p>
        <div className="portal-review-grid">
          <div><small>Email address</small><strong>{user.email || 'Add your email address'}</strong></div>
          <div><small>Mobile number</small><strong>{user.phone || 'Add your mobile number in Profile'}</strong></div>
        </div>
        <p className="portal-muted">Keep your contact information up to date in Profile to receive your updates.</p>
      </section>
    </div>
  );
}
function Profile({user,onProfileUpdated}) {
 const [f,setF]=useState({name:user.name,phone:user.phone,address:user.address});const [passwords,setPasswords]=useState({old:'',next:''});const [msg,setMsg]=useState('');const [error,setError]=useState('');
 return <div className="portal-stack"><section className="portal-panel"><h2>My profile</h2><p className="portal-muted">Update your registered applicant information.</p><form onSubmit={async e=>{e.preventDefault();try{const updated=await updateProfile(user.id,f);onProfileUpdated(updated);setMsg('Profile saved.');setError('');}catch(e){setError(e.message);}}}><div className="portal-form-grid"><label>Full name *<input value={f.name} required onChange={e=>setF({...f,name:e.target.value})}/></label><label>Email (account identifier)<input value={user.email} disabled/></label><label>Phone number *<input value={f.phone} required onChange={e=>setF({...f,phone:e.target.value})}/></label><label>Address *<input value={f.address} required onChange={e=>setF({...f,address:e.target.value})}/></label></div><button className="portal-primary">Save profile</button></form><Notice success={msg} error={error}/></section><section className="portal-panel"><h2>Change password</h2><form onSubmit={async e=>{e.preventDefault();try{await changePassword(user.id,passwords.old,passwords.next);setMsg('Password changed.');setError('');setPasswords({old:'',next:''});}catch(e){setError(e.message);}}}><div className="portal-form-grid"><label>Current password<input required type="password" value={passwords.old} onChange={e=>setPasswords({...passwords,old:e.target.value})}/></label><label>New password (8+ characters)<input required minLength="8" type="password" value={passwords.next} onChange={e=>setPasswords({...passwords,next:e.target.value})}/></label></div><button className="portal-secondary">Change password</button></form></section></div>;
}
export default function ApplicantPortal({user,onLogout,onProfileUpdated}) {
 const [selectedService,setSelectedService]=useState(null);
 const [page,setPage]=useState(() => { try { const intent=JSON.parse(sessionStorage.getItem('bplo-feature-destination')||'null'); if(intent?.role==='applicant' && NAV.some(([n])=>n===intent.page)) { sessionStorage.removeItem('bplo-feature-destination'); return intent.page; } } catch{} return 'Dashboard'; });const [apps,setApps]=useState([]);const [notes,setNotes]=useState([]);const [notificationError,setNotificationError]=useState('');const [loading,setLoading]=useState(true);const [error,setError]=useState('');const [detail,setDetail]=useState(null);const [ref,setRef]=useState('');const [query,setQuery]=useState('');const [mobile,setMobile]=useState(false);
 const reload=async()=>{try{const all=await api.apps.list();setApps(all.filter(a=>String(a.ownerAccountEmail||a.email||'').toLowerCase()===user.email.toLowerCase()));setError('');}catch(e){setError(e.message);}finally{setLoading(false);}};
 const refreshNotifications=async()=>{try{const latest=await api.notes.list();setNotes(latest);setNotificationError('');return latest;}catch(e){setNotificationError(e.message);return null;}};
 useEffect(()=>{reload();},[user.email]);
 useEffect(()=>{const listener=()=>reload();window.addEventListener('bplo:data-change',listener);return()=>window.removeEventListener('bplo:data-change',listener);},[user.email]);
 useEffect(()=>{
  let active=true;
  let inFlight=false;
  const refresh=async()=>{
   if(inFlight||document.visibilityState==='hidden')return;
   inFlight=true;
   try{const latest=await api.notes.list();if(active){setNotes(latest);setNotificationError('');}}
   catch(e){if(active)setNotificationError(e.message);}
   finally{inFlight=false;}
  };
  refresh();
  const timer=setInterval(refresh,5000);
  window.addEventListener('focus',refresh);
  document.addEventListener('visibilitychange',refresh);
  return()=>{active=false;clearInterval(timer);window.removeEventListener('focus',refresh);document.removeEventListener('visibilitychange',refresh);};
 },[user.id]);
 function go(name){setPage(name);setDetail(null);setMobile(false);setQuery('');window.scrollTo({top:0,behavior:'smooth'});}
 const counts={total:apps.length,pending:apps.filter(a=>a.status==='Pending').length,review:apps.filter(a=>a.status==='Under Review').length,approved:apps.filter(a=>['Approved','Released'].includes(a.status)).length};
 const found=apps.find(a=>a.referenceNumber.toUpperCase()===ref.trim().toUpperCase());
 return <div className="portal-shell"><aside className={'portal-sidebar '+(mobile?'open':'')}><div className="portal-logo"><img src="/calapan-bplo-logo.png" alt="BPLO logo"/><div><strong>CALAPAN CITY</strong><small>BUSINESS PERMITS PORTAL</small></div></div><div className="portal-user"><span><UserCircle size={25}/></span><div><strong>{user.name}</strong><small>Applicant Account</small></div></div><small className="portal-nav-heading">APPLICANT MENU</small><nav>{NAV.map(([name,Icon])=><button key={name} className={page===name?'active':''} onClick={()=>go(name)}><Icon size={19}/>{name}</button>)}</nav><button className="portal-logout" onClick={onLogout}><LogOut size={19}/> Logout</button><div className="portal-side-foot">STUDENT PROJECT<br/>Not an official government portal</div></aside><div className="portal-workspace"><header className="portal-top"><button className="portal-mobile" aria-label="Open menu" onClick={()=>setMobile(!mobile)}><Menu/></button><span>Calapan City Business Permit System</span><div><button onClick={()=>go('Notifications')} aria-label={notes.some(n=>!n.read)?`Notifications, ${notes.filter(n=>!n.read).length} unread`:'Notifications'}><Bell size={19}/>{notes.some(n=>!n.read)&&<span className="portal-unread-count">{notes.filter(n=>!n.read).length}</span>}</button><span className="portal-top-user">{user.name}</span></div></header><main className="portal-content"><div className="portal-page-heading"><div><span className="portal-upper">APPLICANT WORKSPACE</span><h1>{detail?'Application Details':page}</h1><p>Manage your business permit applications and documents in one place.</p></div>{page==='Dashboard'&&<button className="portal-primary" onClick={()=>go('New Application')}>+ New application</button>}</div>{error&&<Notice error={error}/>} {loading&&['Dashboard','My Applications','Track Application','Documents'].includes(page)?<p>Loading your applications…</p>:detail ? (apps.find(a=>a.referenceNumber===detail) ? <ApplicationDetails key={detail} app={apps.find(a=>a.referenceNumber===detail)} onBack={()=>setDetail(null)} onChanged={reload}/> : <section className="portal-panel"><p>Application not found or has been deleted.</p><button className="portal-secondary" onClick={()=>setDetail(null)}>Back</button></section>) : <>
 {page==='Dashboard'&&<><section className="portal-welcome"><div><span>WELCOME BACK</span><h2>Hello, {user.name.split(' ')[0]}!</h2><p>Start a new application or view the progress of your submitted requests.</p><button className="portal-white-btn" onClick={()=>go('New Application')}>Start an application <ArrowRight size={16}/></button></div><div className="portal-welcome-symbol"><FileCheck2 size={66}/></div></section><div className="portal-stat-grid">{[['Total Applications',counts.total],['Pending',counts.pending],['Under Review',counts.review],['Approved / Released',counts.approved]].map(([label,v])=><div className="portal-stat" key={label}><small>{label}</small><strong>{v}</strong></div>)}</div><section className="portal-panel"><div className="portal-panel-heading split"><div><h2>Application history</h2><p>Submissions sorted from oldest to newest</p></div><button className="portal-secondary" onClick={()=>go('My Applications')}>View all</button></div><ApplicationTable apps={oldestApplicationsFirst(apps).slice(0,5)} onView={setDetail}/></section></>}
 {page==='Payments'&&<PaymentsPage/>}
 {page==='BPLO Services'&&<ServiceDirectory onChoose={id=>{setSelectedService(id);go('New Application');}}/>}
 {page==='New Application'&&<ApplicationWizard key={selectedService||'default'} user={user} initialService={selectedService} onCreated={reload}/>}
 {page==='My Applications'&&<section className="portal-panel"><div className="portal-panel-heading split"><div><h2>My applications</h2><p>Manage and review each submission.</p></div><input className="portal-search" aria-label="Search applications" placeholder="Search reference or business" value={query} onChange={e=>setQuery(e.target.value)}/></div><ApplicationTable apps={oldestApplicationsFirst(apps.filter(a=>`${a.referenceNumber} ${a.businessName} ${serviceLabel(a.serviceType)}`.toLowerCase().includes(query.toLowerCase())))} onView={setDetail}/></section>}
 {page==='Track Application'&&<section className="portal-panel"><h2>Track your application</h2><p className="portal-muted">Enter your unique reference number to check its current status.</p><div className="portal-track-search"><input value={ref} onChange={e=>setRef(e.target.value)} placeholder="e.g., BP-2026-XXXXXXXX"/><button className="portal-primary" onClick={()=>{if(found)setDetail(found.referenceNumber);else alert('No application found in your account.');}}>Search</button></div>{found&&<div className="portal-track-summary"><strong>{found.businessName}</strong>{badge(found.status)}<button className="portal-secondary" onClick={()=>setDetail(found.referenceNumber)}>View history</button></div>}</section>}
 {page==='Documents'&&<DocumentCenter key={apps.map(a=>`${a.referenceNumber}:${(a.documents||[]).length}`).join()} apps={apps} onChanged={reload}/>}
 {page==='Notifications'&&<Inbox user={user} notes={notes} notificationError={notificationError} onNotificationsChanged={refreshNotifications}/>}
 {page==='Profile'&&<Profile user={user} onProfileUpdated={onProfileUpdated}/>}
 </>}</main></div></div>;
}
function ApplicationTable({apps,onView}){return <div className="portal-table"><table><thead><tr><th>Application No.</th><th>Business Name</th><th>BPLO Service</th><th>Date Submitted</th><th>Status</th><th>Action</th></tr></thead><tbody>{apps.map(a=><tr key={a.referenceNumber}><td><strong className="portal-ref">{a.referenceNumber}</strong></td><td>{a.businessName}</td><td>{serviceLabel(a.serviceType)}</td><td>{date(a.submittedAt)}</td><td>{badge(a.status)}</td><td><button className="portal-secondary" onClick={()=>onView(a.referenceNumber)}>View details</button></td></tr>)}</tbody></table>{!apps.length&&<p className="portal-empty">No applications yet. Create one using New Application.</p>}</div>}
