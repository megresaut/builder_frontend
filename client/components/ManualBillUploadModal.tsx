import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  AttachmentUploader,
  type UploadedFile,
} from "@/components/ui/attachment-uploader";
import { authFetch, fetchJSON } from "@/api/fetchJSON";

// "Upload manually" flow for a utility account. Two states:
//
//   1. upload  — PDF file picker → POST .../manual-bill/parse. Server
//                stores the PDF and asks Claude to extract scraper-
//                equivalent fields (statement_date, period_start/end,
//                due_date, amount_cents, statement_id).
//   2. review  — Editable form pre-populated with the AI's extraction.
//                The user confirms or corrects each field, then submits
//                → POST .../manual-bill. Server inserts the bill row
//                (source_type='manual'), dual-pushes to Buildium / QBO,
//                advances next_scheduled_scrape_at. Atomic: if push
//                fails, the bill row is deleted server-side.
//
// On success, the parent invalidates utility-accounts + utility-bills
// queries so the table reflects the new bill + advanced schedule.

type ParsedDraft = {
  statement_date: string | null;
  period_start: string | null;
  period_end: string | null;
  due_date: string | null;
  amount_cents: number | null;
  statement_id: string | null;
  confidence: number | null;
  pdf_object_key: string;
  sha256_pdf: string;
  raw_ai_text?: string;
};

type CommitResult = {
  bill_id: number;
  push_status: string;
  next_scheduled_scrape_at: string | null;
};

interface ManualBillUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: {
    id: number;
    provider: string;
    account: string;
  } | null;
  // Called after a successful commit so the parent can toast + invalidate
  // its React Query caches. `result.next_scheduled_scrape_at` is an ISO
  // timestamp (or null) so the parent can show "Next scrape: <date>".
  onSuccess: (result: CommitResult) => void;
}

