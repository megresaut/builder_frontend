import React, { useState, useRef, useEffect } from "react";
import DOMPurify from "dompurify";
import mammoth from "mammoth";
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
import { createChecklist, parseChecklistDocx } from "@/api/inspections";
import type { BackendInspectionChecklist } from "@/api/inspections";
import { convertSectionsToNodes } from "@/utils/checklist-conversion";
import { toast } from "sonner";

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
  const [isParsing, setIsParsing] = useState(false);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [newlyAddedNodeId, setNewlyAddedNodeId] = useState<string | null>(null);
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
  const [docxHtml, setDocxHtml] = useState<string | null>(null);
  const [showDocxPreview, setShowDocxPreview] = useState(false);

  useEffect(() => {
    if (!open) {
      setTemplateName("");
      setNodes([]);
      setErrors({});
      setNewlyAddedNodeId(null);
      setFocusedNodeId(null);
      setIsSubmitting(false);
      setIsParsing(false);
      setDocxHtml(null);
      setShowDocxPreview(false);
    }
  }, [open]);

  const handleDocxUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset file input so the same file can be re-selected
    e.target.value = "";

    if (!file.name.toLowerCase().endsWith(".docx")) {
      toast.error("Please select a .docx file");
      return;
    }

    if (nodes.length > 0) {
      const confirmed = window.confirm(
        "Uploading a DOCX will replace the current checklist. Continue?"
      );
      if (!confirmed) return;
    }

    setIsParsing(true);
    try {
      // Run mammoth HTML conversion and backend parse in parallel
      const arrayBufferPromise = file.arrayBuffer().then((buffer) =>
        mammoth.convertToHtml({ arrayBuffer: buffer })
      );
      const parsePromise = parseChecklistDocx(file);

      const [mammothResult, result] = await Promise.all([
        arrayBufferPromise.catch((err) => {
          console.error("Mammoth conversion failed:", err);
          return null;
        }),
        parsePromise,
      ]);

      if (mammothResult?.value) {
        setDocxHtml(mammothResult.value);
        setShowDocxPreview(true);
      }

      const sections = result?.sections;
      if (!sections || !Array.isArray(sections) || sections.length === 0) {
        console.error("Unexpected parse response:", result);
        toast.error("Could not extract checklist from document.");
        return;
      }
      const parsed = convertSectionsToNodes(sections);
      setNodes(parsed);
      toast.success(
        `Parsed ${sections.length} section${sections.length !== 1 ? "s" : ""} from document`
      );
    } catch (err) {
      console.error("DOCX parse failed:", err);
      toast.error("Failed to parse document. Please try again.");
    } finally {
      setIsParsing(false);
    }
  };

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
      size={showDocxPreview ? "xl" : "lg"}
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
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">
              Inspection Checklist
            </h3>
            <div className="flex items-center gap-3">
              {docxHtml && !showDocxPreview && (
                <button
                  type="button"
                  onClick={() => setShowDocxPreview(true)}
                  className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Show preview
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".docx"
                onChange={handleDocxUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isParsing || isSubmitting}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="12" y1="18" x2="12" y2="12" />
                  <line x1="9" y1="15" x2="15" y2="15" />
                </svg>
                {isParsing ? "Parsing…" : "Upload DOCX"}
              </button>
            </div>
          </div>
          {isParsing && (
            <div className="flex items-center gap-2 py-3 px-4 bg-blue-50 rounded-md text-sm text-blue-700">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Parsing document with AI…
            </div>
          )}
          <div className={cn(
            showDocxPreview ? "grid grid-cols-2 gap-4" : "flex flex-col"
          )}>
            {/* Left column: DOCX preview */}
            {showDocxPreview && docxHtml && (
              <div className="flex flex-col border border-gray-200 rounded-md">
                <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 bg-gray-50 rounded-t-md">
                  <span className="text-xs font-medium text-gray-600">Original Document</span>
                  <button
                    type="button"
                    onClick={() => setShowDocxPreview(false)}
                    className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    Close preview
                  </button>
                </div>
                <div
                  className="max-h-[50vh] overflow-y-auto p-4 prose prose-sm prose-gray max-w-none [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-5 [&_ol]:pl-5 [&_li]:my-0.5 [&_p]:my-1 [&_h1]:text-lg [&_h2]:text-base [&_h3]:text-sm"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(docxHtml) }}
                />
              </div>
            )}

            {/* Right column (or single column): checklist editor */}
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
      </div>
    </ModalTemplate>
  );
}
