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
  { id: "i1-1", parentId: "s1", orderIndex: 0, type: "item", text: "Roof condition: Inspect shingles, flashings, and gutters", depth: 1 },
  { id: "i1-2", parentId: "s1", orderIndex: 1, type: "item", text: "Siding and Trim: Check for rot, damage, or peeling paint", depth: 1 },
  { id: "i1-3", parentId: "s1", orderIndex: 2, type: "item", text: "Foundation: Look for cracks or water intrusion signs", depth: 1 },
  
  // Section 2: Interior
  { id: "s2", parentId: null, orderIndex: 1, type: "section", text: "Interior", depth: 0 },
  { id: "i2-1", parentId: "s2", orderIndex: 0, type: "item", text: "Walls and Ceilings: Check for stains, cracks, or holes", depth: 1 },
  { id: "i2-2", parentId: "s2", orderIndex: 1, type: "item", text: "Flooring: Inspect condition of carpet, tile, and hardwood", depth: 1 },
  { id: "i2-3", parentId: "s2", orderIndex: 2, type: "item", text: "Windows and Doors: Ensure proper operation and locking", depth: 1 },

  // Section 3: Systems
  { id: "s3", parentId: null, orderIndex: 2, type: "section", text: "Systems", depth: 0 },
  { id: "i3-1", parentId: "s3", orderIndex: 0, type: "item", text: "HVAC: Test heating and cooling operation", depth: 1 },
  { id: "i3-2", parentId: "s3", orderIndex: 1, type: "item", text: "Plumbing: Check faucets, toilets, and drains for leaks", depth: 1 },
  { id: "i3-3", parentId: "s3", orderIndex: 2, type: "item", text: "Electrical: Test outlets and switches", depth: 1 },
];

export const MOCK_INSPECTION_CHECKLIST: PropertyInspectionChecklist = {
  propertyId: "prop-123",
  title: "Home Inspection Checklist",
  nodes: MOCK_CHECKLIST_NODES,
  updatedAt: new Date().toISOString(),
  updatedBy: "Admin",
};