export default function ManualBillUploadModal({
  open,
  onOpenChange,
  account,
  onSuccess,
}: ManualBillUploadModalProps) {
  type Step = "upload" | "review";
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  // Mirror file state for AttachmentUploader, which owns its own "selected
  // files" UI. We keep both in sync so the dropzone shows the picked file
  // (size, remove button) while `file` is what we actually upload.
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [draft, setDraft] = useState<ParsedDraft | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Blob URL for the inline PDF preview on the review step. Tied to the
  // `file` we picked locally — no server round-trip needed since the bytes
  // are already in the browser. Revoked on cleanup / file swap to avoid
  // leaking object URLs into the heap.
  const pdfPreviewUrl = useMemo(
    () => (file ? URL.createObjectURL(file) : null),
    [file]
  );
  useEffect(() => {
    return () => {
      if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl);
    };
  }, [pdfPreviewUrl]);

  // Form fields (editable copies of the AI draft)
  const [statementDate, setStatementDate] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [amountDollars, setAmountDollars] = useState("");
  const [statementId, setStatementId] = useState("");

  function resetAll() {
    setStep("upload");
    setFile(null);
    setUploadedFiles([]);
    setDraft(null);
    setBusy(false);
    setError(null);
    setStatementDate("");
    setPeriodStart("");
    setPeriodEnd("");
    setDueDate("");
    setAmountDollars("");
    setStatementId("");
  }

  function handleOpenChange(next: boolean) {
    if (!next) resetAll();
    onOpenChange(next);
  }

  async function handleParse() {
    if (!account || !file) return;
    setBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("pdf", file);

      // authFetch is the helper that DOES NOT set Content-Type — lets the
      // browser pick the multipart boundary automatically.
      const res = await authFetch(
        `/utilities/accounts/${account.id}/manual-bill/parse`,
        { method: "POST", body: fd }
      );
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Parse failed (${res.status})`);
      }
      const parsed: ParsedDraft = await res.json();
      setDraft(parsed);
      setStatementDate(parsed.statement_date ?? "");
      setPeriodStart(parsed.period_start ?? "");
      setPeriodEnd(parsed.period_end ?? "");
      setDueDate(parsed.due_date ?? "");
      setAmountDollars(
        parsed.amount_cents != null
          ? (parsed.amount_cents / 100).toFixed(2)
          : ""
      );
      setStatementId(parsed.statement_id ?? "");
      setStep("review");
    } catch (e: any) {
      setError(e?.message || "Failed to parse PDF");
    } finally {
      setBusy(false);
    }
  }

  async function handleCommit() {
    if (!account || !draft) return;
    setBusy(true);
    setError(null);
    try {
      const amountCents = Math.round(parseFloat(amountDollars) * 100);
      if (!isFinite(amountCents) || amountCents <= 0) {
        throw new Error("Amount must be greater than 0");
      }
      const body = {
        statement_date: statementDate.trim(),
        period_start: periodStart.trim() || null,
        period_end: periodEnd.trim() || null,
        due_date: dueDate.trim() || null,
        amount_cents: amountCents,
        statement_id: statementId.trim() || null,
        pdf_object_key: draft.pdf_object_key,
        sha256_pdf: draft.sha256_pdf,
      };
      const result: CommitResult = await fetchJSON(
        `/utilities/accounts/${account.id}/manual-bill`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      onSuccess(result);
      resetAll();
      onOpenChange(false);
    } catch (e: any) {
      setError(e?.message || "Failed to book bill");
    } finally {
      setBusy(false);
    }
  }

  const acctLabel = account ? `${account.provider} — ${account.account}` : "";
  const confidenceHint =
    draft?.confidence != null
      ? `AI confidence: ${(draft.confidence * 100).toFixed(0)}%`
      : null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={
          step === "review"
            ? "bg-white max-w-[960px] p-8 gap-0 rounded-2xl"
            : "bg-white max-w-[520px] p-8 gap-0 rounded-2xl"
        }
      >
        <DialogTitle className="text-[#303030] text-2xl font-semibold leading-[1.25] mb-4">
          {step === "upload"
            ? `Upload manual bill — ${acctLabel}`
            : `Review extracted bill — ${acctLabel}`}
        </DialogTitle>

        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm">
            {error}
          </div>
        )}

        {step === "upload" && (
          <div className="flex flex-col gap-4 mt-2">
            <p className="text-sm text-gray-600">
              Upload the utility bill PDF. We'll extract the fields with AI,
              show them to you for review, then book the bill and advance
              the cron schedule for this account.
            </p>
            <AttachmentUploader
              files={uploadedFiles}
              accept=".pdf,application/pdf"
              maxFiles={1}
              maxSize={25 * 1024 * 1024}
              placeholder="Drag and drop your PDF here, or click to browse"
              onFilesAdded={(added) => {
                // maxFiles=1 enforces single selection; replace any prior file.
                const next = added[0];
                if (next?.file) {
                  setFile(next.file);
                  setUploadedFiles([next]);
                }
              }}
              onFileRemoved={() => {
                setFile(null);
                setUploadedFiles([]);
              }}
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleOpenChange(false)}
                className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                disabled={busy}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleParse}
                disabled={!file || busy}
                className="px-4 py-2 rounded-md bg-[#013564] text-white hover:bg-[#012a4d] disabled:opacity-60"
              >
                {busy ? "Parsing…" : "Parse bill"}
              </button>
            </div>
          </div>
        )}

        {step === "review" && draft && (
          <div className="mt-2 grid grid-cols-[1.05fr_1fr] gap-6">
            {/* PDF preview — same file the user just uploaded, rendered
                from a local blob URL so they can spot-check AI extractions
                against the bill side-by-side. Falls back to a download
                link if the browser can't render PDFs inline. */}
            <div className="flex flex-col gap-2 min-h-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-700 uppercase tracking-wide">
                  Uploaded PDF
                </span>
                {pdfPreviewUrl && (
                  <a
                    href={pdfPreviewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#013564] hover:underline"
                  >
                    Open in new tab ↗
                  </a>
                )}
              </div>
              {pdfPreviewUrl ? (
                <iframe
                  src={pdfPreviewUrl}
                  title="Uploaded utility bill PDF"
                  className="w-full h-[560px] border border-gray-200 rounded-lg bg-gray-50"
                />
              ) : (
                <div className="w-full h-[560px] border border-gray-200 rounded-lg bg-gray-50 flex items-center justify-center text-sm text-gray-500">
                  PDF unavailable
                </div>
              )}
            </div>

            {/* Editable form pre-populated by the AI extraction. User
                corrects anything wrong here before we book + dual-push. */}
            <div className="flex flex-col gap-3 min-h-0">
              {confidenceHint && (
                <p className="text-xs text-gray-500">{confidenceHint}</p>
              )}

              <label className="text-sm">
                <span className="text-gray-700">Statement date</span>
                <Input
                  type="date"
                  value={statementDate}
                  onChange={(e) => setStatementDate(e.target.value)}
                  className="mt-1"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm">
                  <span className="text-gray-700">Period start</span>
                  <Input
                    type="date"
                    value={periodStart}
                    onChange={(e) => setPeriodStart(e.target.value)}
                    className="mt-1"
                  />
                </label>
                <label className="text-sm">
                  <span className="text-gray-700">
                    Period end <span className="text-red-500">*</span>
                  </span>
                  <Input
                    type="date"
                    value={periodEnd}
                    onChange={(e) => setPeriodEnd(e.target.value)}
                    className="mt-1"
                  />
                </label>
              </div>

              <label className="text-sm">
                <span className="text-gray-700">Due date</span>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="mt-1"
                />
              </label>

              <label className="text-sm">
                <span className="text-gray-700">
                  Amount (USD) <span className="text-red-500">*</span>
                </span>
                <Input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  value={amountDollars}
                  onChange={(e) => setAmountDollars(e.target.value)}
                  className="mt-1"
                  placeholder="e.g. 123.45"
                />
              </label>

              <label className="text-sm">
                <span className="text-gray-700">Invoice / statement number</span>
                <Input
                  type="text"
                  value={statementId}
                  onChange={(e) => setStatementId(e.target.value)}
                  className="mt-1"
                  placeholder="Optional"
                />
              </label>
            </div>

            {/* Footer spans full modal width so Cancel / Submit aren't
                squeezed into the form column. Standard modal pattern. */}
            <div className="col-span-2 flex justify-between items-center pt-4 mt-2 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setStep("upload")}
                className="text-sm text-gray-600 hover:text-gray-800 whitespace-nowrap"
                disabled={busy}
              >
                ← Re-upload PDF
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenChange(false)}
                  className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 whitespace-nowrap"
                  disabled={busy}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCommit}
                  disabled={busy || !periodEnd || !statementDate || !amountDollars}
                  className="px-4 py-2 rounded-md bg-[#013564] text-white hover:bg-[#012a4d] disabled:opacity-60 whitespace-nowrap"
                >
                  {busy ? "Booking…" : "Submit & book"}
                </button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
