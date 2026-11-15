import React, { useEffect, useState } from 'react';
import { CreditCard, Download, RefreshCw, ArrowLeft } from 'lucide-react';
import { api, downloadPaymentProof } from '../api';
import './payments.css';

const money = cents => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(cents) / 100);
const today = () => {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en', { timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date()).map(part => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
};
const date = value => value ? new Date(value.includes(' ') ? value.replace(' ', 'T') + 'Z' : value).toLocaleDateString('en-PH') : '—';
const Badge = ({ status }) => <span className={`payment-badge ${status.toLowerCase().replaceAll(' ', '-')}`}>{status}</span>;
const Message = ({ error, message }) => <>{error && <p className="payment-error" role="alert">{error}</p>}{message && <p className="payment-success" role="status">{message}</p>}</>;

function AssessmentForm({ assessment, onSave, busy }) {
  const [noFee, setNoFee] = useState(assessment ? Number(assessment.amount_cents) === 0 : false);
  const [form, setForm] = useState({ amount: assessment ? (Number(assessment.amount_cents) / 100).toFixed(2) : '',
    purpose: assessment?.purpose || '', method: assessment?.method || 'GCash', accountName: assessment?.account_name || '',
    accountNumber: assessment?.account_number || '', instructions: assessment?.instructions || '' });
  const change = (key, value) => setForm(current => ({ ...current, [key]: value }));
  return <form className="payment-form" onSubmit={e => { e.preventDefault(); onSave({ ...form, amount: noFee ? '0' : form.amount }); }}>
    <h3>{assessment ? 'Edit fee assessment' : 'Set fee assessment'}</h3>
    <label className="payment-check"><input type="checkbox" checked={noFee} disabled={busy} onChange={e => setNoFee(e.target.checked)} />No fee required</label>
    <div className="payment-grid">
      {!noFee && <label>Amount due (PHP)<input required type="number" min="0.01" max="1000000" step="0.01" value={form.amount} disabled={busy} onChange={e => change('amount', e.target.value)} /></label>}
      <label className="payment-wide">{noFee ? 'Reason no fee is required' : 'Fee description'}<input required maxLength={500} value={form.purpose} disabled={busy} onChange={e => change('purpose', e.target.value)} placeholder="Describe the assessed fee" /></label>
      {!noFee && <><label>Payment method<select value={form.method} disabled={busy} onChange={e => change('method', e.target.value)}><option>GCash</option><option>Maya</option><option>Bank Transfer</option></select></label>
        <label>Recipient account name<input required maxLength={180} value={form.accountName} disabled={busy} onChange={e => change('accountName', e.target.value)} /></label>
        <label>Account / mobile number<input required maxLength={100} value={form.accountNumber} disabled={busy} onChange={e => change('accountNumber', e.target.value)} /></label></>}
      <label className="payment-wide">{noFee ? 'Additional notes (optional)' : 'Payment instructions / bank name'}<textarea maxLength={2000} rows={3} value={form.instructions} disabled={busy} onChange={e => change('instructions', e.target.value)} placeholder={noFee ? '' : 'For bank transfers, include the bank name. Add any other payment instructions.'} /></label>
    </div>
    <p className="payment-muted">Saving sends the amount and application reference to the applicant's registered email and mobile number. Email includes the full payment instructions. This assessment locks after the first proof submission.</p>
    <button className="payment-button primary" disabled={busy}>{busy ? 'Saving and sending notifications…' : 'Save assessment & notify'}</button>
  </form>;
}

