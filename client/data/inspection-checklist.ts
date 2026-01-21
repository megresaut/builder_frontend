import { ChecklistSectionTemplate, ChecklistItemTemplate } from "./inspections";

export type ChecklistNodeType = "section" | "item";

export interface ChecklistNode {
  id: string;
  parentId: string | null;
  orderIndex: number;
  type: ChecklistNodeType;
  text: string;
  depth: number; // 0 for main sections, 1+ for subsections/items
}

export interface PropertyInspectionChecklist {
  propertyId: string;
  title: string;
  nodes: ChecklistNode[];
  updatedAt: string;
  updatedBy: string;
}

export interface InspectionPhoto {
  id: string;
  inspectionId: string;
  sectionNodeId: string;
  fileRef: string;
  uploadedAt: string;
  comment?: string;
}

export const MOCK_CHECKLIST_NODES: ChecklistNode[] = [
  // Main Section: Exterior (depth 0)
  { id: "s1", parentId: null, orderIndex: 0, type: "section", text: "Exterior", depth: 0 },

  // Subsection: Driveway/Masonry (depth 1)
  { id: "s1-1", parentId: "s1", orderIndex: 0, type: "section", text: "Driveway/Masonry", depth: 1 },
  { id: "i1-1-1", parentId: "s1-1", orderIndex: 0, type: "item", text: "Driveway – check for cracks, settling and sealing if needed.", depth: 2 },
  { id: "i1-1-2", parentId: "s1-1", orderIndex: 1, type: "item", text: "Check all drains/catch basins (should be cleaned 1-2 yr).", depth: 2 },
  { id: "i1-1-3", parentId: "s1-1", orderIndex: 2, type: "item", text: "Masonry", depth: 2 },
  { id: "i1-1-4", parentId: "s1-1", orderIndex: 3, type: "item", text: "Check cobble stone around driveway/joints", depth: 2 },
  { id: "i1-1-5", parentId: "s1-1", orderIndex: 4, type: "item", text: "Check the front patio for broken stones or if joints need to be filled.", depth: 2 },
  { id: "i1-1-6", parentId: "s1-1", orderIndex: 5, type: "item", text: "Check stone on the house for missing stones, gaps etc.", depth: 2 },
  { id: "i1-1-7", parentId: "s1-1", orderIndex: 6, type: "item", text: "Check all walkways and back patios (joints, broken stones).", depth: 2 },
  { id: "i1-1-8", parentId: "s1-1", orderIndex: 7, type: "item", text: "Do patios/walkways need to be power washed?", depth: 2 },
  { id: "i1-1-9", parentId: "s1-1", orderIndex: 8, type: "item", text: "Any stone steps loose or dangerous?", depth: 2 },

  // Subsection: Landscape (depth 1)
  { id: "s1-2", parentId: "s1", orderIndex: 1, type: "section", text: "Landscape", depth: 1 },

  // Sub-subsection: Grass (depth 2)
  { id: "s1-2-1", parentId: "s1-2", orderIndex: 0, type: "section", text: "Grass", depth: 2 },
  { id: "i1-2-1-1", parentId: "s1-2-1", orderIndex: 0, type: "item", text: "Check for browning (need water or does it need to be treated for bugs?).", depth: 3 },
  { id: "i1-2-1-2", parentId: "s1-2-1", orderIndex: 1, type: "item", text: "Make sure the grass has been cut and not overgrown.", depth: 3 },

  // Sub-subsection: Trees/Planting (depth 2)
  { id: "s1-2-2", parentId: "s1-2", orderIndex: 1, type: "section", text: "Trees/Planting", depth: 2 },
  { id: "i1-2-2-1", parentId: "s1-2-2", orderIndex: 0, type: "item", text: "Check for loose or dead branches", depth: 3 },
  { id: "i1-2-2-2", parentId: "s1-2-2", orderIndex: 1, type: "item", text: "Check for overgrown trees or plants", depth: 3 },

  // Sub-subsection: Plant Beds/Mulch (depth 2)
  { id: "s1-2-3", parentId: "s1-2", orderIndex: 2, type: "section", text: "Plant Beds/Mulch", depth: 2 },
  { id: "i1-2-3-1", parentId: "s1-2-3", orderIndex: 0, type: "item", text: "Check for weeds.", depth: 3 },
  { id: "i1-2-3-2", parentId: "s1-2-3", orderIndex: 1, type: "item", text: "Make sure weekly cleanup is happening (leaves, branches etc.).", depth: 3 },

  // Sub-subsection: Perimeter/Decks (depth 2)
  { id: "s1-2-4", parentId: "s1-2", orderIndex: 3, type: "section", text: "Perimeter/Decks", depth: 2 },
  { id: "i1-2-4-1", parentId: "s1-2-4", orderIndex: 0, type: "item", text: "Check perimeter fence, fallen trees, damage, opening for animals.", depth: 3 },
  { id: "i1-2-4-2", parentId: "s1-2-4", orderIndex: 1, type: "item", text: "Check decks/patio", depth: 3 },
  { id: "i1-2-4-3", parentId: "s1-2-4", orderIndex: 2, type: "item", text: "Loose boards, cracking, treatment needed?", depth: 3 },

  // Subsection: Main House (depth 1)
  { id: "s1-3", parentId: "s1", orderIndex: 2, type: "section", text: "Main House", depth: 1 },

  // Sub-subsection: Trim/Stucco (depth 2)
  { id: "s1-3-1", parentId: "s1-3", orderIndex: 0, type: "section", text: "Trim/Stucco", depth: 2 },
  { id: "i1-3-1-1", parentId: "s1-3-1", orderIndex: 0, type: "item", text: "Check for rotting wood.", depth: 3 },
  { id: "i1-3-1-2", parentId: "s1-3-1", orderIndex: 1, type: "item", text: "Paint if needed.", depth: 3 },
  { id: "i1-3-1-3", parentId: "s1-3-1", orderIndex: 2, type: "item", text: "Cracking", depth: 3 },
  { id: "i1-3-1-4", parentId: "s1-3-1", orderIndex: 3, type: "item", text: "Missing pieces.", depth: 3 },
  { id: "i1-3-1-5", parentId: "s1-3-1", orderIndex: 4, type: "item", text: "Stucco repair", depth: 3 },

  // Sub-subsection: Roof (depth 2)
  { id: "s1-3-2", parentId: "s1-3", orderIndex: 1, type: "section", text: "Roof", depth: 2 },
  { id: "i1-3-2-1", parentId: "s1-3-2", orderIndex: 0, type: "item", text: "Check for cracking or missing shingles.", depth: 3 },
  { id: "i1-3-2-2", parentId: "s1-3-2", orderIndex: 1, type: "item", text: "Check if it needs to be treated.", depth: 3 },

  // Sub-subsection: Gutters (depth 2)
  { id: "s1-3-3", parentId: "s1-3", orderIndex: 2, type: "section", text: "Gutters", depth: 2 },
  { id: "i1-3-3-1", parentId: "s1-3-3", orderIndex: 0, type: "item", text: "Do they need to be cleaned?", depth: 3 },
  { id: "i1-3-3-2", parentId: "s1-3-3", orderIndex: 1, type: "item", text: "Check for bent or broken gutters.", depth: 3 },
  { id: "i1-3-3-3", parentId: "s1-3-3", orderIndex: 2, type: "item", text: "Make sure all downspouts are sealed and connected correctly to drain.", depth: 3 },
  { id: "i1-3-3-4", parentId: "s1-3-3", orderIndex: 3, type: "item", text: "Gutter guards needed.", depth: 3 },

  // Sub-subsection: Chimneys (depth 2)
  { id: "s1-3-4", parentId: "s1-3", orderIndex: 3, type: "section", text: "Chimneys", depth: 2 },
  { id: "i1-3-4-1", parentId: "s1-3-4", orderIndex: 0, type: "item", text: "Make sure they are clear of animal nesting or debris.", depth: 3 },
  { id: "i1-3-4-2", parentId: "s1-3-4", orderIndex: 1, type: "item", text: "Check masonry/missing or broken, need to be sealed?", depth: 3 },
  { id: "i1-3-4-3", parentId: "s1-3-4", orderIndex: 2, type: "item", text: "Make sure they are cleaned once a year depending on the usage.", depth: 3 },

  // Sub-subsection: Exterior Lights/Windows/Mechanics (depth 2)
  { id: "s1-3-5", parentId: "s1-3", orderIndex: 4, type: "section", text: "Exterior Lights", depth: 2 },
  { id: "i1-3-5-1", parentId: "s1-3-5", orderIndex: 0, type: "item", text: "Check all exterior lights (on the house and landscape/step lighting).", depth: 3 },

  { id: "s1-3-6", parentId: "s1-3", orderIndex: 5, type: "section", text: "Windows", depth: 2 },
  { id: "i1-3-6-1", parentId: "s1-3-6", orderIndex: 0, type: "item", text: "Check all windows (broken or need to be cleaned).", depth: 3 },

  { id: "s1-3-7", parentId: "s1-3", orderIndex: 6, type: "section", text: "Mechanics", depth: 2 },
  { id: "i1-3-7-1", parentId: "s1-3-7", orderIndex: 0, type: "item", text: "Oil tank:", depth: 3 },
  { id: "i1-3-7-2", parentId: "s1-3-7", orderIndex: 1, type: "item", text: "Check gauge (if low, get it filled).", depth: 4 },
  { id: "i1-3-7-3", parentId: "s1-3-7", orderIndex: 2, type: "item", text: "Make sure the monitors are attached.", depth: 4 },
  { id: "i1-3-7-4", parentId: "s1-3-7", orderIndex: 3, type: "item", text: "Check for gas smells/leaks.", depth: 4 },
  { id: "i1-3-7-5", parentId: "s1-3-7", orderIndex: 4, type: "item", text: "HVAC condensers:", depth: 3 },
  { id: "i1-3-7-6", parentId: "s1-3-7", orderIndex: 5, type: "item", text: "Make sure clear of debris.", depth: 4 },
  { id: "i1-3-7-7", parentId: "s1-3-7", orderIndex: 6, type: "item", text: "Check for abnormal noises.", depth: 4 },
  { id: "i1-3-7-8", parentId: "s1-3-7", orderIndex: 7, type: "item", text: "Make sure they are running", depth: 4 },
  { id: "i1-3-7-9", parentId: "s1-3-7", orderIndex: 8, type: "item", text: "Hot water heater:", depth: 3 },
  { id: "i1-3-7-10", parentId: "s1-3-7", orderIndex: 9, type: "item", text: "Check for leaks", depth: 4 },
  { id: "i1-3-7-11", parentId: "s1-3-7", orderIndex: 10, type: "item", text: "Rust", depth: 4 },

  // Main Section 2: Interior of Main House (depth 0)
  { id: "s2", parentId: null, orderIndex: 1, type: "section", text: "Interior of Main House", depth: 0 },

  // Front Door/Foyer (depth 1)
  { id: "s2-1", parentId: "s2", orderIndex: 0, type: "section", text: "Front Door/Foyer", depth: 1 },
  { id: "i2-1-1", parentId: "s2-1", orderIndex: 0, type: "item", text: "Check the alarm panel for faults.", depth: 2 },
  { id: "i2-1-2", parentId: "s2-1", orderIndex: 1, type: "item", text: "Check lights.", depth: 2 },
  { id: "i2-1-3", parentId: "s2-1", orderIndex: 2, type: "item", text: "Check for paint touchups.", depth: 2 },
  { id: "i2-1-4", parentId: "s2-1", orderIndex: 3, type: "item", text: "Make sure the doorbell works.", depth: 2 },
  { id: "i2-1-5", parentId: "s2-1", orderIndex: 4, type: "item", text: "Bring in packages if any.", depth: 2 },
  { id: "i2-1-6", parentId: "s2-1", orderIndex: 5, type: "item", text: "Check floors", depth: 2 },
  { id: "i2-1-7", parentId: "s2-1", orderIndex: 6, type: "item", text: "Make sure nothing is blocking the doors all around the house", depth: 2 },

  // Garage/Basement (depth 1)
  { id: "s2-2", parentId: "s2", orderIndex: 1, type: "section", text: "Garage/Basement", depth: 1 },
  { id: "i2-2-1", parentId: "s2-2", orderIndex: 0, type: "item", text: "Check mechanicals (hvac, electric, water shutoff)", depth: 2 },
  { id: "i2-2-2", parentId: "s2-2", orderIndex: 1, type: "item", text: "Check for leaks", depth: 2 },
  { id: "i2-2-3", parentId: "s2-2", orderIndex: 2, type: "item", text: "Check lights", depth: 2 },
  { id: "i2-2-4", parentId: "s2-2", orderIndex: 3, type: "item", text: "Check plumbing (sink, ice maker)", depth: 2 },

  // 1st Floor - Kitchen (depth 1)
  { id: "s2-3", parentId: "s2", orderIndex: 2, type: "section", text: "1st Floor - Kitchen", depth: 1 },
  { id: "i2-3-1", parentId: "s2-3", orderIndex: 0, type: "item", text: "Check plumbing", depth: 2 },
  { id: "i2-3-2", parentId: "s2-3", orderIndex: 1, type: "item", text: "Check walls", depth: 2 },
  { id: "i2-3-3", parentId: "s2-3", orderIndex: 2, type: "item", text: "Check lights", depth: 2 },

  // 1st Floor - Living Room (depth 1)
  { id: "s2-4", parentId: "s2", orderIndex: 3, type: "section", text: "1st Floor - Living Room", depth: 1 },
  { id: "i2-4-1", parentId: "s2-4", orderIndex: 0, type: "item", text: "Check lights", depth: 2 },
  { id: "i2-4-2", parentId: "s2-4", orderIndex: 1, type: "item", text: "Check floors", depth: 2 },
  { id: "i2-4-3", parentId: "s2-4", orderIndex: 2, type: "item", text: "Check windows", depth: 2 },
  { id: "i2-4-4", parentId: "s2-4", orderIndex: 3, type: "item", text: "Check the thermostats working properly", depth: 2 },

  // Guest Bedroom (depth 1)
  { id: "s2-5", parentId: "s2", orderIndex: 4, type: "section", text: "Guest Bedroom", depth: 1 },
  { id: "i2-5-1", parentId: "s2-5", orderIndex: 0, type: "item", text: "Check walls", depth: 2 },
  { id: "i2-5-2", parentId: "s2-5", orderIndex: 1, type: "item", text: "Check lights", depth: 2 },
  { id: "i2-5-3", parentId: "s2-5", orderIndex: 2, type: "item", text: "Check bathroom (plumbing, tile, lights)", depth: 2 },

  // Study/TV Room (depth 1)
  { id: "s2-6", parentId: "s2", orderIndex: 5, type: "section", text: "Study/TV Room", depth: 1 },
  { id: "i2-6-1", parentId: "s2-6", orderIndex: 0, type: "item", text: "Check lights", depth: 2 },
  { id: "i2-6-2", parentId: "s2-6", orderIndex: 1, type: "item", text: "Check windows", depth: 2 },
  { id: "i2-6-3", parentId: "s2-6", orderIndex: 2, type: "item", text: "Check for leaks", depth: 2 },

  // Powder Room (depth 1)
  { id: "s2-7", parentId: "s2", orderIndex: 6, type: "section", text: "Powder Room", depth: 1 },
  { id: "i2-7-1", parentId: "s2-7", orderIndex: 0, type: "item", text: "Check plumbing", depth: 2 },
  { id: "i2-7-2", parentId: "s2-7", orderIndex: 1, type: "item", text: "Check tile (shower, grout, sealed)", depth: 2 },

  // 2nd Floor - Master Bath (depth 1)
  { id: "s2-8", parentId: "s2", orderIndex: 7, type: "section", text: "2nd Floor - Master Bath", depth: 1 },
  { id: "i2-8-1", parentId: "s2-8", orderIndex: 0, type: "item", text: "Check plumbing", depth: 2 },
  { id: "i2-8-2", parentId: "s2-8", orderIndex: 1, type: "item", text: "Check tile", depth: 2 },
  { id: "i2-8-3", parentId: "s2-8", orderIndex: 2, type: "item", text: "Check grout (sealed)", depth: 2 },
  { id: "i2-8-4", parentId: "s2-8", orderIndex: 3, type: "item", text: "Check lights", depth: 2 },
  { id: "i2-8-5", parentId: "s2-8", orderIndex: 4, type: "item", text: "Check windows", depth: 2 },

  // Master Bedroom (depth 1)
  { id: "s2-9", parentId: "s2", orderIndex: 8, type: "section", text: "Master Bedroom", depth: 1 },
  { id: "i2-9-1", parentId: "s2-9", orderIndex: 0, type: "item", text: "Check walls", depth: 2 },
  { id: "i2-9-2", parentId: "s2-9", orderIndex: 1, type: "item", text: "Check windows", depth: 2 },
  { id: "i2-9-3", parentId: "s2-9", orderIndex: 2, type: "item", text: "Check lights", depth: 2 },
  { id: "i2-9-4", parentId: "s2-9", orderIndex: 3, type: "item", text: "Check crawl space", depth: 2 },

  // 2nd Floor - Guest Rooms (depth 1)
  { id: "s2-10", parentId: "s2", orderIndex: 9, type: "section", text: "2nd Floor - Guest Rooms", depth: 1 },
  { id: "i2-10-1", parentId: "s2-10", orderIndex: 0, type: "item", text: "Check walls", depth: 2 },
  { id: "i2-10-2", parentId: "s2-10", orderIndex: 1, type: "item", text: "Check doors", depth: 2 },
  { id: "i2-10-3", parentId: "s2-10", orderIndex: 2, type: "item", text: "Check windows", depth: 2 },
  { id: "i2-10-4", parentId: "s2-10", orderIndex: 3, type: "item", text: "Check lights", depth: 2 },
];

export const MOCK_INSPECTION_CHECKLIST: PropertyInspectionChecklist = {
  propertyId: "1-woodland",
  title: "1 Woodland Rd - Inspection Checklist",
  nodes: MOCK_CHECKLIST_NODES,
  updatedAt: new Date().toISOString(),
  updatedBy: "Property Manager: Chris Schenarts",
};
