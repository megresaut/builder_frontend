import { useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { usePageState } from "@/hooks/usePageState";
import PageTemplate from "@/layout/PageTemplate";
import { EditIcon, DeleteIcon, ArrowBackIcon } from "@/components/icons";

interface UploadedPhoto {
  id: string;
  url: string;
  caption?: string;
  timestamp: string;
}

interface ChecklistItem {
  id: string;
  text: string;
  passed: boolean;
  failed: boolean;
  notes: string;
}

interface ChecklistSection {
  id: string;
  title: string;
  items: ChecklistItem[];
}

const mockChecklistTemplate: ChecklistSection[] = [
  {
    id: "section1",
    title: "Exterior",
    items: [
      { id: "item1", text: "Roof condition", passed: true, failed: false, notes: "Good condition" },
      { id: "item2", text: "Gutters and downspouts", passed: true, failed: false, notes: "" },
      { id: "item3", text: "Siding and trim", passed: false, failed: true, notes: "Needs repair on west side" },
    ],
  },
  {
    id: "section2",
    title: "Interior",
    items: [
      { id: "item4", text: "Walls and ceilings", passed: true, failed: false, notes: "" },
      { id: "item5", text: "Flooring", passed: true, failed: false, notes: "Recently refinished" },
    ],
  },
];

const mockPhotos: UploadedPhoto[] = [
  { id: "1", url: "", caption: "Roof damage", timestamp: "Oct 16, 2025 2:30 PM" },
  { id: "2", url: "", caption: "Gutter issue", timestamp: "Oct 16, 2025 2:35 PM" },
];

interface InspectionDetailProps {
  isNew?: boolean;
  isEdit?: boolean;
}

export default function InspectionDetail({ isNew = false, isEdit = false }: InspectionDetailProps) {
  const navigate = useNavigate();
  const { propertyId, inspectionId } = useParams();
  const [isDraft, setIsDraft] = usePageState("isDraft", isNew || isEdit);
  const [photos, setPhotos] = useState<UploadedPhoto[]>(mockPhotos);
  const [checklist, setChecklist] = useState<ChecklistSection[]>(mockChecklistTemplate);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["section1", "section2"]));
  const [selectedTemplate, setSelectedTemplate] = usePageState("selectedTemplate", "default");

  const handlePhotoDelete = useCallback((photoId: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
  }, []);

  const handlePhotoCaption = useCallback((photoId: string, caption: string) => {
    setPhotos((prev) =>
      prev.map((p) => (p.id === photoId ? { ...p, caption } : p))
    );
  }, []);

  const handleAddPhoto = useCallback(() => {
    const newPhoto: UploadedPhoto = {
      id: Date.now().toString(),
      url: "",
      caption: "",
      timestamp: new Date().toLocaleString(),
    };
    setPhotos((prev) => [...prev, newPhoto]);
  }, []);

  const handleItemToggle = useCallback((sectionId: string, itemId: string, field: "passed" | "failed") => {
    setChecklist((prev) =>
      prev.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              items: section.items.map((item) =>
                item.id === itemId
                  ? {
                      ...item,
                      [field]: !item[field],
                      ...(field === "passed" && { failed: false }),
                      ...(field === "failed" && { passed: false }),
                    }
                  : item
              ),
            }
          : section
      )
    );
  }, []);

  const handleItemNotes = useCallback((sectionId: string, itemId: string, notes: string) => {
    setChecklist((prev) =>
      prev.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              items: section.items.map((item) =>
                item.id === itemId ? { ...item, notes } : item
              ),
            }
          : section
      )
    );
  }, []);

  const toggleSection = useCallback((sectionId: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  }, []);

  const handleSaveDraft = useCallback(() => {
    setIsDraft(true);
    console.log("Inspection saved as draft");
  }, [setIsDraft]);

  const handleMarkReviewed = useCallback(() => {
    console.log("Inspection marked as reviewed");
  }, []);

  const handleApprove = useCallback(() => {
    console.log("Inspection approved");
  }, []);

  return (
    <PageTemplate>
      <div className="flex flex-col h-screen bg-white">
        {/* Header */}
        <div className="border-b border-[#DADADA] px-6 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowBackIcon width={20} height={20} />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              {isNew ? "New Inspection" : "Quarterly Building Inspection"}
            </h1>
            <p className="text-sm text-gray-600">
              {isNew ? "Create a new inspection record" : "Oct 15, 2025 • Submitted by John Doe"}
            </p>
          </div>
        </div>

        {/* Main Content - 3 Section Layout */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Panel - Photos (Fixed) */}
          <div className="flex-shrink-0 w-full lg:w-[380px] xl:w-[450px] border-r border-[#DADADA] overflow-y-auto bg-gray-50">
            <div className="p-6 space-y-4">
              <div>
                <h2 className="text-base font-semibold text-gray-900 mb-4">Inspection Photos</h2>
                <button
                  onClick={handleAddPhoto}
                  className="w-full px-4 py-2 border border-[#DADADA] rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  + Add Photos
                </button>
              </div>

              {/* Photo List */}
              <div className="space-y-3">
                {photos.map((photo) => (
                  <div key={photo.id} className="bg-white rounded-lg border border-[#DADADA] p-3">
                    <div className="flex items-start gap-2 mb-2">
                      <div className="w-12 h-12 bg-gray-200 rounded border border-[#DADADA] flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <input
                          type="text"
                          value={photo.caption || ""}
                          onChange={(e) => handlePhotoCaption(photo.id, e.target.value)}
                          placeholder="Photo caption"
                          className="w-full text-sm px-2 py-1 border border-[#DADADA] rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">{photo.timestamp}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handlePhotoDelete(photo.id)}
                      className="w-full text-xs text-red-600 hover:text-red-700 py-1 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel - Checklist (Scrollable) */}
          <div className="flex-1 overflow-auto">
            <div className="p-6 max-w-4xl">
              {/* Submission Info */}
              <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Submitted by</p>
                    <p className="font-medium text-gray-900">John Doe</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Submitted</p>
                    <p className="font-medium text-gray-900">Oct 16, 2025</p>
                  </div>
                </div>
              </div>

              {/* Template Selector */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Checklist Template
                </label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  className="w-full px-3 py-2 border border-[#DADADA] rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                >
                  <option value="default">Default Template</option>
                  <option value="hvac">HVAC Inspection</option>
                  <option value="plumbing">Plumbing Inspection</option>
                </select>
              </div>

              {/* Checklist Sections */}
              <div className="space-y-4">
                <h2 className="text-base font-semibold text-gray-900">Checklist</h2>
                {checklist.map((section) => (
                  <div key={section.id} className="border border-[#DADADA] rounded-lg overflow-hidden">
                    {/* Section Header */}
                    <button
                      onClick={() => toggleSection(section.id)}
                      className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition-colors border-b border-[#DADADA]"
                    >
                      <span className="font-medium text-gray-900">{section.title}</span>
                      <span className="text-gray-500">
                        {expandedSections.has(section.id) ? "▼" : "▶"}
                      </span>
                    </button>

                    {/* Section Items */}
                    {expandedSections.has(section.id) && (
                      <div className="divide-y divide-[#DADADA]">
                        {section.items.map((item) => (
                          <div key={item.id} className="p-4 space-y-3">
                            <div className="flex items-start gap-3">
                              <div className="flex items-center gap-2 mt-0.5">
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={item.passed}
                                    onChange={() => handleItemToggle(section.id, item.id, "passed")}
                                    className="w-4 h-4 rounded border-[#DADADA]"
                                  />
                                  <span className="text-sm text-green-600 font-medium">Pass</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={item.failed}
                                    onChange={() => handleItemToggle(section.id, item.id, "failed")}
                                    className="w-4 h-4 rounded border-[#DADADA]"
                                  />
                                  <span className="text-sm text-red-600 font-medium">Fail</span>
                                </label>
                              </div>
                              <span className="flex-1 text-gray-900 font-medium">{item.text}</span>
                            </div>
                            <textarea
                              value={item.notes}
                              onChange={(e) => handleItemNotes(section.id, item.id, e.target.value)}
                              placeholder="Add notes..."
                              className="w-full px-3 py-2 text-sm border border-[#DADADA] rounded focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                              rows={2}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="border-t border-[#DADADA] bg-white px-6 py-4 flex justify-end gap-3">
          <button
            onClick={handleSaveDraft}
            className="px-4 py-2 border border-[#DADADA] rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Save Draft
          </button>
          <button
            onClick={handleMarkReviewed}
            className="px-4 py-2 border border-blue-500 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors"
          >
            Mark as Reviewed
          </button>
          <button
            onClick={handleApprove}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Approve
          </button>
        </div>
      </div>
    </PageTemplate>
  );
}
