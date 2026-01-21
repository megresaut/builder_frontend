import { ChecklistSectionTemplate, ChecklistItemTemplate } from "./inspections";

export type ChecklistNodeType = "section" | "item";

export interface ChecklistNode {
  id: string;
  parentId: string | null;
  orderIndex: number;
  type: ChecklistNodeType;
  text: string;
  depth: number; // 0 for sections, 1+ for items
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
  // Section 1: Exterior
  { id: "s1", parentId: null, orderIndex: 0, type: "section", text: "Exterior", depth: 0 },
  { id: "i1-1", parentId: "s1", orderIndex: 0, type: "item", text: "Roof: Inspect shingles, flashing, chimneys, vents; note damage or missing shingles", depth: 1 },
  { id: "i1-2", parentId: "s1", orderIndex: 1, type: "item", text: "Gutters & Downspouts: Check for clogs, secure attachment, and drainage away from foundation", depth: 1 },
  { id: "i1-3", parentId: "s1", orderIndex: 2, type: "item", text: "Siding & Trim: Check for rot, holes, cracks, and peeling paint", depth: 1 },
  { id: "i1-4", parentId: "s1", orderIndex: 3, type: "item", text: "Foundation & Grading: Look for cracks, settlement, and proper grading away from structure", depth: 1 },
  { id: "i1-5", parentId: "s1", orderIndex: 4, type: "item", text: "Driveway & Walkways: Inspect condition and tripping hazards", depth: 1 },
  { id: "i1-6", parentId: "s1", orderIndex: 5, type: "item", text: "Landscaping & Drainage: Observe trees near structure, grading, and standing water", depth: 1 },
  { id: "i1-7", parentId: "s1", orderIndex: 6, type: "item", text: "Exterior Doors & Locks: Check operation, weatherstripping, and thresholds", depth: 1 },
  { id: "i1-8", parentId: "s1", orderIndex: 7, type: "item", text: "Decks & Porches: Inspect structure, railing, stairs, and ledger connections", depth: 1 },

  // Section 2: Garage / Carport
  { id: "s2", parentId: null, orderIndex: 1, type: "section", text: "Garage / Carport", depth: 0 },
  { id: "i2-1", parentId: "s2", orderIndex: 0, type: "item", text: "Garage Door Operation: Inspect opener, springs, and safety sensors", depth: 1 },
  { id: "i2-2", parentId: "s2", orderIndex: 1, type: "item", text: "Garage Structure & Floor: Check for moisture, cracks, and condition", depth: 1 },
  { id: "i2-3", parentId: "s2", orderIndex: 2, type: "item", text: "Storage & Lighting: Ensure adequate lighting and safe storage", depth: 1 },

  // Section 3: Interior
  { id: "s3", parentId: null, orderIndex: 2, type: "section", text: "Interior", depth: 0 },
  { id: "i3-1", parentId: "s3", orderIndex: 0, type: "item", text: "Entryway & Hallways: Check doors, closet operation, and lighting", depth: 1 },
  { id: "i3-2", parentId: "s3", orderIndex: 1, type: "item", text: "Living/Dining Areas: Inspect walls, ceilings, floors, and windows", depth: 1 },
  { id: "i3-3", parentId: "s3", orderIndex: 2, type: "item", text: "Kitchen: Check cabinets, countertops, sink, dishwasher, range/oven and venting", depth: 1 },
  { id: "i3-4", parentId: "s3", orderIndex: 3, type: "item", text: "Bathrooms: Check toilets, sinks, tubs/showers, ventilation, tile/grout, and drains", depth: 1 },
  { id: "i3-5", parentId: "s3", orderIndex: 4, type: "item", text: "Bedrooms: Inspect windows (egress), closets, floors, ceilings, and lighting", depth: 1 },
  { id: "i3-6", parentId: "s3", orderIndex: 5, type: "item", text: "Stairs & Railings: Inspect structural soundness and handrail security", depth: 1 },
  { id: "i3-7", parentId: "s3", orderIndex: 6, type: "item", text: "Interior Doors & Hardware: Ensure latches and locks operate correctly", depth: 1 },

