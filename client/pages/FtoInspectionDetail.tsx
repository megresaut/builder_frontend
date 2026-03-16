import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageTemplate from "@/layout/PageTemplate";
import BlueButton from "@/components/BlueButton";
import { ChevronLeft, Play, RotateCcw, CheckCircle2, Clock, FileText } from "lucide-react";
import { API_BASE } from "@/api/fetchJSON";
import {
  BackendInspectionFull,
  getInspectionFull,
} from "@/api/inspections";
import { ChecklistNode } from "@/data/inspection-checklist";

const convertBackendChecklistToNodes = (
  backendChecklist: any
): ChecklistNode[] => {
  if (!backendChecklist || !backendChecklist.checklist_json) return [];

  const sections = backendChecklist.checklist_json.sections || [];
  const nodes: ChecklistNode[] = [];
  let nodeIndex = 0;

  const addItemsRecursively = (items: any[], parentId: string, depth: number) => {
    items?.forEach((item) => {
      nodes.push({
        id: item.id,
        parentId,
        orderIndex: nodeIndex++,
        type: depth === 0 ? "section" : "item",
        text: item.text,
        depth,
      });
      if (item.items?.length > 0) {
        addItemsRecursively(item.items, item.id, depth + 1);
      }
    });
  };

  sections.forEach((section: any) => {
    nodes.push({
      id: section.id,
      parentId: null,
      orderIndex: nodeIndex++,
      type: "section",
      text: section.title,
      depth: 0,
    });
    if (section.items?.length > 0) {
      addItemsRecursively(section.items, section.id, 1);
    }
  });

  return nodes;
};

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  draft: { label: "Draft", color: "text-gray-700", bg: "bg-gray-100", icon: <FileText className="w-4 h-4" /> },
  in_progress: { label: "In Progress", color: "text-blue-700", bg: "bg-blue-100", icon: <Clock className="w-4 h-4" /> },
  submitted: { label: "Submitted", color: "text-green-700", bg: "bg-green-100", icon: <CheckCircle2 className="w-4 h-4" /> },
  reviewed: { label: "Reviewed", color: "text-green-700", bg: "bg-green-100", icon: <CheckCircle2 className="w-4 h-4" /> },
};

export default function FtoInspectionDetail() {
  const navigate = useNavigate();
  const { inspectionId } = useParams<{ inspectionId: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inspection, setInspection] = useState<BackendInspectionFull | null>(null);
  const [checklist, setChecklist] = useState<ChecklistNode[]>([]);

  useEffect(() => {
    if (!inspectionId) return;
    const load = async () => {
      try {
        setLoading(true);
        const data = await getInspectionFull(Number(inspectionId));
        setInspection(data);
        if (data.checklist) {
          setChecklist(convertBackendChecklistToNodes(data.checklist));
        }
      } catch (err) {
        console.error("Failed to load inspection:", err);
        setError("Failed to load inspection");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [inspectionId]);

  const isLeafNode = (node: ChecklistNode): boolean => {
    return !checklist.some((n) => n.parentId === node.id);
  };
  const hasLeafChild = (node: ChecklistNode): boolean => {
    return checklist.filter((n) => n.parentId === node.id).some((c) => isLeafNode(c));
  };
  const shouldShowCameraIcon = (node: ChecklistNode): boolean => {
    if (node.depth === 0) return false;
    return isLeafNode(node) || hasLeafChild(node);
  };

  const totalItems = useMemo(
    () => checklist.filter((n) => shouldShowCameraIcon(n)).length,
    [checklist]
  );

  const photoNodeIds = useMemo(() => {
    if (!inspection?.photos) return new Set<string>();
    return new Set(inspection.photos.map((p) => p.section_id));
  }, [inspection?.photos]);

  const completedItems = useMemo(() => {
    return checklist.filter((n) => shouldShowCameraIcon(n) && photoNodeIds.has(n.id)).length;
  }, [checklist, photoNodeIds]);

  const status = inspection?.inspection?.status || "draft";
  const sc = statusConfig[status] || statusConfig.draft;
  const isEditable = status === "draft" || status === "in_progress";
  const progressPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  if (loading) {
    return (
      <PageTemplate className="!px-4 !pt-6 !pb-24 max-w-none !min-w-0 lg:!px-6 lg:!py-9">
        <div className="flex items-center justify-center py-20 text-gray-500 text-sm">
          Loading inspection...
        </div>
      </PageTemplate>
    );
  }

  if (error || !inspection) {
    return (
      <PageTemplate className="!px-4 !pt-6 !pb-24 max-w-none !min-w-0 lg:!px-6 lg:!py-9">
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <p className="text-red-500 text-sm">{error || "Inspection not found"}</p>
          <button
            onClick={() => navigate("/fto/inspections")}
            className="text-sm text-blue-600 hover:underline"
          >
            Back to inspections
          </button>
        </div>
      </PageTemplate>
    );
  }

  const { inspection: insp, checklist: checklistData } = inspection;
  const dueDate = insp.due_date
    ? new Date(insp.due_date).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "No date set";

  return (
    <PageTemplate className="!px-4 !pt-6 !pb-24 max-w-none !min-w-0 lg:!px-6 lg:!py-9">
      <div className="flex flex-col items-center w-full">
        <div className="w-full lg:max-w-[600px] flex flex-col gap-6">
          {/* Back button */}
          <button
            onClick={() => navigate("/fto/inspections")}
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors w-fit"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Inspections
          </button>

          {/* Main Card */}
          <div className="rounded-xl bg-white border border-[#E5E5E5] shadow-[0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <h1 className="text-xl font-semibold text-gray-900">
                    {insp.property_name || `Property ${insp.property_id}`}
                  </h1>
                  {checklistData && (
                    <p className="text-sm text-gray-500">{checklistData.name}</p>
                  )}
                </div>
                <div
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${sc.color} ${sc.bg}`}
                >
                  {sc.icon}
                  {sc.label}
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="p-6 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
                    Due Date
                  </p>
                  <p className="text-sm text-gray-900 mt-0.5">{dueDate}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
                    Unit
                  </p>
                  <p className="text-sm text-gray-900 mt-0.5">
                    {insp.unit_id ? `Unit ${insp.unit_id}` : "Property Level"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
                    Photos
                  </p>
                  <p className="text-sm text-gray-900 mt-0.5">
                    {inspection.photos?.length || 0} uploaded
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
                    Checklist Items
                  </p>
                  <p className="text-sm text-gray-900 mt-0.5">{totalItems} items</p>
                </div>
              </div>

              {/* Progress */}
              {totalItems > 0 && (
                <div className="flex flex-col gap-2 mt-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-medium text-gray-900">
                      {completedItems}/{totalItems} items ({progressPercent}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Action */}
            {isEditable && (
              <div className="p-6 border-t border-gray-100 bg-gray-50">
                <button
                  onClick={() => navigate(`/fto/inspections/${inspectionId}/run`)}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#013764] text-white rounded-lg text-sm font-medium hover:bg-[#012a4e] transition-colors"
                >
                  {completedItems > 0 ? (
                    <>
                      <RotateCcw className="w-4 h-4" />
                      Continue Inspection
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Start Inspection
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Read-only submitted view */}
            {!isEditable && (
              <div className="p-6 border-t border-gray-100 bg-gray-50">
                <button
                  onClick={() => navigate(`/fto/inspections/${inspectionId}/run`)}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 bg-white rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  View Inspection
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageTemplate>
  );
}
