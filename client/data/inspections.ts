export interface ChecklistItemTemplate {
  id: string;
  text: string;
}

export interface ChecklistSectionTemplate {
  id: string;
  title: string;
  items: ChecklistItemTemplate[];
}

export interface InspectionTemplate {
  id: string;
  name: string;
  description: string;
  sections: ChecklistSectionTemplate[];
  isDefault: boolean;
  updatedAt: string;
  updatedBy: string;
}

export const DEFAULT_INSPECTION_TEMPLATES: InspectionTemplate[] = [
  {
    id: "default",
    name: "Default Template",
    description: "Standard building inspection checklist",
    isDefault: true,
    updatedAt: "Oct 1, 2025",
    updatedBy: "Admin",
    sections: [
      {
        id: "exterior",
        title: "Exterior",
        items: [
          { id: "ext-1", text: "Roof condition" },
          { id: "ext-2", text: "Gutters and downspouts" },
          { id: "ext-3", text: "Siding and trim" },
          { id: "ext-4", text: "Windows and doors" },
          { id: "ext-5", text: "Foundation" },
        ],
      },
      {
        id: "interior",
        title: "Interior",
        items: [
          { id: "int-1", text: "Walls and ceilings" },
          { id: "int-2", text: "Flooring" },
          { id: "int-3", text: "Doors and hardware" },
          { id: "int-4", text: "Light fixtures and outlets" },
        ],
      },
      {
        id: "systems",
        title: "Systems",
        items: [
          { id: "sys-1", text: "Electrical system" },
          { id: "sys-2", text: "Plumbing system" },
          { id: "sys-3", text: "HVAC system" },
          { id: "sys-4", text: "Water heater" },
        ],
      },
    ],
  },
  {
    id: "hvac",
    name: "HVAC Inspection",
    description: "Specialized HVAC system inspection",
    isDefault: false,
    updatedAt: "Sep 15, 2025",
    updatedBy: "John Doe",
    sections: [
      {
        id: "hvac-exterior",
        title: "Exterior Units",
        items: [
          { id: "hvac-e1", text: "Condenser unit condition" },
          { id: "hvac-e2", text: "Refrigerant lines" },
          { id: "hvac-e3", text: "Clearance and debris" },
        ],
      },
      {
        id: "hvac-interior",
        title: "Interior Units",
        items: [
          { id: "hvac-i1", text: "Air handler condition" },
          { id: "hvac-i2", text: "Thermostat operation" },
          { id: "hvac-i3", text: "Ductwork integrity" },
        ],
      },
    ],
  },
  {
    id: "plumbing",
    name: "Plumbing Inspection",
    description: "Comprehensive plumbing system check",
    isDefault: false,
    updatedAt: "Sep 20, 2025",
    updatedBy: "Jane Smith",
    sections: [
      {
        id: "plumb-main",
        title: "Main Lines",
        items: [
          { id: "plumb-m1", text: "Main water shutoff" },
          { id: "plumb-m2", text: "Supply lines" },
          { id: "plumb-m3", text: "Drain lines" },
        ],
      },
      {
        id: "plumb-fixtures",
        title: "Fixtures",
        items: [
          { id: "plumb-f1", text: "Sinks and faucets" },
          { id: "plumb-f2", text: "Toilets" },
          { id: "plumb-f3", text: "Showers/tubs" },
        ],
      },
    ],
  },
];
