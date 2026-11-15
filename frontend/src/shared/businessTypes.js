export const SERVICE_TYPES = {
  "barangay-clearance": [
    "Sari-Sari Store",
    "Grocery / Convenience Store",
    "Restaurant / Eatery / Carinderia",
    "Online Selling / E-Commerce",
    "Retail / Wholesale Business",
    "Salon / Barbershop",
    "Laundry Shop",
    "Repair Shop",
    "Hardware Store",
    "Pharmacy / Drugstore",
    "Office / Professional Services",
    "Others"
  ],
  "business-registration": [
    "Sole Proprietorship",
    "Partnership",
    "Corporation",
    "One Person Corporation (OPC)",
    "Cooperative"
  ],
  "fire-safety": [
    "Retail Store / Commercial Shop",
    "Restaurant / Food Establishment",
    "Office / Business Center",
    "Hotel / Lodging House",
    "Warehouse / Storage Facility",
    "Factory / Manufacturing Facility",
    "School / Educational Facility",
    "Clinic / Healthcare Facility",
    "Apartment / Residential Building",
    "Mixed-Use Building",
    "Others"
  ],
  "sanitary-health": [
    "Restaurant",
    "Carinderia / Eatery",
    "Bakery",
    "Café / Coffee Shop",
    "Food Stall / Food Kiosk",
    "Grocery / Supermarket",
    "Meat Shop / Fish Shop",
    "Water Refilling Station",
    "Salon / Barbershop",
    "Spa / Massage Establishment",
    "Hotel / Lodging House",
    "Laundry Shop",
    "Others"
  ],
  "business-tax-fees": [
    "Retail Business",
    "Wholesale Business",
    "Manufacturer",
    "Restaurant / Food Business",
    "Contractor / Construction Business",
    "Service Provider",
    "Financial Institution",
    "Real Estate Business",
    "Transportation Business",
    "Others"
  ],
  "renewal-inspection": [
    "Retail Store",
    "Restaurant / Food Establishment",
    "Wholesale Business",
    "Manufacturing Business",
    "Service Business",
    "Salon / Barbershop",
    "Hotel / Accommodation",
    "Construction Business",
    "Transportation Business",
    "Others"
  ],
  "building-occupancy": [
    "Residential Building",
    "Commercial Building",
    "Office Building",
    "Restaurant / Food Establishment",
    "Warehouse",
    "Industrial / Factory Building",
    "Apartment / Boarding House",
    "Hotel / Lodging Building",
    "Mixed-Use Building",
    "Others"
  ]
};
export const SERVICE_TRANSACTIONS = {
  "sanitary-health": [
    "Sanitary Permit",
    "Health Certificate",
    "Both"
  ],
  "business-tax-fees": [
    "New Business Tax Assessment",
    "Business Tax Renewal",
    "Permit Fee Payment",
    "Additional Fees / Surcharges"
  ],
  "renewal-inspection": [
    "Business Permit Renewal",
    "Annual Business Inspection",
    "Reinspection",
    "Compliance Verification"
  ],
  "building-occupancy": [
    "Building Permit",
    "Occupancy Permit",
    "Renovation / Alteration Permit",
    "Addition / Extension Permit"
  ]
};
export const serviceTypeLabel = id => id==='business-registration'?'Business ownership type':id==='fire-safety'?'Establishment type':id==='building-occupancy'?'Building type':'Business type';
