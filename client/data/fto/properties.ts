export interface Property {
  id: string;
  name: string;
  units: Unit[];
}

export interface Unit {
  id: string;
  name: string;
}

export const PROPERTIES: Property[] = [
  {
    id: "property1",
    name: "22 Indian Chase Dr",
    units: [
      { id: "na", name: "N/A" },
      { id: "unit-a", name: "Unit A" },
      { id: "unit-b", name: "Unit B" },
      { id: "unit-c", name: "Unit C" },
    ],
  },
  {
    id: "property2",
    name: "Property 2",
    units: [
      { id: "na", name: "N/A" },
      { id: "unit-1", name: "Unit 1" },
      { id: "unit-2", name: "Unit 2" },
    ],
  },
];

export const CHARGE_TYPES = [
  { value: "client-expense", label: "Client Expense" },
  { value: "personal-expense", label: "Personal Expense" },
  { value: "avm-expense", label: "AVM Expense" },
];

// Card / payment method used to front the expense. Drives reimbursement
// handling on the approve page: "personal_card" lines get flagged as
// is_reimbursement=true when their bill is created.
export const CARD_OPTIONS = [
  { value: "company_card", label: "Company" },
  { value: "personal_card", label: "Personal" },
];

export const TASKS = [
  { value: "task-1", label: "Doors Need To Be Repaired" },
  { value: "task-2", label: "HVAC Inspection" },
  { value: "task-3", label: "Plumbing Repair" },
  { value: "task-4", label: "Electrical Repair" },
];

export const YES_NO_OPTIONS = [
  { value: "no", label: "No" },
  { value: "yes", label: "Yes" },
];

// Billing options for hour entries
// Maps to backend "no_charge" field: billable = false, non-billable = true
export const BILLING_OPTIONS = [
  { value: "billable", label: "Billable" },
  { value: "non-billable", label: "Non-Billable" },
];

// Helper to convert billing option to backend no_charge value
export const billingToNoCharge = (billing: string | null): boolean => {
  return billing === "non-billable";
};

// Helper to convert backend no_charge to billing option
export const noChargeToBilling = (noCharge: boolean): string => {
  return noCharge ? "non-billable" : "billable";
};
