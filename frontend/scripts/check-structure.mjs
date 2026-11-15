import fs from 'node:fs';
const names = ['src/main.jsx','src/api.js','src/auth.js','src/serviceWorker.js','public/sw.js','src/applicant/ApplicantPortal.jsx','src/admin/AdminApp.jsx','src/shared/files.js','src/shared/exports.js','src/components/Welcome.jsx','src/enhancements.css','docs/SITEMAP.md','docs/ERD.mmd','docs/REQUIREMENTS_MAPPING.md','API_ENDPOINTS.md'];
const missing=names.filter(n=>!fs.existsSync(n));
if(missing.length){console.error('Missing files:',missing.join(', '));process.exit(1);}
console.log('Structure OK:',names.length,'important files present.');
