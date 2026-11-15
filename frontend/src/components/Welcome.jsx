import { getServiceRequirements } from '../shared/requirements';
import React, { useState } from 'react';
import { ArrowRight, ShieldCheck, FileText, Bell, MapPin, CalendarDays, ClipboardCheck, LayoutDashboard, Building2, Eye, EyeOff, Menu } from 'lucide-react';
import { login, register } from '../auth';
import { BPLO_SERVICES } from '../shared/services';

const features = [
  [FileText, 'Online permits', 'Apply for a new business permit or renewal through guided forms.'],
  [ClipboardCheck, 'Document review', 'Upload a requirements checklist and follow verification results.'],
  [Bell, 'Application tracking', 'Track application status, review updates, and notifications.'],
  [CalendarDays, 'Inspection planning', 'View inspection schedules and export a calendar event.'],
  [MapPin, 'Business location', 'Record a location and open it on a map.'],
  [ShieldCheck, 'Separate workspaces', 'Dedicated workspaces for applicants and BPLO staff.'],
];
export default function Welcome({ onAuthenticated }) {
  const [screen, setScreen] = useState('home');
  const [role, setRole] = useState('applicant');
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', password: '' });
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [mobile, setMobile] = useState(false);
  const field = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const start = (s, r = 'applicant') => { sessionStorage.removeItem('bplo-feature-destination'); setScreen(s); setRole(r); setError(''); setMobile(false); setForm({ name: '', email: '', phone: '', address: '', password: '' }); window.scrollTo({ top: 0, behavior: 'auto' }); };
  const featureActions = [
    { screen: 'register', role: 'applicant', cta: 'Start application' },
    { screen: 'login', role: 'applicant', cta: 'Manage documents' },
    { screen: 'login', role: 'applicant', cta: 'Track application' },
    { screen: 'login', role: 'admin', cta: 'Open inspections' },
    { screen: 'register', role: 'applicant', cta: 'Add business location' },
    { screen: 'login', role: 'admin', cta: 'Open admin portal' },
  ];
  const openFeature = (index) => {
    const target = featureActions[index];
    start(target.screen, target.role);
    // Intent is read only after successful sign-in; registration starts on dashboard.
    const page = ['New Application','Documents','Track Application','Inspections','New Application','Dashboard'][index];
    sessionStorage.setItem('bplo-feature-destination', JSON.stringify({ role: target.role, page }));
    window.scrollTo({ top: 0, behavior: 'auto' });
  };
  const chooseService = service => {
    start('register', 'applicant');
    sessionStorage.setItem('bplo-selected-service', service.id);
    sessionStorage.setItem('bplo-feature-destination', JSON.stringify({ role: 'applicant', page: 'New Application' }));
  };
  const showServices = () => {
    setScreen('home'); setMobile(false);
    requestAnimationFrame(() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' }));
  };
  const switchAccess = (screen, role) => {
    const destination = sessionStorage.getItem('bplo-feature-destination');
    const selectedService = sessionStorage.getItem('bplo-selected-service');
    start(screen, role);
    if (destination) sessionStorage.setItem('bplo-feature-destination', destination);
    if (selectedService) sessionStorage.setItem('bplo-selected-service', selectedService);
  };
  const showFeatures = () => {
    setScreen('home'); setMobile(false);
    requestAnimationFrame(() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }));
  };
  async function submit(e) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const authenticated = screen === 'register' ? await register(form) : await login(form.email, form.password, role);
      const intended = JSON.parse(sessionStorage.getItem('bplo-feature-destination') || 'null');
      if (intended?.role === authenticated.role) {
        if (authenticated.role === 'admin') {
          sessionStorage.removeItem('bplo-feature-destination');
          location.hash = encodeURIComponent(intended.page);
        }
      }
      onAuthenticated(authenticated);
    }
    catch (e) { setError(e.message); }
    finally { setSubmitting(false); }
  }
  return <div className="welcome-site">
    <header className="welcome-header"><button className="welcome-logo" onClick={() => start('home')}><img src="/calapan-bplo-logo.png" alt="BPLO logo"/><span>CALAPAN CITY<small>BUSINESS PERMITS & LICENSING</small></span></button>
      <button className="mobile-trigger" aria-label="Toggle navigation" onClick={() => setMobile(!mobile)}><Menu size={23}/></button>
      <nav className={mobile ? 'show' : ''}><button onClick={() => start('home')}>Home</button><button onClick={showFeatures}>Features</button><button onClick={showServices}>BPLO Services</button><button onClick={() => start('login', 'applicant')}>Applicant Login</button><button onClick={() => start('login', 'admin')}>Admin Login</button><button className="welcome-nav-primary" onClick={() => start('register')}>Register <ArrowRight size={16}/></button></nav>
    </header>
    {screen === 'home' ? <>
      <section className="welcome-hero"><div><span className="eyebrow-pill">CALAPAN CITY • DIGITAL SERVICES</span><h1>Business permits, <em>made simpler.</em></h1><p>Apply, manage your documents, and track your business permit application from one convenient online workspace.</p><div className="hero-actions"><button className="btn-solid" onClick={() => start('register')}>Create applicant account <ArrowRight size={18}/></button><button className="btn-outline" onClick={() => start('login', 'admin')}>BPLO Staff Portal</button></div></div><div className="hero-visual"><div className="hero-visual-header"><Building2/> <span>Business Permit Overview</span><span className="preview-dot"/></div><div className="hero-metric"><span>APPLICATION REFERENCE</span><strong>BP-YYYY-XXXXXXXXXX</strong><small>Track your progress from submission to release</small></div><div className="hero-steps">{['Submitted', 'Under Review', 'Approved', 'Released'].map((x, i) => <div key={x}><span className={i < 2 ? 'done' : ''}>{i < 2 ? '✓' : i + 1}</span><small>{x}</small></div>)}</div><div className="hero-card-foot"><ShieldCheck size={18}/> Simple, transparent processing</div></div></section>
      <section id="features" className="welcome-features"><div className="section-title"><span className="eyebrow-pill">PLATFORM FEATURES</span></div><div className="feature-cards">{features.map(([Icon, title, desc], index) => <button type="button" className="feature-card" key={title} onClick={() => openFeature(index)} aria-label={featureActions[index].cta}><span className="feature-icon"><Icon size={22}/></span><h3>{title}</h3><p>{desc}</p><span className="feature-card-action">{featureActions[index].cta} <ArrowRight size={15}/></span></button>)}</div></section>
      <section id="services" className="bplo-public-services"><div className="section-title"><span className="eyebrow-pill">BPLO SERVICE CATALOG</span><h2>Business services & supporting clearances</h2><p>Choose the service you want to include in your demo application. Availability, official requirements, and payments must be confirmed with the appropriate office.</p></div><div className="bplo-services-grid">{BPLO_SERVICES.map((service, index) => <button key={service.id} type="button" className="bplo-service-card" onClick={() => chooseService(service)}><span className="bplo-service-number">{String(index + 1).padStart(2, '0')}</span><h3>{service.name}</h3><p>{service.summary}</p><small className="bplo-service-count">{getServiceRequirements(service.id).length} sample requirements — view after selecting</small><span className="bplo-service-action">Choose this service <ArrowRight size={15}/></span></button>)}</div></section>
      <section className="welcome-end"><div><h2>Ready to experience the BPLO system?</h2><p>Submit an application and follow its progress through review.</p></div><button className="btn-solid" onClick={() => start('register')}>Get started <ArrowRight size={17}/></button></section>
    </> : <main className="access-main"><section className="access-info"><span className="eyebrow-pill">CALAPAN CITY BPLO</span><h1>{screen === 'register' ? 'Start your business application.' : role === 'admin' ? 'BPLO staff workspace.' : 'Welcome back.'}</h1></section><section className="access-card"><div className="access-switch"><button className={screen === 'login' ? 'active' : ''} onClick={() => switchAccess('login', role)}>Sign in</button><button className={screen === 'register' ? 'active' : ''} onClick={() => switchAccess('register', 'applicant')}>Register</button></div><h2>{screen === 'register' ? 'Create an applicant account' : role === 'admin' ? 'Administrator sign in' : 'Applicant sign in'}</h2><p className="muted">{screen === 'register' ? 'Complete all required fields to create your account.' : 'Choose a workspace and enter your credentials.'}</p>
      {screen === 'login' && <div className="role-picker"><button className={role === 'applicant' ? 'active' : ''} onClick={() => { setRole('applicant'); setError(''); }}>Applicant</button><button className={role === 'admin' ? 'active' : ''} onClick={() => { setRole('admin'); setError(''); }}>BPLO Admin</button></div>}
      <form className="access-form" onSubmit={submit}>
        {screen === 'register' && <><label>Full name *<input value={form.name} onChange={e => field('name', e.target.value)} required minLength="3" placeholder="Full legal name"/></label><label>Contact number *<input value={form.phone} onChange={e => field('phone', e.target.value)} required placeholder="09171234567"/></label><label>Home / mailing address *<input value={form.address} onChange={e => field('address', e.target.value)} required placeholder="Barangay, Calapan City"/></label></>}
        <label>Email address *<input type="email" value={form.email} onChange={e => field('email', e.target.value)} required placeholder="you@example.com" autoComplete="email"/></label>
        <label>Password *<span className="pw-holder"><input type={show ? 'text' : 'password'} value={form.password} minLength={screen === 'register' ? 8 : undefined} onChange={e => field('password', e.target.value)} required placeholder="Enter password" autoComplete={screen === 'register' ? 'new-password' : 'current-password'}/><button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'}>{show ? <EyeOff size={18}/> : <Eye size={18}/>}</button></span></label>
        {error && <p className="access-error" role="alert">{error}</p>}
        <button type="submit" className="btn-solid" disabled={submitting}>{submitting ? screen === 'register' ? 'Creating account…' : 'Signing in…' : screen === 'register' ? 'Create account' : 'Sign in'} <ArrowRight size={17}/></button>
      </form>{screen === 'login' && role === 'applicant' && <p className="access-hint">No applicant account yet? <button onClick={() => switchAccess('register', 'applicant')}>Register here.</button></p>}
      
    </section></main>}
    <footer className="welcome-footer">© {new Date().getFullYear()} Calapan City BPLO • Student prototype • No live permit submissions</footer>
  </div>;
}
