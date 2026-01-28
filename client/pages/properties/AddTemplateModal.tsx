import React, { useState, useRef, useEffect } from "react";
import { ModalTemplate, ModalButtons } from "@/components/ui/ModalTemplate";
import { TextField } from "@/components/forms/TextField";
import {
  PlusIcon,
  DeleteIcon,
  ArrowBackIcon,
  ArrowForwardIcon,
} from "@/components/icons";
import { ChecklistNode } from "@/data/inspection-checklist";
import { ChecklistSectionTemplate } from "@/data/inspections";
import { cn } from "@/lib/utils";
import { createChecklist } from "@/api/inspections";
import type { BackendInspectionChecklist } from "@/api/inspections";

export function convertNodesToBackendChecklist(
  nodes: ChecklistNode[]
): { sections: ChecklistSectionTemplate[] } {
  const sections: ChecklistSectionTemplate[] = [];

  const buildItemsForParent = (parentId: string): any[] => {
    const childNodes = nodes.filter((n) => n.parentId === parentId);
    return childNodes.map((childNode) => {
      const item: any = {
        id: childNode.id,
        text: childNode.text,
      };
      const nestedItems = buildItemsForParent(childNode.id);
      if (nestedItems.length > 0) {
        item.items = nestedItems;
      }
      return item;
    });
  };

  const sectionNodes = nodes.filter((n) => n.type === "section" && n.depth === 0);
  sectionNodes.forEach((sectionNode) => {
    const section: ChecklistSectionTemplate = {
      id: sectionNode.id,
      title: sectionNode.text,
      items: buildItemsForParent(sectionNode.id),
    };
    sections.push(section);
  });

  return { sections };
}

interface AddTemplateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: number;
  userId: number;
  onConfirm?: (checklist: BackendInspectionChecklist) => void;
}