function ProofForm({ fee, busy, onSubmit }) {
  const [form, setForm] = useState({ amount: (Number(fee.amount_cents) / 100).toFixed(2), reference: '', paidOn: today() });
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const change = (key, value) => setForm(current => ({ ...current, [key]: value }));
  return <form className="payment-form" onSubmit={async e => {
    e.preventDefault();
    if (!file || !['application/pdf', 'image/png', 'image/jpeg'].includes(file.type) || file.size < 1 || file.size > 5 * 1024 * 1024) {
      setError('Choose a nonempty PDF, JPG or PNG no larger than 5 MB.'); return;
    }
    setError('');
    const body = new FormData();
    Object.entries(form).forEach(([key, value]) => body.append(key, value));
    body.append('file', file);
    await onSubmit(body);
  }}>
    <h3>Submit payment proof</h3>
    <p className="payment-muted">Pay the amount above using {fee.method}, then submit the transaction details. Uploading proof sends it for review.</p>
    <div className="payment-grid">
      <label>Amount paid (PHP)<input required type="number" step="0.01" min="0.01" max="1000000" disabled={busy} value={form.amount} onChange={e => change('amount', e.target.value)} /></label>
      <label>Transaction reference<input required minLength={4} maxLength={100} disabled={busy} value={form.reference} onChange={e => change('reference', e.target.value)} /></label>
      <label>Payment date<input required type="date" max={today()} disabled={busy} value={form.paidOn} onChange={e => change('paidOn', e.target.value)} /></label>
      <label>Proof of payment<input required type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" disabled={busy} onChange={e => setFile(e.target.files?.[0] || null)} /><small>PDF, JPG or PNG, up to 5 MB.</small></label>
    </div>
    <Message error={error} />
    <button className="payment-button primary" disabled={busy}>{busy ? 'Uploading…' : 'Submit for verification'}</button>
  </form>;
}

function ReviewForm({ submission, busy, onReview }) {
  const [status, setStatus] = useState('Verified');
  const [remarks, setRemarks] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  return <form className="payment-review" onSubmit={e => { e.preventDefault(); onReview(submission.id, { status, remarks }); }}>
    <h4>Review this payment</h4>
    <p className="payment-muted">Compare the reference, amount, date and recipient with the actual received transaction in the recipient account.</p>
    <div className="payment-grid"><label>Decision<select disabled={busy} value={status} onChange={e => setStatus(e.target.value)}><option value="Verified">Verify payment received</option><option value="Rejected">Reject proof</option></select></label>
      <label>Remarks{status === 'Rejected' ? ' (required)' : ' (optional)'}<input required={status === 'Rejected'} maxLength={1000} disabled={busy} value={remarks} onChange={e => setRemarks(e.target.value)} /></label></div>
    {status === 'Verified' && <label className="payment-check"><input required type="checkbox" disabled={busy} checked={confirmed} onChange={e => setConfirmed(e.target.checked)} />I confirmed this payment in the recipient account.</label>}
    <button className="payment-button primary" disabled={busy}>{busy ? 'Saving…' : 'Save review'}</button>
  </form>;
}

function NoticeDelivery({ notice, busy, canSend, onRetry }) {
  const labels = { sent: 'Sent to email provider', accepted: 'Accepted by TextBee', failed: 'Failed', disabled: 'Disabled', not_configured: 'Not configured', invalid_recipient: 'Invalid recipient', not_sent: 'Not sent' };
  const complete = notice && ['sent', 'accepted'].includes(notice.email?.status) && ['sent', 'accepted'].includes(notice.sms?.status);
  return <div className="payment-notifications"><h3>Fee notification results</h3>
    {notice ? <div className="payment-grid">{['email', 'sms'].map(channel => {
      const delivery = notice[channel];
      const success = ['sent', 'accepted'].includes(delivery?.status);
      return <div key={channel}><strong>{channel === 'email' ? 'Email' : 'SMS'}: <span className={success ? 'payment-delivery-ok' : 'payment-delivery-error'}>{labels[delivery?.status] || 'Not sent'}</span></strong><p className="payment-muted">{delivery?.detail || 'No delivery attempt recorded.'}</p></div>;
    })}</div> : <p className="payment-muted">No email or SMS notification attempt has been recorded for this assessment.</p>}
    {canSend && !complete && <button className="payment-button" disabled={busy} onClick={onRetry}>{busy ? 'Sending…' : notice ? 'Retry unsuccessful notifications' : 'Send fee notice by email & SMS'}</button>}
    {notice && !complete && <p className="payment-muted">The assessment remains saved. A retry sends only through channels that were unsuccessful.</p>}
  </div>;
}

