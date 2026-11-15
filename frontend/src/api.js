export const defaultCfg = {system:'Business Permit System',city:'Calapan City',email:'',phone:'',emailOn:false,smsOn:false};
// Database-backed REST adapter for the BPLO LavaLust server. No browser-demo CRUD fallback.
const legacyApiUrl = import.meta.env.VITE_API_URL || '';
const configuredBase = import.meta.env.VITE_API_BASE_URL || legacyApiUrl || 'http://localhost:8000';
const normalizedBase = configuredBase.replace(/\/$/, '');
const BASE = normalizedBase.includes('/api/bplo') ? normalizedBase : normalizedBase + '/api/bplo';
const enc = encodeURIComponent;
export async function request(path, method = 'GET', body) {
  const token = localStorage.getItem('bplo-token');
  const isForm = body instanceof FormData;
  let result;
  try { result = await fetch(BASE + path, { method, cache: 'no-store', headers: { ...(!isForm && body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(token && { Authorization: `Bearer ${token}` }) }, body: body === undefined ? undefined : isForm ? body : JSON.stringify(body) }); }
  catch { throw Error('Unable to connect to the LavaLust server. Check the API URL and CORS settings.'); }
  const contentType = result.headers.get('content-type') || '';
  let data;
  try {
    data = contentType.includes('application/json') ? await result.json() : JSON.parse(await result.text());
  } catch {
    const text = await result.text().catch(() => '');
    throw Error(text
      ? 'The backend responded with HTML/non-JSON content. Check that VITE_API_BASE_URL points to the LavaLust backend origin and that the origin is allowed in CORS.'
      : 'The backend did not return a valid JSON response. Check the API URL and server status.');
  }
  if (!result.ok) throw Error(data.message || data.error || `Request failed (HTTP ${result.status}).`);
  return data.data ?? data;
}
const pick = (r, ...keys) => { for (const k of keys) if (r?.[k] !== undefined && r[k] !== null) return r[k]; };
const rows = value => Array.isArray(value) ? value : (value?.items || value?.records || []);
const toDoc = d => ({ documentType: pick(d,'documentType','document_type'), fileName: pick(d,'fileName','file_name') || String(d.file_path || '').split('/').pop(), reviewStatus: pick(d,'reviewStatus','verification_status') || 'Pending', reviewRemarks: pick(d,'reviewRemarks','remarks') || '', savedAt: pick(d,'savedAt','created_at'), id: pick(d,'id','document_id'), fileUrl: pick(d,'fileUrl','file_url') });
const toApp = a => ({ ...a, referenceNumber: String(pick(a,'referenceNumber','application_no','application_id') || ''), businessName: pick(a,'businessName','business_name'), businessAddress: pick(a,'businessAddress','business_address'), businessType: pick(a,'businessType','business_type'), serviceType: pick(a,'serviceType','service_type') || 'business-registration', fullName: pick(a,'fullName','applicant_name','full_name'), email: a.email, contactNumber: pick(a,'contactNumber','contact_number'), status: pick(a,'status','current_status') || 'Pending', submittedAt: pick(a,'submittedAt','application_date'), applicationType: pick(a,'applicationType','application_type') || 'New', documents: rows(a.documents).map(toDoc), statusHistory: rows(pick(a,'statusHistory','status_logs')).map(h => ({ status:h.status, remarks:h.remarks, updatedAt: pick(h,'updatedAt','updated_at') })), inspection: a.inspection || null });
const toPerson = a => ({ id: String(pick(a,'id','applicant_id')), name: pick(a,'name','full_name'), email:a.email, phone: pick(a,'phone','contact_number'), address:a.address, createdAt: pick(a,'createdAt','created_at'), active: pick(a,'active','is_active') === undefined ? true : Boolean(Number(pick(a,'active','is_active'))) });
const toNote = n => ({ id: pick(n,'id','notification_id'), title: n.title || n.type || 'Update', text: pick(n,'text','message'), read: Boolean(Number(pick(n,'read','is_read'))), createdAt: pick(n,'createdAt','created_at'), reference: pick(n,'reference','application_no') });
const remote = {
  payments: {
    list: () => request('/payments'),
    get: ref => request(`/applications/${enc(ref)}/payment`),
    assess: (ref, data) => request(`/applications/${enc(ref)}/payment/assessment`, 'PUT', data),
    resendNotice: ref => request(`/applications/${enc(ref)}/payment/notice`, 'POST', {}),
    submit: (ref, data) => request(`/applications/${enc(ref)}/payment/submissions`, 'POST', data),
    review: (ref, id, data) => request(`/applications/${enc(ref)}/payment/submissions/${enc(id)}/review`, 'PUT', data),
  },
  apps: {
    list: async () => rows(await request('/applications')).map(toApp),
    create: async p => toApp(await request('/applications','POST',p)),
    update: async (ref,p) => request(`/applications/${enc(ref)}`,'PUT',p),
    setStatus: async (ref,status,remarks) => request(`/applications/${enc(ref)}/status`,'PUT',{status,remarks}),
    reviewDoc: async (ref,documentType,status,remarks) => request(`/applications/${enc(ref)}/documents`,'PUT',{documentType,status,remarks}),
    removeDoc: async (ref,id) => request(`/applications/${enc(ref)}/documents/${enc(id)}/delete`,'DELETE'),
    schedule: async (ref,inspection) => request(`/applications/${enc(ref)}/inspection`,'PUT',inspection),
    remove: async ref => request(`/applications/${enc(ref)}`,'DELETE'),
  },
  people: { list: async () => rows(await request('/applicants')).map(toPerson), add:p=>request('/applicants','POST',p), update:p=>request(`/applicants/${enc(p.id)}`,'PUT',p), remove:id=>request(`/applicants/${enc(id)}`,'DELETE') },
  notes: { list: async () => rows(await request('/notifications')).map(toNote), add:async()=>{throw Error('Manual messaging is not configured.');}, markRead:id=>request(`/notifications/${enc(id)}/read`,'PUT'), markAll:()=>request('/notifications/read-all','PUT') },
  audit: { list: async () => rows(await request('/audit-logs')) },
  settings: { get:async()=>({...defaultCfg,...(await request('/settings'))}), save:c=>request('/settings','PUT',c) },
};
export const api = remote;
export async function downloadPaymentProof(ref, id, filename) {
  const response = await fetch(`${BASE}/applications/${enc(ref)}/payment/submissions/${enc(id)}/proof`, {
    cache: 'no-store', headers: { Authorization: `Bearer ${localStorage.getItem('bplo-token') || ''}` }
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw Error(data.message || 'Payment proof is unavailable.');
  }
  const url = URL.createObjectURL(await response.blob());
  const link = document.createElement('a');
  link.href = url; link.download = filename || 'payment-proof';
  document.body.appendChild(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
// Upload the actual file to the authenticated backend.
export async function uploadRemoteFile(ref, type, file) {
  const body = new FormData(); body.append('documentType',type); body.append('file',file);
  return request(`/applications/${enc(ref)}/uploads`,'POST',body);
}

export async function downloadDocument(ref, id, filename) {
  const token = localStorage.getItem('bplo-token');
  const response = await fetch(`${BASE}/applications/${enc(ref)}/documents/${enc(id)}/download`, {cache: 'no-store', headers: {Authorization: `Bearer ${token}`}});
  if (!response.ok) throw Error('Document download denied or unavailable.');
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download=filename||'document'; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),10000);
}