export default function AddTemplateModal({
  open,
  onOpenChange,
  propertyId,
  userId,
  onConfirm,
}: AddTemplateModalProps) {
  const [templateName, setTemplateName] = useState("");
  const [nodes, setNodes] = useState<ChecklistNode[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [newlyAddedNodeId, setNewlyAddedNodeId] = useState<string | null>(null);
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setTemplateName("");
      setNodes([]);
      setErrors({});
      setNewlyAddedNodeId(null);
      setFocusedNodeId(null);
      setIsSubmitting(false);
    }
  }, [open]);

  const handleTextChange = (id: string, newText: string) => {
    setNodes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, text: newText } : n))
    );
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    nodeId: string,
    index: number
  ) => {
    if (e.key === "ArrowUp" && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      if (index > 0) {
        handleMove(index, "up");
        setTimeout(() => {
          const input = inputRefs.current[nodeId];
          if (input) {
            input.focus();
            const length = input.value.length;
            input.setSelectionRange(length, length);
          }
        }, 0);
      }
      return;
    }

    if (e.key === "ArrowDown" && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      if (index < nodes.length - 1) {
        handleMove(index, "down");
        setTimeout(() => {
          const input = inputRefs.current[nodeId];
          if (input) {
            input.focus();
            const length = input.value.length;
            input.setSelectionRange(length, length);
          }
        }, 0);
      }
      return;
    }

    if (e.key === "Tab") {
      e.preventDefault();
      const node = nodes[index];
      if (e.shiftKey) {
        if (node.depth > 0) handleIndent(nodeId, "out");
      } else {
        handleIndent(nodeId, "in");
      }
      setTimeout(() => {
        const input = inputRefs.current[nodeId];
        if (input) {
          input.focus();
          const length = input.value.length;
          input.setSelectionRange(length, length);
        }
      }, 0);
      return;
    }

    if (e.key === "ArrowRight" && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
      const input = e.currentTarget;
      if (input.selectionStart === 0 && input.value.length === 0) {
        e.preventDefault();
        handleIndent(nodeId, "in");
        setTimeout(() => {
          const focusedInput = inputRefs.current[nodeId];
          if (focusedInput) focusedInput.focus();
        }, 0);
        return;
      }
    }

    if (e.key === "ArrowLeft" && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
      const input = e.currentTarget;
      if (input.selectionStart === 0 && input.value.length === 0) {
        e.preventDefault();
        if (nodes[index].depth > 0) handleIndent(nodeId, "out");
        setTimeout(() => {
          const focusedInput = inputRefs.current[nodeId];
          if (focusedInput) focusedInput.focus();
        }, 0);
        return;
      }
    }

    if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      const currentNode = nodes[index];
      const newNodeId = `node-${Date.now()}`;
      const newNode: ChecklistNode = {
        id: newNodeId,
        parentId: currentNode.parentId,
        orderIndex: 0,
        type: currentNode.depth === 0 ? "section" : "item",
        text: "",
        depth: currentNode.depth,
      };
      setNodes((prev) => {
        const newNodes = [...prev];
        newNodes.splice(index + 1, 0, newNode);
        return newNodes;
      });
      setNewlyAddedNodeId(newNodeId);
      setTimeout(() => {
        const input = inputRefs.current[newNodeId];
        if (input) {
          input.focus();
          input.select();
        }
      }, 0);
      return;
    }

    // Backspace on empty line: delete line and move focus to previous
    if (e.key === "Backspace" && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
      const input = e.currentTarget;
      if (input.value.length === 0 && index > 0) {
        e.preventDefault();
        const prevNodeId = nodes[index - 1].id;
        setNodes((prev) => prev.filter((n) => n.id !== nodeId));
        setTimeout(() => {
          const prevInput = inputRefs.current[prevNodeId];
          if (prevInput) {
            prevInput.focus();
            const len = prevInput.value.length;
            prevInput.setSelectionRange(len, len);
          }
        }, 0);
        return;
      }
    }
  };

  const handleIndent = (id: string, direction: "in" | "out") => {
    setNodes((prev) => {
      const currentIndex = prev.findIndex((n) => n.id === id);
      if (currentIndex === -1) return prev;
      const currentNode = prev[currentIndex];
      const newDepth =
        direction === "in"
          ? currentNode.depth + 1
          : Math.max(0, currentNode.depth - 1);
      const newType = newDepth === 0 ? "section" : "item";
      let newParentId: string | null = null;
      if (direction === "in") {
        for (let i = currentIndex - 1; i >= 0; i--) {
          if (prev[i].depth === currentNode.depth) {
            newParentId = prev[i].id;
            break;
          }
        }
      } else {
        if (currentNode.parentId) {
          const parent = prev.find((n) => n.id === currentNode.parentId);
          newParentId = parent?.parentId || null;
        }
      }
      return prev.map((n) => {
        if (n.id !== id) return n;
        return { ...n, depth: newDepth, type: newType, parentId: newParentId };
      });
    });
  };

  const handleMove = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === nodes.length - 1) return;
    setNodes((prev) => {
      const newNodes = [...prev];
      const swapIndex = direction === "up" ? index - 1 : index + 1;
      [newNodes[index], newNodes[swapIndex]] = [
        newNodes[swapIndex],
        newNodes[index],
      ];
      return newNodes;
    });
  };

  const handleDeleteNode = (id: string) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      setNodes((prev) => prev.filter((n) => n.id !== id));
    }
  };

  const handleAddNode = (index: number) => {
    const currentNode = nodes[index];
    const newNodeId = `node-${Date.now()}`;
    const newNode: ChecklistNode = {
      id: newNodeId,
      parentId: currentNode?.parentId ?? null,
      orderIndex: 0,
      type: (currentNode?.type as "section" | "item") ?? "section",
      text: "",
      depth: currentNode?.depth ?? 0,
    };
    const newNodes = [...nodes];
    newNodes.splice(index + 1, 0, newNode);
    setNodes(newNodes);
    setNewlyAddedNodeId(newNodeId);
    setTimeout(() => {
      const input = inputRefs.current[newNodeId];
      if (input) {
        input.focus();
        input.select();
      }
    }, 0);
  };

  const handleAddNodeToEnd = () => {
    if (nodes.length === 0) {
      const newNodeId = `node-${Date.now()}`;
      const newNode: ChecklistNode = {
        id: newNodeId,
        parentId: null,
        orderIndex: 0,
        type: "section",
        text: "",
        depth: 0,
      };
      setNodes([newNode]);
      setNewlyAddedNodeId(newNodeId);
      setTimeout(() => {
        const input = inputRefs.current[newNodeId];
        if (input) {
          input.focus();
          input.select();
        }
      }, 0);
      return;
    }
    handleAddNode(nodes.length - 1);
  };

  const handleConfirm = async () => {
    const newErrors: Record<string, string> = {};
    if (!templateName.trim()) {
      newErrors.templateName = "Please enter a template name";
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    try {
      setIsSubmitting(true);
      const checklistJson = convertNodesToBackendChecklist(nodes);
      const created = await createChecklist({
        property_id: propertyId,
        name: templateName.trim(),
        checklist_json: checklistJson,
        created_by_type: "user",
        created_by_id: userId,
        is_active: true,
      });
      onConfirm?.(created);
      onOpenChange(false);
    } catch (err) {
      console.error("Failed to create template:", err);
      alert("Failed to create template. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalTemplate
      open={open}
      onOpenChange={onOpenChange}
      title="Add Template"
      size="lg"
      footer={
        <ModalButtons
          cancelLabel="Cancel"
          confirmLabel={isSubmitting ? "Creating…" : "Create Template"}
          confirmDisabled={isSubmitting}
          cancelDisabled={isSubmitting}
          onCancel={() => onOpenChange(false)}
          onConfirm={handleConfirm}
        />
      }
    >
      <div className="flex flex-col gap-6">
        <TextField
          label="Template Name"
          value={templateName}
          onChange={(e) => {
            setTemplateName(e.target.value);
            setErrors((prev) => {
              const next = { ...prev };
              delete next.templateName;
              return next;
            });
          }}
          placeholder="e.g. Quarterly Inspection"
          error={errors.templateName}
        />

        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-semibold text-gray-900">
            Inspection Checklist
          </h3>
          <div className="flex flex-col gap-1 max-h-[50vh] overflow-y-auto pr-2">
            {nodes.length === 0 && (
              <div className="text-center py-6 text-gray-500 text-sm">
                No items yet. Click &quot;Add Item to End&quot; below to start.
              </div>
            )}
            {nodes.map((node, index) => {
              const isFocused = focusedNodeId === node.id;
              return (
              <div
                key={node.id}
                className={cn(
                  "group flex items-start gap-2 py-2 px-2 rounded-md transition-colors",
                  "border",
                  isFocused
                    ? "bg-gray-100 border-gray-300"
                    : "border-transparent hover:bg-gray-50 hover:border-gray-200"
                )}
                style={{ marginLeft: `${node.depth * 24}px` }}
              >
                <div className="mt-1 flex-shrink-0">
                  {node.depth === 0 ? (
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-900 mt-1.5" />
                  ) : (
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-1.5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <input
                    ref={(el) => {
                      inputRefs.current[node.id] = el;
                      if (newlyAddedNodeId === node.id && el) {
                        el.focus();
                        el.select();
                        setNewlyAddedNodeId(null);
                      }
                    }}
                    type="text"
                    value={node.text}
                    onChange={(e) =>
                      handleTextChange(node.id, e.target.value)
                    }
                    onKeyDown={(e) => handleKeyDown(e, node.id, index)}
                    onFocus={() => setFocusedNodeId(node.id)}
                    onBlur={() => setFocusedNodeId(null)}
                    className={cn(
                      "w-full bg-transparent border-none p-0 focus:ring-0 text-sm outline-none",
                      node.depth === 0
                        ? "font-bold text-gray-900"
                        : "text-gray-700"
                    )}
                    placeholder={
                      node.depth === 0 ? "Section Title" : "Checklist Item"
                    }
                  />
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleMove(index, "up")}
                    disabled={index === 0}
                    className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"
                    title="Move Up"
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 19V5" />
                      <path d="M5 12l7-7 7 7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleMove(index, "down")}
                    disabled={index === nodes.length - 1}
                    className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"
                    title="Move Down"
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 5v14" />
                      <path d="M19 12l-7 7-7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleIndent(node.id, "out")}
                    disabled={node.depth === 0}
                    className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"
                    title="Outdent"
                  >
                    <ArrowBackIcon width={12} height={12} />
                  </button>
                  <button
                    onClick={() => handleIndent(node.id, "in")}
                    className="p-1 text-gray-400 hover:text-gray-700"
                    title="Indent"
                  >
                    <ArrowForwardIcon width={12} height={12} />
                  </button>
                  <button
                    onClick={() => handleAddNode(index)}
                    className="p-1 text-blue-500 hover:text-blue-700"
                    title="Add Item Below"
                  >
                    <PlusIcon width={12} height={12} />
                  </button>
                  <button
                    onClick={() => handleDeleteNode(node.id)}
                    className="p-1 text-red-400 hover:text-red-600"
                    title="Delete"
                  >
                    <DeleteIcon width={12} height={12} />
                  </button>
                </div>
              </div>
            );
            })}
            <div className="mt-4 pt-4 border-t border-dashed border-gray-200">
              <button
                onClick={handleAddNodeToEnd}
                className="text-sm text-blue-600 font-medium hover:underline flex items-center gap-1 transition-colors hover:text-blue-700"
              >
                <PlusIcon width={14} height={14} /> Add Item to End
              </button>
            </div>
          </div>
        </div>
      </div>
    </ModalTemplate>
  );
}
