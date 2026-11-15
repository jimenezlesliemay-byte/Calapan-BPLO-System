// Student prototype catalog: informational labels, not verified legal filing requirements.
// Actual permits, prerequisites and fees depend on the relevant offices and transaction.
export const BPLO_SERVICES = [
  { id: 'barangay-clearance', name: 'Barangay Business Clearance', summary: 'Record or attach barangay-level clearance documents for a business application.', note: 'Barangay clearances may be handled by the relevant barangay office.' },
  { id: 'business-registration', name: 'Business Registration', summary: 'Register a new business and manage its basic information and supporting papers.', note: 'Business name or entity registration is handled by the appropriate registering agency.' },
  { id: 'fire-safety', name: 'Fire Safety Inspection Certificate', summary: 'Organize files relating to fire-safety inspection and clearance.', note: 'Fire-safety inspection and certification involve the authorized fire-safety office.' },
  { id: 'sanitary-health', name: 'Sanitary Permit at Health Certificate', summary: 'Keep sanitary-permit and health-certificate documents together.', note: 'Health or sanitary clearance depends on business activity and local health requirements.' },
  { id: 'business-tax-fees', name: 'Business Tax at Permit Fees', summary: 'Track records supporting business tax assessment and permit-fee processing.', note: 'An administrator assesses fees and verifies payment proof. Official receipts are issued separately by the receiving office.' },
  { id: 'renewal-inspection', name: 'Permit Renewal at Business Inspection', summary: 'Organize renewal applications and inspectable business details.', note: 'Inspection schedules here are demo records, not official appointments.' },
  { id: 'building-occupancy', name: 'Building at Occupancy Permit', summary: 'Upload reference files for building or occupancy clearance where applicable.', note: 'Building and occupancy permits may be handled by the appropriate building official.' },
];
export const findService = id => BPLO_SERVICES.find(service => service.id === id);
export const serviceLabel = id => findService(id)?.name || 'Business Registration';
