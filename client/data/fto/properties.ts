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

export const TASKS = [
  { value: "na", label: "N/A" },
  { value: "task-1", label: "Doors Need To Be Repaired" },
  { value: "task-2", label: "HVAC Inspection" },
  { value: "task-3", label: "Plumbing Repair" },
  { value: "task-4", label: "Electrical Repair" },
];

export const YES_NO_OPTIONS = [
  { value: "no", label: "No" },
  { value: "yes", label: "Yes" },
];
