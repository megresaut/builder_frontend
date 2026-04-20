import { useMemo, useState } from "react";
import { Dialog, DialogTitle } from "@/components/ui/dialog";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/button";
import BlueButton from "@/components/BlueButton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/auth/useAuth";
import { getCapturedLogs } from "@/lib/consoleCapture";
import {
  BUG_MODULES,
  BUG_SEVERITIES,
  createBug,
  type BugModule,
  type BugSeverity,
  type BugReport,
} from "@/data/bugs";
import { toast } from "sonner";

interface ReportBugModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with the persisted bug after a successful submit. */
  onCreated?: (bug: BugReport) => void;
}

export default function ReportBugModal({ open, onOpenChange, onCreated }: ReportBugModalProps) {
  const { role } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [module, setModule] = useState<BugModule>("Other");
  const [severity, setSeverity] = useState<BugSeverity>("medium");
  const [files, setFiles] = useState<File[]>([]);
  const [showTechnical, setShowTechnical] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const technicalContext = useMemo(() => {
    if (!open) return null;
    return {
      url: typeof window !== "undefined" ? window.location.href : "",
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
      viewport: typeof window !== "undefined" ? `${window.innerWidth}x${window.innerHeight}` : "",
      userRole: role || "unknown",
      capturedAt: new Date().toISOString(),
      consoleLogs: getCapturedLogs(),
    };
  }, [open, role]);

  const reset = () => {
    setTitle("");
    setDescription("");
    setModule("Other");
    setSeverity("medium");
    setFiles([]);
    setShowTechnical(false);
  };

  const handleClose = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      toast.error("Please add a title and description");
      return;
    }
    if (!technicalContext) return;

    setSubmitting(true);
    try {
      const created = await createBug({
        title: title.trim(),
        description: description.trim(),
        module,
        severity,
        technicalContext,
        files,
      });
      onCreated?.(created);
      toast.success("Bug report submitted");
      handleClose(false);
    } catch (err) {
      console.error("Failed to submit bug", err);
      toast.error("Failed to submit bug report");
    } finally {
      setSubmitting(false);
    }
  };

  const addFiles = (incoming: File[]) => {
    const images = incoming.filter((f) => f.type.startsWith("image/"));
    if (images.length === 0) return;
    setFiles((prev) => [...prev, ...images].slice(0, 5));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    addFiles(Array.from(e.target.files));
    // Reset so re-selecting the same file still fires change.
    e.target.value = "";
  };

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    if (!dragActive) setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    // Only clear when leaving the dropzone itself, not bubbling from children.
    if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragActive(false);
    if (!e.dataTransfer.files || e.dataTransfer.files.length === 0) return;
    addFiles(Array.from(e.dataTransfer.files));
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <Modal size="md" className="max-h-[90vh] overflow-y-auto">
        <DialogTitle className="text-lg font-semibold mb-1">Report a Bug</DialogTitle>
        <p className="text-sm text-gray-500 mb-4">
          Tell us what went wrong. Browser context and recent console activity are attached automatically.
        </p>

        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-medium text-gray-700">Module</Label>
              <Select value={module} onValueChange={(v) => setModule(v as BugModule)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-md rounded-md">
                  {BUG_MODULES.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-medium text-gray-700">Severity</Label>
              <Select value={severity} onValueChange={(v) => setSeverity(v as BugSeverity)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-md rounded-md">
                  {BUG_SEVERITIES.map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-xs font-medium text-gray-700">Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              placeholder="Short summary of the issue"
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-xs font-medium text-gray-700">Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What did you do? What did you expect? What happened?"
              rows={5}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-xs font-medium text-gray-700">Screenshots</Label>
            <label
              htmlFor="bug-screenshots"
              onDragEnter={handleDragOver}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`mt-1 flex flex-col items-center justify-center w-full px-4 py-5 border border-dashed rounded-md cursor-pointer transition-colors ${
                dragActive
                  ? "border-[#013764] bg-[#013764]/5"
                  : "border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-gray-400"
              }`}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`mb-1 ${dragActive ? "text-[#013764]" : "text-gray-400"}`}>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              <span className="text-sm text-gray-700 font-medium pointer-events-none">
                {dragActive ? "Drop images to upload" : "Drag and drop or click to upload"}
              </span>
              <span className="text-xs text-gray-500 mt-0.5 pointer-events-none">PNG, JPG · up to 5 files</span>
              <input
                id="bug-screenshots"
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
            {files.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center gap-1.5 pl-2 pr-1 py-1 bg-gray-100 border border-gray-200 rounded text-xs">
                    <span className="truncate max-w-[160px] text-gray-700">{f.name}</span>
                    <button
                      type="button"
                      aria-label="Remove file"
                      className="w-4 h-4 flex items-center justify-center text-gray-500 hover:text-red-600 rounded hover:bg-white"
                      onClick={() => setFiles(files.filter((_, idx) => idx !== i))}
                    >×</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border border-gray-200 rounded-lg">
            <button
              type="button"
              className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              onClick={() => setShowTechnical((v) => !v)}
            >
              <span>Technical context (auto-captured)</span>
              <span className="text-xs text-gray-500">{showTechnical ? "Hide" : "Show"}</span>
            </button>
            {showTechnical && technicalContext && (
              <div className="px-3 py-2 border-t border-gray-200 text-xs text-gray-700 space-y-1 bg-gray-50">
                <div><span className="text-gray-500">URL:</span> {technicalContext.url}</div>
                <div><span className="text-gray-500">Viewport:</span> {technicalContext.viewport}</div>
                <div><span className="text-gray-500">Role:</span> {technicalContext.userRole}</div>
                <div className="truncate"><span className="text-gray-500">User Agent:</span> {technicalContext.userAgent}</div>
                <div>
                  <span className="text-gray-500">Console entries:</span> {technicalContext.consoleLogs.length}
                </div>
                {technicalContext.consoleLogs.length > 0 && (
                  <pre className="mt-1 max-h-32 overflow-auto bg-white border border-gray-200 rounded p-2 text-[11px] leading-tight">
                    {technicalContext.consoleLogs.slice(-10).map((l, i) => (
                      <div key={i}>
                        <span className="text-gray-400">[{l.level}]</span> {l.message}
                      </div>
                    ))}
                  </pre>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => handleClose(false)} disabled={submitting}>
              Cancel
            </Button>
            <BlueButton onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Submitting…" : "Submit Bug Report"}
            </BlueButton>
          </div>
        </div>
      </Modal>
    </Dialog>
  );
}