  // Section 4: Systems
  { id: "s4", parentId: null, orderIndex: 3, type: "section", text: "Systems", depth: 0 },
  { id: "i4-1", parentId: "s4", orderIndex: 0, type: "item", text: "Electrical: Test outlets, GFCIs, switches, visible wiring, and main panel labeling", depth: 1 },
  { id: "i4-2", parentId: "s4", orderIndex: 1, type: "item", text: "Plumbing: Inspect visible supply and drain piping, fixtures, check for active leaks", depth: 1 },
  { id: "i4-3", parentId: "s4", orderIndex: 2, type: "item", text: "HVAC: Test heating/cooling operation, thermostat, filters, and look for leaks/noises", depth: 1 },
  { id: "i4-4", parentId: "s4", orderIndex: 3, type: "item", text: "Water Heater: Inspect tank condition, age, TPR valve, and signs of leakage", depth: 1 },
  { id: "i4-5", parentId: "s4", orderIndex: 4, type: "item", text: "Appliances: Test major appliances included with the property", depth: 1 },

  // Section 5: Attic / Insulation
  { id: "s5", parentId: null, orderIndex: 4, type: "section", text: "Attic / Insulation", depth: 0 },
  { id: "i5-1", parentId: "s5", orderIndex: 0, type: "item", text: "Attic Access: Confirm safe access and condition of hatch/stair", depth: 1 },
  { id: "i5-2", parentId: "s5", orderIndex: 1, type: "item", text: "Insulation & Ventilation: Check levels and ventilation; check for moisture or pest signs", depth: 1 },
  { id: "i5-3", parentId: "s5", orderIndex: 2, type: "item", text: "Roof Structure: Look for signs of leaks, rot, or structural damage", depth: 1 },

  // Section 6: Basement / Crawlspace
  { id: "s6", parentId: null, orderIndex: 5, type: "section", text: "Basement / Crawlspace", depth: 0 },
  { id: "i6-1", parentId: "s6", orderIndex: 0, type: "item", text: "Moisture & Sumps: Check for standing water and sump pump operation", depth: 1 },
  { id: "i6-2", parentId: "s6", orderIndex: 1, type: "item", text: "Foundation Walls: Inspect for cracks, efflorescence, and water staining", depth: 1 },
  { id: "i6-3", parentId: "s6", orderIndex: 2, type: "item", text: "Mechanical Equipment: Inspect boilers, furnaces or other equipment present", depth: 1 },

  // Section 7: Safety & Compliance
  { id: "s7", parentId: null, orderIndex: 6, type: "section", text: "Safety & Compliance", depth: 0 },
  { id: "i7-1", parentId: "s7", orderIndex: 0, type: "item", text: "Smoke Detectors: Present and functional", depth: 1 },
  { id: "i7-2", parentId: "s7", orderIndex: 1, type: "item", text: "CO Detectors: Present and functional", depth: 1 },
  { id: "i7-3", parentId: "s7", orderIndex: 2, type: "item", text: "Fire Extinguishers: Present and accessible where required", depth: 1 },
  { id: "i7-4", parentId: "s7", orderIndex: 3, type: "item", text: "Stair & Balcony Railings: Secure and safe", depth: 1 },
  { id: "i7-5", parentId: "s7", orderIndex: 4, type: "item", text: "Environmental Concerns: Note visible mold, asbestos, or lead-based paint", depth: 1 },

  // Section 8: Exterior Amenities
  { id: "s8", parentId: null, orderIndex: 7, type: "section", text: "Exterior Amenities", depth: 0 },
  { id: "i8-1", parentId: "s8", orderIndex: 0, type: "item", text: "Pool/Hot Tub: Condition, gates, covers, and safety features", depth: 1 },
  { id: "i8-2", parentId: "s8", orderIndex: 1, type: "item", text: "Outbuildings & Fences: Condition and access", depth: 1 },
  { id: "i8-3", parentId: "s8", orderIndex: 2, type: "item", text: "Driveway Gates / Entry Systems: Operation and security", depth: 1 },
];

export const MOCK_INSPECTION_CHECKLIST: PropertyInspectionChecklist = {
  propertyId: "1-woodland",
  title: "1 Woodland Inspection Checklist",
  nodes: MOCK_CHECKLIST_NODES,
  updatedAt: new Date().toISOString(),
  updatedBy: "Imported: 1 Woodland (mock)",
};