export function PaymentPanel({ reference, admin = false, applicationStatus, onChanged }) {
  const [state, setState] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [noticeFeedback, setNoticeFeedback] = useState(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const load = async () => { const next = await api.payments.get(reference); setState(next); return next; };
  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try { const next = await api.payments.get(reference); if (active) { setState(next); setError(''); } }
      catch (e) { if (active) setError(e.message); }
      finally { if (active) setLoading(false); }
    };
    refresh();
    window.addEventListener('focus', refresh);
    return () => { active = false; window.removeEventListener('focus', refresh); };
  }, [reference]);
  const run = async (action, success) => {
    setBusy(true); setError(''); setMessage(''); setNoticeFeedback(null);
    try {
      const result = await action();
      setMessage(typeof success === 'function' ? success(result) : success);
      if (result?.notice) setNoticeFeedback(result.notice);
      await load();
      if (onChanged) await onChanged();
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };
  const fee = state?.assessment;
  const closed = ['Released', 'Rejected'].includes(applicationStatus);
  return <section className="payment-panel">
    <div className="payment-heading"><div><span className="payment-eyebrow"><CreditCard size={16} />MANUAL PAYMENT</span><h2>Payment details</h2><p className="payment-muted">{reference}</p></div>
      <button className="payment-button" disabled={busy || loading} onClick={() => run(async () => {}, 'Payment details refreshed.')}><RefreshCw size={15} />Refresh</button></div>
    <Message error={error} message={message} />
    {loading ? <p role="status">Loading payment details…</p> : !state ? <button className="payment-button" disabled={busy} onClick={() => run(async () => {}, '')}>Retry</button> : <>
      <div className="payment-summary"><div><small>{fee ? 'Assessed amount' : 'Assessment'}</small><strong>{fee ? money(fee.amount_cents) : 'Not yet assessed'}</strong></div><Badge status={state.paymentStatus} /></div>
      {fee && <><p className="payment-purpose">{fee.purpose}</p>{Number(fee.amount_cents) > 0 && <dl className="payment-details"><div><dt>Payment method</dt><dd>{fee.method}</dd></div><div><dt>Account name</dt><dd>{fee.account_name}</dd></div><div><dt>Account / mobile number</dt><dd>{fee.account_number}</dd></div></dl>}{fee.instructions && <p className="payment-instructions">{fee.instructions}</p>}</>}
      {closed && <p className="payment-muted">Payment changes are closed while this application is {applicationStatus.toLowerCase()}.</p>}
      {admin && !closed && !state.submissions.length && <AssessmentForm key={JSON.stringify(fee)} assessment={fee} busy={busy} onSave={data => run(() => api.payments.assess(reference, data), result => result.message)} />}
      {admin && fee && <NoticeDelivery notice={noticeFeedback || state.notice} busy={busy} canSend={!closed && !state.submissions.length} onRetry={() => run(() => api.payments.resendNotice(reference), result => result.message)} />}
      {admin && !!state.submissions.length && <p className="payment-muted">The assessment is locked to preserve the submitted payment history.</p>}
      {!admin && !closed && !fee && <p className="payment-muted">Wait for an administrator to assess the fee before making a payment.</p>}
      {!admin && !closed && ['Unpaid', 'Rejected'].includes(state.paymentStatus) && <ProofForm key={`${JSON.stringify(fee)}:${state.submissions.length}`} fee={fee} busy={busy} onSubmit={body => run(() => api.payments.submit(reference, body), 'Proof submitted. Please wait for administrator verification.')} />}
      {state.paymentStatus === 'Awaiting verification' && <p className="payment-notice">Proof received. An administrator will verify the transaction before it is marked paid.</p>}
      {state.paymentStatus === 'Paid' && <p className="payment-notice">Payment has been verified. Application approval and release are handled separately.</p>}
      {!!state.submissions.length && <div className="payment-history"><h3>Payment history</h3>{[...state.submissions].reverse().map(proof => <article key={proof.id} className="payment-attempt">
        <div className="payment-heading"><strong>{money(proof.amount_cents)} · {proof.method}</strong><Badge status={proof.review_status} /></div>
        <dl className="payment-details"><div><dt>Transaction reference</dt><dd>{proof.payment_reference}</dd></div><div><dt>Payment date</dt><dd>{date(proof.paid_on)}</dd></div><div><dt>Submitted</dt><dd>{date(proof.submitted_at)}</dd></div></dl>
        {proof.review_remarks && <p className="payment-instructions"><strong>Review remarks: </strong>{proof.review_remarks}</p>}
        {proof.reviewed_at && <p className="payment-muted">Reviewed {date(proof.reviewed_at)} · Administrator #{proof.reviewed_by}</p>}
        <button className="payment-button" disabled={busy} onClick={() => run(() => downloadPaymentProof(reference, proof.id, proof.file_name), '')}><Download size={15} />{proof.file_name}</button>
        {admin && !closed && proof.review_status === 'Pending' && <ReviewForm submission={proof} busy={busy} onReview={(id, data) => run(() => api.payments.review(reference, id, data), 'Payment review saved and applicant notified.')} />}
      </article>)}</div>}
    </>}
  </section>;
}

export default function PaymentsPage({ admin = false }) {
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const load = async () => {
    try { setRows(await api.payments.list()); setError(''); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); window.addEventListener('focus', load); return () => window.removeEventListener('focus', load); }, []);
  const row = rows.find(item => item.referenceNumber === selected);
  const filtered = rows.filter(item => `${item.referenceNumber} ${item.businessName} ${item.fullName}`.toLowerCase().includes(query.toLowerCase()) && (filter === 'All' || item.paymentStatus === filter));
  if (row) return <div className="payment-stack"><button className="payment-button" onClick={() => setSelected(null)}><ArrowLeft size={15} />Back to payments</button><PaymentPanel key={selected} reference={selected} applicationStatus={row.applicationStatus} admin={admin} onChanged={load} /></div>;
  return <section className="payment-panel"><div className="payment-heading"><div><h2>{admin ? 'Payment assessments and verification' : 'My payments'}</h2><p className="payment-muted">{admin ? 'Set fees, review proof and verify received transactions.' : 'View your amount due, recipient details and payment status.'}</p></div><button className="payment-button" onClick={load}><RefreshCw size={15} />Refresh</button></div>
    <Message error={error} />
    <div className="payment-toolbar"><label>Search<input value={query} onChange={e => setQuery(e.target.value)} placeholder="Reference, business or applicant" /></label><label>Payment status<select value={filter} onChange={e => setFilter(e.target.value)}>{['All', 'Not assessed', 'Unpaid', 'Awaiting verification', 'Paid', 'Rejected', 'No fee required'].map(status => <option key={status}>{status}</option>)}</select></label></div>
    {loading ? <p role="status">Loading payments…</p> : <div className="payment-table"><table><thead><tr><th>Application</th><th>Business</th>{admin && <th>Applicant</th>}<th>Amount due</th><th>Payment status</th><th>Action</th></tr></thead><tbody>{filtered.map(item => <tr key={item.referenceNumber}><td>{item.referenceNumber}</td><td>{item.businessName}</td>{admin && <td>{item.fullName}</td>}<td>{item.assessment ? money(item.assessment.amount_cents) : '—'}</td><td><Badge status={item.paymentStatus} /></td><td><button className="payment-button" onClick={() => setSelected(item.referenceNumber)}>{admin ? 'Manage payment' : 'View payment'}</button></td></tr>)}</tbody></table>{!filtered.length && <p className="payment-muted">No matching applications.</p>}</div>}
  </section>;
}
