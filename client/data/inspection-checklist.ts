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
  
  // Driveway/Masonry subsection items
  { id: "i1-1", parentId: "s1", orderIndex: 0, type: "item", text: "Driveway/Masonry: Driveway – check for cracks, settling and sealing if needed", depth: 1 },
  { id: "i1-2", parentId: "s1", orderIndex: 1, type: "item", text: "Driveway/Masonry: Check all drains/catch basins (should be cleaned 1-2 years)", depth: 1 },
  { id: "i1-3", parentId: "s1", orderIndex: 2, type: "item", text: "Driveway/Masonry: Check cobble stone around driveway/joints for deterioration", depth: 1 },
  { id: "i1-4", parentId: "s1", orderIndex: 3, type: "item", text: "Driveway/Masonry: Check the front patio for broken stones or if joints need to be filled", depth: 1 },
  { id: "i1-5", parentId: "s1", orderIndex: 4, type: "item", text: "Driveway/Masonry: Check stone on the bench for missing stones and gaps", depth: 1 },
  { id: "i1-6", parentId: "s1", orderIndex: 5, type: "item", text: "Driveway/Masonry: Verify patios/walkways condition and if they need to be resealed", depth: 1 },
  { id: "i1-7", parentId: "s1", orderIndex: 6, type: "item", text: "Driveway/Masonry: Check if any stone steps are loose or dangerous", depth: 1 },
  
  // Landscape subsection items
  { id: "i1-8", parentId: "s1", orderIndex: 7, type: "item", text: "Landscape - Grass: Check for browning (need water or does it need to be treated for bugs?)", depth: 1 },
  { id: "i1-9", parentId: "s1", orderIndex: 8, type: "item", text: "Landscape - Grass: Make sure the grass has been cut and not overgrown", depth: 1 },
  { id: "i1-10", parentId: "s1", orderIndex: 9, type: "item", text: "Landscape - Trees/Planting: Check for dead or dead branches", depth: 1 },
  { id: "i1-11", parentId: "s1", orderIndex: 10, type: "item", text: "Landscape - Trees/Planting: Check for overgrown trees or obstructed plants", depth: 1 },
  { id: "i1-12", parentId: "s1", orderIndex: 11, type: "item", text: "Landscape - Plant Beds/Mulch: Check for weeds", depth: 1 },
  { id: "i1-13", parentId: "s1", orderIndex: 12, type: "item", text: "Landscape - Plant Beds/Mulch: Make sure weekly cleanup is happening (leaves, branches, etc.)", depth: 1 },
  { id: "i1-14", parentId: "s1", orderIndex: 13, type: "item", text: "Landscape - Fencing: Check perimeter fence, fallen trees, damage, and openings for animals", depth: 1 },
  { id: "i1-15", parentId: "s1", orderIndex: 14, type: "item", text: "Landscape - Decks/Patio: Check for loose boards, cracking, and if treatment is needed", depth: 1 },
  
  // Main house subsection items
  { id: "i1-16", parentId: "s1", orderIndex: 15, type: "item", text: "Main House - Trim/Stucco: Check for rotting wood", depth: 1 },
  { id: "i1-17", parentId: "s1", orderIndex: 16, type: "item", text: "Main House - Trim/Stucco: Paint if needed", depth: 1 },
  { id: "i1-18", parentId: "s1", orderIndex: 17, type: "item", text: "Main House - Trim/Stucco: Check for cracking and missing pieces", depth: 1 },
  { id: "i1-19", parentId: "s1", orderIndex: 18, type: "item", text: "Main House - Trim/Stucco: Verify stucco repair needs", depth: 1 },
  { id: "i1-20", parentId: "s1", orderIndex: 19, type: "item", text: "Main House - Roof: Check for cracking or missing shingles", depth: 1 },
  { id: "i1-21", parentId: "s1", orderIndex: 20, type: "item", text: "Main House - Roof: Check if it needs to be treated or sealed", depth: 1 },
];

export const MOCK_INSPECTION_CHECKLIST: PropertyInspectionChecklist = {
  propertyId: "1-woodland",
  title: "1 Woodland Rd - Inspection Checklist",
  nodes: MOCK_CHECKLIST_NODES,
  updatedAt: new Date().toISOString(),
  updatedBy: "Property Manager: Chris Schenarts",
};
