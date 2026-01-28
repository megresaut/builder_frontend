export interface ChecklistItemTemplate {
  id: string;
  text: string;
  items?: ChecklistItemTemplate[]; // Support nested items
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
          { id: "ext-1", text: "Driveway – check for cracks, settling and sealing if needed" },
          { id: "ext-2", text: "Check all drains/catch basins (should be cleaned 1-2 yr)" },
          { id: "ext-3", text: "Masonry – Check cobble stone around driveway/joints" },
          { id: "ext-4", text: "Check the front patio for broken stones or if joints need to be filled" },
          { id: "ext-5", text: "Check stone on the house for missing stones, gaps etc." },
          { id: "ext-6", text: "Check all walkways and back patios (joints, broken stones)" },
          { id: "ext-7", text: "Do patios/walkways need to be power washed?" },
          { id: "ext-8", text: "Any stone steps loose or dangerous?" },
          { id: "ext-9", text: "Landscape – Check for browning grass (need water or treatment for bugs?)" },
          { id: "ext-10", text: "Make sure the grass has been cut and not overgrown" },
          { id: "ext-11", text: "Trees/Planting – Check for loose or dead branches" },
          { id: "ext-12", text: "Check for overgrown trees or plants" },
          { id: "ext-13", text: "Plant Beds/Mulch – Check for weeds" },
          { id: "ext-14", text: "Make sure weekly cleanup is happening (leaves, branches etc.)" },
          { id: "ext-15", text: "Perimeter/Decks – Check perimeter fence, fallen trees, damage, opening for animals" },
          { id: "ext-16", text: "Check decks/patio for loose boards, cracking, treatment needed?" },
        ],
      },
      {
        id: "mainhouse",
        title: "Main House",
        items: [
          { id: "mh-1", text: "Trim/Stucco – Check for rotting wood" },
          { id: "mh-2", text: "Paint if needed" },
          { id: "mh-3", text: "Cracking" },
          { id: "mh-4", text: "Missing pieces" },
          { id: "mh-5", text: "Stucco repair" },
          { id: "mh-6", text: "Roof – Check for cracking or missing shingles" },
          { id: "mh-7", text: "Check if it needs to be treated" },
          { id: "mh-8", text: "Gutters – Do they need to be cleaned?" },
          { id: "mh-9", text: "Check for bent or broken gutters" },
          { id: "mh-10", text: "Make sure all downspouts are sealed and connected correctly to drain" },
          { id: "mh-11", text: "Gutter guards needed" },
          { id: "mh-12", text: "Chimneys – Make sure they are clear of animal nesting or debris" },
          { id: "mh-13", text: "Check masonry/missing or broken, need to be sealed?" },
          { id: "mh-14", text: "Make sure they are cleaned once a year depending on the usage" },
          { id: "mh-15", text: "Exterior Lights – Check all exterior lights (on the house and landscape/step lighting)" },
          { id: "mh-16", text: "Windows – Check all windows (broken or need to be cleaned)" },
          { id: "mh-17", text: "Mechanics – Oil tank: Check gauge (if low, get it filled)" },
          { id: "mh-18", text: "Make sure the monitors are attached" },
          { id: "mh-19", text: "Check for gas smells/leaks" },
          { id: "mh-20", text: "HVAC condensers: Make sure clear of debris" },
          { id: "mh-21", text: "Check for abnormal noises" },
          { id: "mh-22", text: "Make sure they are running" },
          { id: "mh-23", text: "Hot water heater: Check for leaks and rust" },
        ],
      },
      {
        id: "interior",
        title: "Interior",
        items: [
          { id: "int-1", text: "Front Door/Foyer – Check the alarm panel for faults" },
          { id: "int-2", text: "Check lights" },
          { id: "int-3", text: "Check for paint touchups" },
          { id: "int-4", text: "Make sure the doorbell works" },
          { id: "int-5", text: "Bring in packages if any" },
          { id: "int-6", text: "Check floors" },
          { id: "int-7", text: "Make sure nothing is blocking the doors all around the house" },
          { id: "int-8", text: "Garage/Basement – Check mechanicals (hvac, electric, water shutoff)" },
          { id: "int-9", text: "Check for leaks" },
          { id: "int-10", text: "Check lights" },
          { id: "int-11", text: "Check plumbing (sink, ice maker)" },
          { id: "int-12", text: "1st Floor - Kitchen – Check plumbing" },
          { id: "int-13", text: "Check walls" },
          { id: "int-14", text: "Check lights" },
          { id: "int-15", text: "1st Floor - Living Room – Check lights" },
          { id: "int-16", text: "Check floors" },
          { id: "int-17", text: "Check windows" },
          { id: "int-18", text: "Check the thermostats working properly" },
          { id: "int-19", text: "Guest Bedroom – Check walls" },
          { id: "int-20", text: "Check lights" },
          { id: "int-21", text: "Check bathroom (plumbing, tile, lights)" },
          { id: "int-22", text: "Study/TV Room – Check lights" },
          { id: "int-23", text: "Check windows" },
          { id: "int-24", text: "Check for leaks" },
          { id: "int-25", text: "Powder Room – Check plumbing" },
          { id: "int-26", text: "Check tile (shower, grout, sealed)" },
          { id: "int-27", text: "2nd Floor - Master Bath – Check plumbing" },
          { id: "int-28", text: "Check tile and grout (sealed)" },
          { id: "int-29", text: "Check lights" },
          { id: "int-30", text: "Check windows" },
          { id: "int-31", text: "Master Bedroom – Check walls" },
          { id: "int-32", text: "Check windows" },
          { id: "int-33", text: "Check lights" },
          { id: "int-34", text: "Check crawl space" },
          { id: "int-35", text: "2nd Floor - Guest Rooms – Check walls" },
          { id: "int-36", text: "Check doors" },
          { id: "int-37", text: "Check windows" },
          { id: "int-38", text: "Check lights" },
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
