import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import CreateChargeFromStatementRowModal from "@/components/CreateChargeFromStatementRowModal";
import PayExistingBillModal from "@/components/PayExistingBillModal";
import EditReconciliationModal from "@/components/EditReconciliationModal";
import FinalizeReconciliationModal from "@/components/FinalizeReconciliationModal";
import ForceClearReasonModal from "@/components/ForceClearReasonModal";
import {
  forceClear,
  getReconciliationWorkspace,
  matchReconciliationLine,
  removeStatement,
  reopen,
  setStatementAction,
  unmatchReconciliationLine,
  uploadStatement,
  type CreditCardActivityRow,
  type MatchPair,
  type ReconciliationLine,
  type StatementRow,
  type Workspace,
} from "@/data/credit-card-reconciliation";

const formatCents = (cents: number): string =>
  (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });

const STATUS_BADGE: Record<string, string> = {
  in_progress: "bg-amber-50 text-amber-700 border-amber-200",
  finalized: "bg-emerald-50 text-emerald-700 border-emerald-200",
  needs_review: "bg-rose-50 text-rose-700 border-rose-200",
};

const STATUS_LABEL: Record<string, string> = {
  in_progress: "In progress",
  finalized: "Finalized",
  needs_review: "Needs review",
};

export default function CreditCardReconciliationWorkspace() {
  const { recId } = useParams<{ recId: string }>();
  const navigate = useNavigate();
  const id = recId ? Number(recId) : NaN;

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingTxnID, setPendingTxnID] = useState<string | null>(null);
  const [pendingLineID, setPendingLineID] = useState<number | null>(null);

  // Statement upload state. The persisted statement (suggestions +
  // unmatched-statement rows) is hydrated from the workspace response on every
  // GET so it survives refresh. uploadWarnings are surfaced from the most
  // recent upload only — they aren't persisted (the rows themselves are).
  const [uploadWarnings, setUploadWarnings] = useState<string[]>([]);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [removingStatement, setRemovingStatement] = useState(false);
  const [acceptingAll, setAcceptingAll] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Side-by-side manual pairing selection.
  const [selectedStmt, setSelectedStmt] = useState<StatementRow | null>(null);
  const [selectedQbo, setSelectedQbo] = useState<CreditCardActivityRow | null>(null);

  // "Create charge from this row" modal state.
  const [createForRow, setCreateForRow] = useState<StatementRow | null>(null);
  // "Pay existing bill" modal state.
  const [payForRow, setPayForRow] = useState<StatementRow | null>(null);

  // "Edit period / balances" modal state. Open via the inline affordance in
  // the workspace header. Save → PATCH → reload workspace so dates + matches
  // re-converge against the new range.
  const [editingPeriod, setEditingPeriod] = useState(false);

  // Force-clear modal state. The row being force-cleared lives here so the
  // modal can render its details + we know what to send to the API on confirm.
  const [forceClearRow, setForceClearRow] = useState<CreditCardActivityRow | null>(
    null,
  );
  const [forceClearSubmitting, setForceClearSubmitting] = useState(false);
  const [forceClearError, setForceClearError] = useState<string | null>(null);

  // Tracks the source_row currently being deferred/disputed/cleared so we can
  // disable the row's buttons during the round-trip. Single value because the
  // user can only click one at a time.
  const [pendingActionRow, setPendingActionRow] = useState<number | null>(null);
  const [resolvedExpanded, setResolvedExpanded] = useState(true);

  // Finalize modal state. Opens from the header button when the gate is
  // satisfied (difference == 0 + every statement row decided). The server
  // re-checks the gate on POST so this is purely UX.
  const [finalizingOpen, setFinalizingOpen] = useState(false);
  // Reopen flow state. The reason is captured via window.prompt — keeping the
  // flow inline avoids a second modal for a rarely-used action.
  const [reopening, setReopening] = useState(false);

  const load = useCallback(async () => {
    if (!Number.isFinite(id) || id <= 0) {
      setError("Invalid reconciliation id");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const ws = await getReconciliationWorkspace(id);
      setWorkspace(ws);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load workspace");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  // Filter suggestions: drop pairs whose QBO id is missing (can't match
  // programmatically). The server already excludes accepted matches by
  // recomputing suggestions on each GET against current matched_lines, but we
  // still guard for nil ids defensively. Defined up here so it's safe to
  // reference from the action handlers below — and to keep the hooks-rule
  // clean (no conditional useMemo after early returns).
  const pendingSuggestions = useMemo<MatchPair[]>(() => {
    if (!workspace) return [];
    return (workspace.suggestions ?? []).filter(
      (p) => p.qbo.qbo_txn_id != null && p.qbo.qbo_txn_id !== "",
    );
  }, [workspace]);

  // For the side-by-side, hide statement rows + QBO rows that are already part
  // of a pending suggestion (those live in the Suggestions panel above).
  const pairableStatementRows = useMemo<StatementRow[]>(() => {
    if (!workspace) return [];
    const suggestedKey = new Set(
      pendingSuggestions.map(
        (p) => `${p.statement.source_row}:${p.statement.amount_cents}`,
      ),
    );
    return (workspace.unmatched_statement ?? []).filter(
      (r) => !suggestedKey.has(`${r.source_row}:${r.amount_cents}`),
    );
  }, [workspace, pendingSuggestions]);

  const pairableQboRows = useMemo(() => {
    if (!workspace) return [];
    const suggestedIDs = new Set(
      pendingSuggestions
        .map((p) => p.qbo.qbo_txn_id)
        .filter((id): id is string => id != null),
    );
    return (workspace.unmatched_qbo ?? []).filter(
      (r) => r.qbo_txn_id == null || !suggestedIDs.has(r.qbo_txn_id),
    );
  }, [workspace, pendingSuggestions]);

  const handleMatch = async (row: CreditCardActivityRow) => {
    if (!workspace || !row.qbo_txn_id) return;
    setPendingTxnID(row.qbo_txn_id);
    setError(null);
    try {
      await matchReconciliationLine(workspace.reconciliation.id, {
        qbo_txn_type: row.txn_type,
        qbo_txn_id: row.qbo_txn_id,
        txn_date: row.txn_date,
        amount_cents: row.amount_cents,
        match_confidence: "manual",
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Match failed");
    } finally {
      setPendingTxnID(null);
    }
  };

  const handleStatementUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file || !workspace) return;
    setUploadLoading(true);
    setUploadError(null);
    setUploadWarnings([]);
    try {
      const res = await uploadStatement(workspace.reconciliation.id, file);
      setUploadWarnings(res.warnings ?? []);
      // Reload — suggestions + unmatched_statement come back hydrated from the
      // persisted upload, so we don't keep a local copy.
      await load();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadLoading(false);
    }
  };

  const handleRemoveStatement = async () => {
    if (!workspace) return;
    setRemovingStatement(true);
    setUploadError(null);
    setUploadWarnings([]);
    try {
      await removeStatement(workspace.reconciliation.id);
      await load();
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : "Failed to remove statement",
      );
    } finally {
      setRemovingStatement(false);
    }
  };

  const acceptSuggestion = async (pair: MatchPair) => {
    if (!workspace || !pair.qbo.qbo_txn_id) return;
    setPendingTxnID(pair.qbo.qbo_txn_id);
    setUploadError(null);
    try {
      await matchReconciliationLine(workspace.reconciliation.id, {
        qbo_txn_type: pair.qbo.txn_type,
        qbo_txn_id: pair.qbo.qbo_txn_id,
        txn_date: pair.qbo.txn_date,
        amount_cents: pair.qbo.amount_cents,
        statement_row: pair.statement,
        match_confidence: pair.confidence,
      });
      // load() recomputes suggestions server-side against the new matched_lines
      // set, so the accepted suggestion drops out automatically.
      await load();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Accept failed");
    } finally {
      setPendingTxnID(null);
    }
  };

  const acceptAllSuggestions = async () => {
    if (!workspace || pendingSuggestions.length === 0) return;
    setAcceptingAll(true);
    setUploadError(null);
    let firstErr: string | null = null;
    // Sequential rather than parallel — a future batch endpoint can replace
    // this. Each call is small; the bottleneck is API round-trip count, not
    // server work. Stop on first error so the user sees what failed.
    for (const pair of pendingSuggestions) {
      if (!pair.qbo.qbo_txn_id) continue;
      try {
        await matchReconciliationLine(workspace.reconciliation.id, {
          qbo_txn_type: pair.qbo.txn_type,
          qbo_txn_id: pair.qbo.qbo_txn_id,
          txn_date: pair.qbo.txn_date,
          amount_cents: pair.qbo.amount_cents,
          statement_row: pair.statement,
          match_confidence: pair.confidence,
        });
      } catch (err) {
        firstErr = err instanceof Error ? err.message : "Accept failed";
        break;
      }
    }
    setAcceptingAll(false);
    if (firstErr) setUploadError(firstErr);
    // load() pulls the fresh persisted view — accepted suggestions are gone,
    // unmatched_statement is reduced by their statement_row snapshots.
    await load();
  };

  const handlePair = async () => {
    if (!workspace || !selectedStmt || !selectedQbo || !selectedQbo.qbo_txn_id) return;
    setPendingTxnID(selectedQbo.qbo_txn_id);
    setError(null);
    try {
      await matchReconciliationLine(workspace.reconciliation.id, {
        qbo_txn_type: selectedQbo.txn_type,
        qbo_txn_id: selectedQbo.qbo_txn_id,
        txn_date: selectedQbo.txn_date,
        amount_cents: selectedQbo.amount_cents,
        statement_row: selectedStmt,
        match_confidence: "manual",
      });
      setSelectedStmt(null);
      setSelectedQbo(null);
      // load() refreshes everything; unmatched_statement drops the paired row.
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Pair failed");
    } finally {
      setPendingTxnID(null);
    }
  };

  const handleClearWithoutStatement = () => {
    if (!workspace || !selectedQbo || !selectedQbo.qbo_txn_id) return;
    setForceClearError(null);
    setForceClearRow(selectedQbo);
  };

  const handleForceClearConfirm = async (reason: string) => {
    if (!workspace || !forceClearRow || !forceClearRow.qbo_txn_id) return;
    setForceClearSubmitting(true);
    setForceClearError(null);
    try {
      await forceClear(workspace.reconciliation.id, {
        qbo_txn_type: forceClearRow.txn_type,
        qbo_txn_id: forceClearRow.qbo_txn_id,
        txn_date: forceClearRow.txn_date,
        amount_cents: forceClearRow.amount_cents,
        reason,
      });
      setForceClearRow(null);
      setSelectedQbo(null);
      await load();
    } catch (err) {
      setForceClearError(
        err instanceof Error ? err.message : "Force-clear failed",
      );
    } finally {
      setForceClearSubmitting(false);
    }
  };

  const handleDeferRow = async (row: StatementRow) => {
    if (!workspace) return;
    if (!window.confirm("Defer this row? It will be excluded from the pair view and tracked under Resolved.")) {
      return;
    }
    setPendingActionRow(row.source_row);
    setError(null);
    try {
      await setStatementAction(workspace.reconciliation.id, {
        source_row: row.source_row,
        action: "defer",
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Defer failed");
    } finally {
      setPendingActionRow(null);
    }
  };

  const handleDisputeRow = async (row: StatementRow) => {
    if (!workspace) return;
    const note = window.prompt("Reason for dispute (required):");
    if (note == null) return; // user cancelled
    if (note.trim() === "") {
      setError("Dispute reason is required.");
      return;
    }
    setPendingActionRow(row.source_row);
    setError(null);
    try {
      await setStatementAction(workspace.reconciliation.id, {
        source_row: row.source_row,
        action: "dispute",
        note: note.trim(),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Dispute failed");
    } finally {
      setPendingActionRow(null);
    }
  };

  const handleClearAction = async (row: StatementRow) => {
    if (!workspace) return;
    setPendingActionRow(row.source_row);
    setError(null);
    try {
      await setStatementAction(workspace.reconciliation.id, {
        source_row: row.source_row,
        action: "clear",
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Clear action failed");
    } finally {
      setPendingActionRow(null);
    }
  };

  const handleUnmatch = async (line: ReconciliationLine) => {
    if (!workspace) return;
    setPendingLineID(line.id);
    setError(null);
    try {
      await unmatchReconciliationLine(workspace.reconciliation.id, line.id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unmatch failed");
    } finally {
      setPendingLineID(null);
    }
  };

  const handleReopen = async () => {
    if (!workspace) return;
    const reason = window.prompt("Reason for reopening:");
    if (reason == null) return; // user cancelled
    if (reason.trim() === "") {
      setError("Reopen reason is required.");
      return;
    }
    setReopening(true);
    setError(null);
    try {
      await reopen(workspace.reconciliation.id, reason.trim());
      // load() pulls the freshly-in_progress rec; status badge + action
      // buttons flip back on automatically via the isInProgress gate.
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reopen failed");
    } finally {
      setReopening(false);
    }
  };

  if (loading && !workspace) {
    return (
      <div className="p-6 text-sm text-[#717179]">Loading workspace…</div>
    );
  }
  if (error && !workspace) {
    return (
      <div className="p-6">
        <div className="border border-rose-200 bg-rose-50 text-rose-900 rounded-md px-4 py-3 text-sm">
          {error}
        </div>
        <button
          type="button"
          onClick={() => navigate("/reconciliation")}
          className="mt-3 text-sm text-[#013764] underline"
        >
          ← Back to reconciliation
        </button>
      </div>
    );
  }
  if (!workspace) return null;

  const { reconciliation: rec, account } = workspace;
  const matched_lines = workspace.matched_lines ?? [];
  const unmatchedStatement = workspace.unmatched_statement ?? [];
  const isInProgress = rec.status === "in_progress";
  const isFinalized = rec.status === "finalized";

  // canFinalize mirrors the backend's Finalize gate: difference must be zero
  // and every remaining statement row must carry an `action` (defer/dispute).
  // The server re-checks on POST so this is purely UX — when in doubt it'll
  // refuse with a 409.
  const allStatementRowsDecided = unmatchedStatement.every(
    (r) => r.action != null && r.action !== undefined,
  );
  const canFinalize =
    isInProgress &&
    workspace.difference_cents === 0 &&
    (unmatchedStatement.length === 0 || allStatementRowsDecided);

  return (
    <div className="flex flex-col gap-6 p-6 max-w-[1400px]">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <Link
          to="/reconciliation"
          className="text-sm text-[#013764] hover:underline"
        >
          ← Back to reconciliation
        </Link>
        <div className="flex items-center gap-2">
          {isInProgress && (
            <>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadLoading || removingStatement}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium rounded-md border bg-white",
                  uploadLoading || removingStatement
                    ? "border-[#E5E5E5] text-[#717179]"
                    : "border-[#013764] text-[#013764] hover:bg-[#F4F7FA]",
                )}
                title={
                  workspace.reconciliation.statement_object_key
                    ? "Upload a new statement (replaces the current one)"
                    : "Upload a CSV or XLSX statement to auto-match against QBO activity"
                }
              >
                {uploadLoading
                  ? "Uploading…"
                  : workspace.reconciliation.statement_object_key
                    ? "Replace statement"
                    : "Upload statement"}
              </button>
              {workspace.reconciliation.statement_object_key && (
                <button
                  type="button"
                  onClick={handleRemoveStatement}
                  disabled={removingStatement || uploadLoading}
                  className={cn(
                    "text-xs text-[#717179] hover:text-rose-700 underline disabled:opacity-50",
                  )}
                  title={
                    workspace.reconciliation.statement_filename
                      ? `Remove uploaded statement (${workspace.reconciliation.statement_filename})`
                      : "Remove uploaded statement"
                  }
                >
                  {removingStatement ? "Removing…" : "Remove uploaded statement"}
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={handleStatementUpload}
                className="hidden"
              />
            </>
          )}
          {isInProgress && (
            <button
              type="button"
              onClick={() => setFinalizingOpen(true)}
              disabled={!canFinalize}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-md border",
                canFinalize
                  ? "border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700"
                  : "border-[#E5E5E5] bg-white text-[#717179] cursor-not-allowed",
              )}
              title={
                canFinalize
                  ? "Lock this reconciliation"
                  : workspace.difference_cents !== 0
                    ? `Difference is ${formatCents(workspace.difference_cents)} — must be $0.00 to finalize`
                    : "Resolve every statement row (match, defer, or dispute) to finalize"
              }
            >
              Finalize
            </button>
          )}
          {isFinalized && (
            <button
              type="button"
              onClick={handleReopen}
              disabled={reopening}
              className="text-xs text-[#717179] hover:text-[#013764] underline disabled:opacity-50"
              title="Unlock this reconciliation (requires an audit reason)"
            >
              {reopening ? "Reopening…" : "Reopen"}
            </button>
          )}
          <Link
            to={`/reconciliations/${rec.id}/report`}
            className="px-3 py-1.5 text-sm font-medium rounded-md border border-[#E5E5E5] bg-white text-[#303030] hover:bg-[#F8F8F8]"
            title={
              isInProgress
                ? "Preview the report for this in-progress reconciliation"
                : "View the audit report for this reconciliation"
            }
          >
            View report
          </Link>
          <button
            type="button"
            onClick={() => load()}
            disabled={loading}
            className={cn(
              "px-3 py-1.5 text-sm font-medium rounded-md border border-[#E5E5E5] bg-white",
              loading ? "text-[#717179]" : "text-[#303030] hover:bg-[#F8F8F8]",
            )}
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      <div className="border border-[#E5E5E5] rounded-md p-4 bg-white">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-lg font-semibold text-[#303030]">
              {account.qbo_name}
            </div>
            <div className="text-sm text-[#717179] mt-0.5">
              {isInProgress ? (
                <button
                  type="button"
                  onClick={() => setEditingPeriod(true)}
                  className="text-left text-[#013764] hover:underline focus:outline-none focus:underline"
                  title="Edit period dates and balances"
                >
                  {rec.period_start} → {rec.period_end}
                  {rec.statement_date && (
                    <span className="ml-2 text-[#A1A1A1]">
                      (statement {rec.statement_date})
                    </span>
                  )}
                  <span className="ml-2 text-xs text-[#A1A1A1]">Edit</span>
                </button>
              ) : (
                <>
                  {rec.period_start} → {rec.period_end}
                  {rec.statement_date && (
                    <span className="ml-2 text-[#A1A1A1]">
                      (statement {rec.statement_date})
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
          <span
            className={cn(
              "px-2 py-1 text-xs font-medium border rounded-md",
              STATUS_BADGE[rec.status] ?? "bg-slate-50 text-slate-700",
            )}
          >
            {STATUS_LABEL[rec.status] ?? rec.status}
          </span>
        </div>

        {/* Running math */}
        <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-[#F0F0F0]">
          <Stat label="Beginning balance" value={formatCents(rec.beginning_balance_cents)} />
          <Stat label="Cleared total" value={formatCents(workspace.cleared_total_cents)} />
          <Stat label="Ending balance" value={formatCents(rec.ending_balance_cents)} />
          <Stat
            label="Difference"
            value={formatCents(workspace.difference_cents)}
            highlight={
              workspace.difference_cents === 0 ? "tied" : "untied"
            }
          />
        </div>
      </div>

      {error && (
        <div className="border border-rose-200 bg-rose-50 text-rose-900 rounded-md px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {uploadError && (
        <div className="border border-rose-200 bg-rose-50 text-rose-900 rounded-md px-4 py-3 text-sm">
          {uploadError}
        </div>
      )}

      {uploadWarnings.length > 0 && (
        <div className="border border-amber-200 bg-amber-50 text-amber-900 rounded-md px-4 py-3 text-sm">
          <div className="font-medium mb-1">Statement parsed with warnings:</div>
          <ul className="list-disc list-inside text-xs space-y-0.5">
            {uploadWarnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {pendingSuggestions.length > 0 && (
        <section className="border border-sky-200 rounded-md bg-white">
          <div className="px-4 py-3 border-b border-sky-100 bg-sky-50/50 flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="text-sm font-semibold text-[#303030]">
                Suggested matches ({pendingSuggestions.length})
              </div>
              <div className="text-xs text-[#717179] mt-0.5">
                From the uploaded statement. Each pair has the same amount and a
                date within ±3 days.
              </div>
            </div>
            {isInProgress && (
              <button
                type="button"
                onClick={acceptAllSuggestions}
                disabled={acceptingAll || pendingSuggestions.length === 0}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium rounded-md border",
                  acceptingAll
                    ? "border-[#E5E5E5] bg-white text-[#717179]"
                    : "border-[#013764] bg-[#013764] text-white hover:bg-[#012a4e]",
                )}
              >
                {acceptingAll
                  ? "Accepting…"
                  : `Accept all (${pendingSuggestions.length})`}
              </button>
            )}
          </div>
          <ul className="divide-y divide-[#F0F0F0]">
            {pendingSuggestions.map((pair, i) => {
              const txnID = pair.qbo.qbo_txn_id ?? `${i}`;
              return (
                <li
                  key={txnID}
                  className="px-4 py-3 grid grid-cols-[1fr_auto_1fr_auto] gap-3 items-center"
                >
                  <div className="min-w-0">
                    <div className="text-xs text-[#A1A1A1] uppercase tracking-wide">
                      Statement
                    </div>
                    <div className="text-sm text-[#303030] truncate">
                      {pair.statement.description || "—"}
                    </div>
                    <div className="text-xs text-[#717179]">
                      {pair.statement.date} · row {pair.statement.source_row}
                    </div>
                  </div>
                  <div className="text-[#A1A1A1] text-xs">↔</div>
                  <div className="min-w-0">
                    <div className="text-xs text-[#A1A1A1] uppercase tracking-wide">
                      QBO ({pair.confidence === "exact" ? "exact" : "±3 days"})
                    </div>
                    <div className="text-sm text-[#303030] truncate">
                      {pair.qbo.txn_type}
                      {pair.qbo.vendor && (
                        <span className="text-[#717179]"> · {pair.qbo.vendor}</span>
                      )}
                    </div>
                    <div className="text-xs text-[#717179]">
                      {pair.qbo.txn_date}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <div className="text-sm font-medium text-[#303030] tabular-nums">
                      {formatCents(pair.statement.amount_cents)}
                    </div>
                    {isInProgress && (
                      <button
                        type="button"
                        onClick={() => acceptSuggestion(pair)}
                        disabled={
                          acceptingAll ||
                          pendingTxnID === pair.qbo.qbo_txn_id
                        }
                        className="text-xs text-[#013764] hover:underline disabled:opacity-40 disabled:no-underline"
                      >
                        {pendingTxnID === pair.qbo.qbo_txn_id
                          ? "…"
                          : "Accept"}
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Side-by-side pair view: unmatched statement rows vs unmatched QBO. */}
      <section className="border border-[#E5E5E5] rounded-md bg-white">
        <div className="px-4 py-3 border-b border-[#F0F0F0] flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="text-sm font-semibold text-[#303030]">
              Pair unmatched
            </div>
            <div className="text-xs text-[#717179] mt-0.5">
              Click a statement row and a QBO row, then Pair. Amount-matching QBO
              rows are tinted green when a statement row is selected.
            </div>
          </div>
          {isInProgress && (
            <div className="flex items-center gap-2">
              {(selectedStmt || selectedQbo) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedStmt(null);
                    setSelectedQbo(null);
                  }}
                  className="text-xs text-[#717179] underline"
                >
                  Clear selection
                </button>
              )}
              <button
                type="button"
                onClick={handleClearWithoutStatement}
                disabled={
                  !selectedQbo ||
                  selectedStmt != null ||
                  !selectedQbo.qbo_txn_id ||
                  pendingTxnID === selectedQbo?.qbo_txn_id
                }
                className={cn(
                  "px-3 py-1.5 text-sm font-medium rounded-md border bg-white",
                  selectedQbo && !selectedStmt
                    ? "border-[#013764] text-[#013764] hover:bg-[#F4F7FA]"
                    : "border-[#E5E5E5] text-[#717179]",
                )}
                title="Mark the selected QBO row as cleared without a statement counterpart (requires a reason)"
              >
                Force clear
              </button>
              <button
                type="button"
                onClick={handlePair}
                disabled={
                  !selectedStmt ||
                  !selectedQbo ||
                  !selectedQbo.qbo_txn_id ||
                  pendingTxnID === selectedQbo?.qbo_txn_id
                }
                className={cn(
                  "px-3 py-1.5 text-sm font-medium rounded-md border",
                  selectedStmt && selectedQbo
                    ? "border-[#013764] bg-[#013764] text-white hover:bg-[#012a4e]"
                    : "border-[#E5E5E5] bg-white text-[#717179]",
                )}
              >
                {pendingTxnID && selectedQbo?.qbo_txn_id === pendingTxnID
                  ? "Pairing…"
                  : "Pair selected"}
              </button>
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 divide-x divide-[#F0F0F0]">
          {/* Statement column */}
          <div>
            <div className="px-4 py-2 border-b border-[#F0F0F0] bg-[#FAFAFA] text-xs font-medium text-[#717179] flex items-center justify-between">
              <span>Statement ({pairableStatementRows.length})</span>
              {selectedStmt && (
                <span className="text-[#013764] tabular-nums">
                  selected: {formatCents(selectedStmt.amount_cents)}
                </span>
              )}
            </div>
            {pairableStatementRows.length === 0 ? (
              <div className="p-6 text-sm text-[#717179] text-center">
                {unmatchedStatement.length === 0
                  ? "Upload a statement to see rows here."
                  : "All statement rows are paired or pending."}
              </div>
            ) : (
              <ul className="max-h-[600px] overflow-y-auto divide-y divide-[#F0F0F0]">
                {pairableStatementRows.map((r) => {
                  const isSelected =
                    selectedStmt?.source_row === r.source_row &&
                    selectedStmt?.amount_cents === r.amount_cents;
                  return (
                    <li
                      key={`${r.source_row}-${r.date}-${r.amount_cents}`}
                      onClick={() =>
                        isInProgress &&
                        setSelectedStmt(isSelected ? null : r)
                      }
                      className={cn(
                        "px-4 py-3 flex items-center justify-between gap-3",
                        isInProgress ? "cursor-pointer" : "",
                        isSelected
                          ? "bg-sky-50 border-l-4 border-l-sky-500 pl-3"
                          : "hover:bg-[#F8F8F8] border-l-4 border-l-transparent pl-3",
                      )}
                    >
                      <div className="min-w-0">
                        <div className="text-sm text-[#303030] truncate">
                          {r.description || "—"}
                        </div>
                        <div className="text-xs text-[#A1A1A1]">
                          {r.date} · row {r.source_row}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-sm font-medium text-[#303030] tabular-nums">
                          {formatCents(r.amount_cents)}
                        </div>
                        {isInProgress && (
                          <>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPayForRow(r);
                              }}
                              className="text-xs text-[#013764] hover:underline"
                              title="Pay an existing unpaid platform bill from this statement row"
                            >
                              Pay existing bill
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCreateForRow(r);
                              }}
                              className="text-xs text-[#013764] hover:underline"
                              title="Create a bill + payment in QBO + platform from this statement row"
                            >
                              Create charge
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                void handleDeferRow(r);
                              }}
                              disabled={pendingActionRow === r.source_row}
                              className="text-xs text-[#717179] hover:text-[#303030] underline disabled:opacity-40"
                              title="Defer this row — won't be matched in this rec but is decided so Finalize can proceed"
                            >
                              {pendingActionRow === r.source_row ? "…" : "Defer"}
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                void handleDisputeRow(r);
                              }}
                              disabled={pendingActionRow === r.source_row}
                              className="text-xs text-rose-700 hover:text-rose-900 underline disabled:opacity-40"
                              title="Dispute this row — captures a required reason for audit"
                            >
                              {pendingActionRow === r.source_row ? "…" : "Dispute"}
                            </button>
                          </>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          {/* QBO column */}
          <div>
            <div className="px-4 py-2 border-b border-[#F0F0F0] bg-[#FAFAFA] text-xs font-medium text-[#717179] flex items-center justify-between">
              <span>QBO ({pairableQboRows.length})</span>
              {selectedQbo && (
                <span className="text-[#013764] tabular-nums">
                  selected: {formatCents(selectedQbo.amount_cents)}
                </span>
              )}
            </div>
            {pairableQboRows.length === 0 ? (
              <div className="p-6 text-sm text-[#717179] text-center">
                Nothing unmatched in QBO for this period.
              </div>
            ) : (
              <ul className="max-h-[600px] overflow-y-auto divide-y divide-[#F0F0F0]">
                {pairableQboRows.map((row, i) => {
                  const matchable = !!row.qbo_txn_id;
                  const isSelected =
                    matchable && selectedQbo?.qbo_txn_id === row.qbo_txn_id;
                  const sameAmount =
                    selectedStmt != null &&
                    !isSelected &&
                    selectedStmt.amount_cents === row.amount_cents;
                  const key =
                    row.qbo_txn_id ??
                    `${row.txn_type}-${row.txn_date}-${row.amount_cents}-${i}`;
                  return (
                    <li
                      key={key}
                      onClick={() =>
                        isInProgress &&
                        matchable &&
                        setSelectedQbo(isSelected ? null : row)
                      }
                      title={
                        matchable
                          ? undefined
                          : "Row has no QBO id; can't be paired"
                      }
                      className={cn(
                        "px-4 py-3 flex items-center justify-between gap-3 border-l-4 pl-3",
                        isInProgress && matchable
                          ? "cursor-pointer"
                          : "opacity-60",
                        isSelected
                          ? "bg-sky-50 border-l-sky-500"
                          : sameAmount
                            ? "bg-emerald-50/50 border-l-emerald-300 hover:bg-emerald-50"
                            : "border-l-transparent hover:bg-[#F8F8F8]",
                      )}
                    >
                      <div className="min-w-0">
                        <div className="text-sm text-[#303030] truncate">
                          {row.txn_type}
                          {row.vendor && (
                            <span className="text-[#717179]"> · {row.vendor}</span>
                          )}
                        </div>
                        <div className="text-xs text-[#A1A1A1]">
                          {row.txn_date} · {row.status}
                          {row.memo && <span> · {row.memo}</span>}
                        </div>
                      </div>
                      <div className="text-sm font-medium text-[#303030] tabular-nums shrink-0">
                        {formatCents(row.amount_cents)}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </section>

      <ForceClearReasonModal
        open={forceClearRow != null}
        onOpenChange={(o) => {
          if (!o) {
            setForceClearRow(null);
            setForceClearError(null);
          }
        }}
        qboRow={forceClearRow}
        onConfirm={handleForceClearConfirm}
        submitting={forceClearSubmitting}
        error={forceClearError}
      />

      <EditReconciliationModal
        open={editingPeriod}
        onOpenChange={setEditingPeriod}
        reconciliation={rec}
        onSaved={() => {
          // Reload — the new period may surface previously-matched lines as
          // drift (their txn_date might now fall outside the range) and may
          // pull in new unmatched QBO rows.
          void load();
        }}
      />

      <CreateChargeFromStatementRowModal
        open={createForRow != null}
        onOpenChange={(o) => {
          if (!o) setCreateForRow(null);
        }}
        reconciliationID={rec.id}
        statementRow={createForRow}
        onCreated={() => {
          // load() pulls the fresh persisted view — the new line lands in
          // matched_lines and its statement_row snapshot drops the originating
          // row out of unmatched_statement automatically.
          setCreateForRow(null);
          void load();
        }}
      />

      <PayExistingBillModal
        open={payForRow != null}
        onOpenChange={(o) => {
          if (!o) setPayForRow(null);
        }}
        reconciliationID={rec.id}
        statementRow={payForRow}
        onPaid={() => {
          // Same as onCreated above — server-side state is the source of truth.
          setPayForRow(null);
          void load();
        }}
      />

      <FinalizeReconciliationModal
        open={finalizingOpen}
        onOpenChange={setFinalizingOpen}
        workspace={workspace}
        onFinalized={() => {
          // Reload so the status badge flips + all action buttons disappear
          // via the existing isInProgress gate.
          void load();
        }}
      />

      {/* Cleared (full width, below the pair view). */}
      <section className="border border-[#E5E5E5] rounded-md bg-white">
        <div className="px-4 py-3 border-b border-[#F0F0F0] flex items-center justify-between">
          <div className="text-sm font-semibold text-[#303030]">
            Cleared ({matched_lines.length})
          </div>
          <div className="text-sm text-[#717179]">
            {formatCents(workspace.cleared_total_cents)}
          </div>
        </div>
        {matched_lines.length === 0 ? (
          <div className="p-6 text-sm text-[#717179] text-center">
            No transactions cleared yet.
          </div>
        ) : (
          <ul className="divide-y divide-[#F0F0F0]">
            {matched_lines.map((line) => {
              const isForced = line.match_confidence === "forced";
              // Primary identifier: the statement description (what the user
              // recognizes from their statement). Fall back to QBO vendor or
              // txn type when no statement row.
              const primary =
                line.statement_row?.description ||
                line.qbo_vendor ||
                line.qbo_txn_type;
              // Subtitle: for forced lines, lead with the audit reason so the
              // operator's justification is the first thing the reviewer sees.
              // Otherwise: "Matched to: <vendor> · <txn type> [· memo] · QBO #id"
              const subtitleParts: string[] = [];
              if (line.qbo_vendor) subtitleParts.push(line.qbo_vendor);
              subtitleParts.push(line.qbo_txn_type);
              if (line.qbo_memo) subtitleParts.push(`"${line.qbo_memo}"`);
              subtitleParts.push(`QBO #${line.qbo_txn_id}`);
              const subtitle = isForced
                ? `Reason: ${line.force_clear_reason ?? "(no reason recorded)"}`
                : `Matched to: ${subtitleParts.join(" · ")}`;
              return (
                <li
                  key={line.id}
                  className="px-4 py-3 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="text-sm text-[#303030] truncate flex items-center gap-2">
                      <span className="truncate">{primary}</span>
                      {isForced && (
                        <span
                          className="px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide rounded border border-amber-200 bg-amber-50 text-amber-800 shrink-0"
                          title="Force-cleared without a statement counterpart"
                        >
                          forced
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[#717179] truncate">
                      {subtitle}
                    </div>
                    <div className="text-xs text-[#A1A1A1]">
                      {line.txn_date} · {line.match_confidence}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-sm font-medium text-[#303030] tabular-nums">
                      {formatCents(line.amount_cents)}
                    </div>
                    {isInProgress && (
                      <button
                        type="button"
                        onClick={() => handleUnmatch(line)}
                        disabled={pendingLineID === line.id}
                        className="text-xs text-[#717179] hover:text-rose-700 underline disabled:opacity-50"
                      >
                        {pendingLineID === line.id ? "…" : "Unmatch"}
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Resolved (deferred/disputed) — only rendered when at least one row
          has been explicitly resolved. Decided rows are excluded from the
          pair view; this section keeps them visible + clearable. */}
      {workspace.resolved_statement && workspace.resolved_statement.length > 0 && (
        <section className="border border-[#E5E5E5] rounded-md bg-white">
          <button
            type="button"
            onClick={() => setResolvedExpanded((v) => !v)}
            className="w-full px-4 py-3 border-b border-[#F0F0F0] flex items-center justify-between gap-3 hover:bg-[#F8F8F8]"
          >
            <div className="text-sm font-semibold text-[#303030]">
              Resolved ({workspace.resolved_statement.length})
            </div>
            <div className="text-xs text-[#717179]">
              {resolvedExpanded ? "Collapse" : "Expand"}
            </div>
          </button>
          {resolvedExpanded && (
            <ul className="divide-y divide-[#F0F0F0]">
              {workspace.resolved_statement.map((r) => {
                const isDispute = r.action === "dispute";
                const badgeClass = isDispute
                  ? "border-rose-200 bg-rose-50 text-rose-800"
                  : "border-amber-200 bg-amber-50 text-amber-800";
                return (
                  <li
                    key={`${r.source_row}-${r.date}-${r.amount_cents}`}
                    className="px-4 py-3 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="text-sm text-[#303030] truncate flex items-center gap-2">
                        <span className="truncate">{r.description || "—"}</span>
                        <span
                          className={cn(
                            "px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide rounded border shrink-0",
                            badgeClass,
                          )}
                        >
                          {r.action}
                        </span>
                      </div>
                      {r.action_note && (
                        <div className="text-xs text-[#717179] truncate">
                          Note: {r.action_note}
                        </div>
                      )}
                      <div className="text-xs text-[#A1A1A1]">
                        {r.date} · row {r.source_row}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-sm font-medium text-[#303030] tabular-nums">
                        {formatCents(r.amount_cents)}
                      </div>
                      {isInProgress && (
                        <button
                          type="button"
                          onClick={() => void handleClearAction(r)}
                          disabled={pendingActionRow === r.source_row}
                          className="text-xs text-[#013764] hover:underline disabled:opacity-40"
                          title="Roll this row back to undecided — it'll reappear in the pair view"
                        >
                          {pendingActionRow === r.source_row
                            ? "…"
                            : "Clear action"}
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: "tied" | "untied";
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium text-[#717179]">{label}</span>
      <span
        className={cn(
          "text-base font-semibold tabular-nums",
          highlight === "tied" && "text-emerald-700",
          highlight === "untied" && "text-rose-700",
          !highlight && "text-[#303030]",
        )}
      >
        {value}
      </span>
    </div>
  );
}
