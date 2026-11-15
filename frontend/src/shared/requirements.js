import { BPLO_SERVICES } from './services.js';
const KEY = 'bplo-demo-requirements-v1';
const MIGRATION_KEY = 'bplo-demo-service-list-v1';
export const DEFAULT_REQUIREMENTS = [
  'Business Permit Application Form', 'Valid ID of Owner', 'Proof of Business Address',
  'Business Registration Document', 'Barangay Clearance', 'Cedula',
  ...BPLO_SERVICES.map(service => service.name),
  'Other Supporting Document',
];
export function getRequirements() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (!Array.isArray(saved)) return [...DEFAULT_REQUIREMENTS];
    // Upgrade existing same-browser demos once, preserving any user-added checklist items.
    if (!localStorage.getItem(MIGRATION_KEY)) {
      const merged = [...new Set([...saved, ...BPLO_SERVICES.map(service => service.name)])];
      localStorage.setItem(KEY, JSON.stringify(merged));
      localStorage.setItem(MIGRATION_KEY, '1');
      return merged;
    }
    return saved;
  } catch { return [...DEFAULT_REQUIREMENTS]; }
}
export function saveRequirements(list) {
  const cleaned = [...new Set(list.map(x => String(x).trim()).filter(Boolean))];
  if (!cleaned.length) throw Error('At least one requirement must remain.');
  localStorage.setItem(KEY, JSON.stringify(cleaned));
  localStorage.setItem(MIGRATION_KEY, '1');
  return cleaned;
}

// Illustrative per-service checklists; local offices determine official mandatory items.
export const SERVICE_REQUIREMENTS = {
 'barangay-clearance': ['Barangay Business Clearance Application Form','Valid Government-Issued ID','DTI / SEC / CDA Registration (if available)','Proof of Business Address / Lease Contract','Cedula (if requested)','Previous Barangay Clearance (renewal)','Proof of Barangay Fee Payment'],
 'business-registration': ['Unified Business Permit Application Form','Barangay Business Clearance','DTI / SEC / CDA Registration','Cedula / Community Tax Certificate','Proof of Ownership / Lease Contract','Business Establishment Photo','Owner 2x2 Photo','Homeowners / Condominium Clearance (if applicable)','BPLO Undertaking (if required)','Other Special Permits (if applicable)'],
 'fire-safety': ['Fire Safety Inspection Application / BPLO Referral','Business Permit Application / Existing Permit','DTI / SEC / CDA Registration (if requested)','Building / Occupancy Permit (if applicable)','Building Layout / Floor Plan (if required)','Fire Code Fee Payment Receipt','Fire Safety Inspection Compliance Documents'],
 'sanitary-health': ['Sanitary Permit Application Form','Business Permit Application / Existing Permit','Barangay Clearance (if requested)','DTI / SEC Registration (if requested)','Sanitary Permit Fee Receipt','Sanitary Inspection Report','Health Certificate Application (for workers)','Worker Valid ID','Worker ID Photo','Medical / Laboratory Results (as required)','Health Certificate Fee Receipt'],
 'business-tax-fees': ['Business Permit Application Form','DTI / SEC / CDA Registration','Barangay Business Clearance','Cedula','Capital Investment Declaration (new business)','Gross Sales / Receipts Declaration (renewal)','Financial Statement / ITR (renewal)','Tax Order of Payment / Statement of Account','Previous Official Receipt (renewal)'],
 'renewal-inspection': ['Business Permit Renewal Application Form','Previous Business Permit','Previous Official Receipt','Financial Statement / Income Tax Return','Gross Sales / Receipts Declaration','BIR Tax Returns (if applicable)','Updated Barangay Business Clearance (if requested)','Updated Fire Safety / Sanitary Clearances (if required)','Inspection Report / Compliance Notice (if required)'],
 'building-occupancy': ['Building Permit Application Form','Land Title / Tax Declaration','Owner Consent / Lease Contract (if applicable)','Lot / Site Development Plan','Architectural Plans','Structural Plans','Electrical and Plumbing Plans','Signed and Sealed Technical Plans','Zoning / Locational Clearance','Other Technical Clearances (if applicable)','Occupancy Permit Application','Approved Building Permit and Plans','Certificate of Completion','Required Inspection Reports','Fire Safety Certificate for Occupancy (if applicable)'],
};
export function getServiceRequirements(serviceId) {
 return SERVICE_REQUIREMENTS[serviceId] || getRequirements();
}
export function isOptionalRequirement(requirement) {
 return /\((?:if\b|when\b|for workers\b|renewal\b|new business\b|as required\b)/i.test(requirement);
}
