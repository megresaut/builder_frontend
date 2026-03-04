import type { ChecklistNode } from "@/data/inspection-checklist";
import type { ChecklistSectionTemplate } from "@/data/inspections";
import type { BackendInspectionChecklist } from "@/api/inspections";

/**
 * Convert backend checklist JSON (hierarchical sections/items) into a flat
 * ChecklistNode[] array used by the frontend checklist editor.
 *
 * Shared between InspectionDetail, FtoInspectionForm, and AddTemplateModal.
 */
export function convertBackendChecklistToNodes(
  backendChecklist: BackendInspectionChecklist | null
): ChecklistNode[] {
  if (!backendChecklist || !backendChecklist.checklist_json) {
    return [];
  }

  const checklistData = backendChecklist.checklist_json;
  const sections: ChecklistSectionTemplate[] = checklistData.sections || [];

  const nodes: ChecklistNode[] = [];
  let nodeIndex = 0;

  const addItemsRecursively = (
    items: any[],
    parentId: string,
    depth: number
  ) => {
    items?.forEach((item) => {
      const itemNode: ChecklistNode = {
        id: item.id,
        parentId: parentId,
        orderIndex: nodeIndex++,
        type: depth === 0 ? "section" : "item",
        text: item.text,
        depth: depth,
      };
      nodes.push(itemNode);

      if (item.items && item.items.length > 0) {
        addItemsRecursively(item.items, item.id, depth + 1);
      }
    });
  };

  sections.forEach((section) => {
    const sectionNode: ChecklistNode = {
      id: section.id,
      parentId: null,
      orderIndex: nodeIndex++,
      type: "section",
      text: section.title,
      depth: 0,
    };
    nodes.push(sectionNode);

    if (section.items && section.items.length > 0) {
      addItemsRecursively(section.items, section.id, 1);
    }
  });

  return nodes;
}

/**
 * Convert parsed checklist sections (from AI parse response) into
 * ChecklistNode[] for the editor. Unlike the above, this takes raw sections
 * rather than a full BackendInspectionChecklist.
 */
export function convertSectionsToNodes(
  sections: ChecklistSectionTemplate[]
): ChecklistNode[] {
  return convertBackendChecklistToNodes({
    checklist_json: { sections },
  } as BackendInspectionChecklist);
}
