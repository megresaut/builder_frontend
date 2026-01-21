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
  { id: "i1-1-3", parentId: "s1-1", orderIndex: 2, type: "item", text: "Check cobble stone around driveway/joints for deterioration.", depth: 2 },
  { id: "i1-1-4", parentId: "s1-1", orderIndex: 3, type: "item", text: "Check the front patio for broken stones or if joints need to be filled.", depth: 2 },
  { id: "i1-1-5", parentId: "s1-1", orderIndex: 4, type: "item", text: "Check stone on the bench for missing stones and gaps.", depth: 2 },
  { id: "i1-1-6", parentId: "s1-1", orderIndex: 5, type: "item", text: "Do patios/walkways need to be resealed.", depth: 2 },
  { id: "i1-1-7", parentId: "s1-1", orderIndex: 6, type: "item", text: "Any stone steps loose or dangerous?", depth: 2 },

  // Subsection: Landscape (depth 1)
  { id: "s1-2", parentId: "s1", orderIndex: 1, type: "section", text: "Landscape", depth: 1 },
  
  // Sub-subsection: Grass (depth 2)
  { id: "s1-2-1", parentId: "s1-2", orderIndex: 0, type: "section", text: "Grass", depth: 2 },
  { id: "i1-2-1-1", parentId: "s1-2-1", orderIndex: 0, type: "item", text: "Check for browning (need water or does it need to be treated for bugs?).", depth: 3 },
  { id: "i1-2-1-2", parentId: "s1-2-1", orderIndex: 1, type: "item", text: "Make sure the grass has been cut and not overgrown.", depth: 3 },

  // Sub-subsection: Trees/Planting (depth 2)
  { id: "s1-2-2", parentId: "s1-2", orderIndex: 1, type: "section", text: "Trees/Planting", depth: 2 },
  { id: "i1-2-2-1", parentId: "s1-2-2", orderIndex: 0, type: "item", text: "Check for dead or dead branches.", depth: 3 },
  { id: "i1-2-2-2", parentId: "s1-2-2", orderIndex: 1, type: "item", text: "Check for overgrown trees or obstructed plants.", depth: 3 },

  // Sub-subsection: Plant Beds/Mulch (depth 2)
  { id: "s1-2-3", parentId: "s1-2", orderIndex: 2, type: "section", text: "Plant Beds/Mulch", depth: 2 },
  { id: "i1-2-3-1", parentId: "s1-2-3", orderIndex: 0, type: "item", text: "Check for weeds.", depth: 3 },
  { id: "i1-2-3-2", parentId: "s1-2-3", orderIndex: 1, type: "item", text: "Make sure weekly cleanup is happening (leaves, branches etc.).", depth: 3 },

  // Sub-subsection: Perimeter/Decks (depth 2)
  { id: "s1-2-4", parentId: "s1-2", orderIndex: 3, type: "section", text: "Perimeter/Decks", depth: 2 },
  { id: "i1-2-4-1", parentId: "s1-2-4", orderIndex: 0, type: "item", text: "Check perimeter fence, fallen trees, damage, opening for animals.", depth: 3 },
  { id: "i1-2-4-2", parentId: "s1-2-4", orderIndex: 1, type: "item", text: "Check decks/patio (joints, broken stones).", depth: 3 },
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
  { id: "i1-3-2-2", parentId: "s1-3-2", orderIndex: 1, type: "item", text: "Check if it needs to be treated or sealed.", depth: 3 },
];

export const MOCK_INSPECTION_CHECKLIST: PropertyInspectionChecklist = {
  propertyId: "1-woodland",
  title: "1 Woodland Rd - Inspection Checklist",
  nodes: MOCK_CHECKLIST_NODES,
  updatedAt: new Date().toISOString(),
  updatedBy: "Property Manager: Chris Schenarts",
};
