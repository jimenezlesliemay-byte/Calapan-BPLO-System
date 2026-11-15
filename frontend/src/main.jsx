import React, { useState, useEffect, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { registerServiceWorker } from './serviceWorker';
import { currentUser, logout, fetchMe } from './auth';
import Welcome from './components/Welcome';
import './style.css';
import './enhancements.css';
import './design-fixes.css';
import './services.css';
import './brand-theme.css';

const AdminApp = lazy(() => import('./admin/AdminApp'));
const ApplicantPortal = lazy(() => import('./applicant/ApplicantPortal'));

function App() {
  const [user, setUser] = useState(currentUser);
  const [checking, setChecking] = useState(()=>!currentUser());
  useEffect(()=>{
    fetchMe().then(setUser).finally(()=>setChecking(false));
  },[]);
  const exit = () => { logout(); location.hash = ''; setUser(null); };
  if (checking) return <p style={{padding:'2rem'}}>Checking your login…</p>;
  if (user?.role === 'admin') return <AdminApp user={user} onLogout={exit} />;
  if (user?.role === 'applicant') return <ApplicantPortal user={user} onProfileUpdated={setUser} onLogout={exit} />;
  return <Welcome onAuthenticated={setUser} />;
}

createRoot(document.getElementById('root')).render(<React.StrictMode><Suspense fallback={<p className="app-loading" role="status">Loading workspace…</p>}><App /></Suspense></React.StrictMode>);
registerServiceWorker();
