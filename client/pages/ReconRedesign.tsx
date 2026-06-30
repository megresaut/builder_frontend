import { useState, useMemo, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useParams, useNavigate } from "react-router-dom";
import QuickBillBatchModal from "@/components/QuickBillBatchModal";
import {
  getReconciliationWorkspace,
  matchReconciliationLine,
  unmatchReconciliationLine,
  setStatementAction,
  batchStatementActions,
  acceptAIBill,
  skipSuggestion,
  fetchAISuggestions,
  fetchBillDetail,
  updateReconciliation,
  finalize as finalizeReconciliation,
  reopen as reopenReconciliation,
  type Workspace,
  type MatchPair,
  type AISuggestion,
  type BillDetail,
  type StatementRow,
  type CreditCardActivityRow,
  type ReconciliationLine,
  type MatchConfidence,
} from "@/data/credit-card-reconciliation";

// ── types ──────────────────────────────────────────────────────────────────
type AnyConf = MatchConfidence | "manual" | "forced";

// ── helpers ────────────────────────────────────────────────────────────────

// Cleans raw backend error strings: replaces underscores with spaces and
// capitalizes the first letter so toasts read naturally.
function cleanErr(e: unknown, fallback: string): string {
  const raw = e instanceof Error ? e.message : fallback;
  return raw.replace(/_/g, " ").replace(/^[a-z]/, c => c.toUpperCase());
}

const fmt = (cents: number) => {
  const neg = cents < 0;
  const s = (Math.abs(cents) / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
  return neg ? "–" + s : s;
};

function fmtDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso + (iso.length === 10 ? "T00:00:00" : ""));
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function qboDisplay(row: CreditCardActivityRow): string {
  return row.vendor || row.memo || row.doc_num || row.txn_type || "—";
}

function qboRowKey(r: CreditCardActivityRow): string {
  if (r.buildium_txn_id) return `b:${r.buildium_txn_id}`;
  if (r.qbo_txn_id) return `q:${r.qbo_txn_id}`;
  return `x:${r.txn_date}:${r.amount_cents}:${r.txn_type}:${r.doc_num ?? ""}:${(r.vendor ?? r.memo ?? "").slice(0, 30)}`;
}

const CONF_LABEL: Record<AnyConf, string> = {
  exact: "Exact", fuzzy_date: "±1 day", strong: "Name + amt",
  possible: "Possible", manual: "Manual", forced: "Force-cleared",
};

// ── style tokens ───────────────────────────────────────────────────────────
const T = {
  bg:       "#F4F6F9",
  surface:  "#FFFFFF",
  border:   "#DCE3EB",
  border2:  "#EBF0F5",
  text:     "#1C2B3A",
  text2:    "#6B7A8D",
  text3:    "#9AAAB8",
  accent:   "#013764",
  accentH:  "#012A4E",
  accentBg: "#EBF2FA",
  good:     "#16A34A",
  goodBg:   "#DCFCE7",
  warn:     "#B45309",
  warnBg:   "#FEF3C7",
  crit:     "#DC2626",
  critBg:   "#FEE2E2",
  purple:   "#7C3AED",
  purpleBg: "#EDE9FE",
  mono:     "ui-monospace, 'Cascadia Code', 'SF Mono', Consolas, monospace",
  sans:     "Geist, -apple-system, Roboto, Helvetica, sans-serif",
  radius:   "4px",
};

function confStyle(c: AnyConf): { background: string; color: string } {
  return ({
    exact:      { background: T.goodBg,   color: T.good   },
    fuzzy_date: { background: T.purpleBg, color: T.purple },
    strong:     { background: T.accentBg, color: T.accent },
    possible:   { background: T.warnBg,   color: T.warn   },
    manual:     { background: T.accentBg, color: T.accent },
    forced:     { background: T.warnBg,   color: T.warn   },
  } as Record<AnyConf, { background: string; color: string }>)[c] || { background: T.border2, color: T.text2 };
}

// ── sub-components ─────────────────────────────────────────────────────────
function Chip({ conf }: { conf: AnyConf }) {
  const s = confStyle(conf);
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "1px 6px", borderRadius: "3px",
      fontSize: 10, fontWeight: 500,
      background: s.background, color: s.color,
      whiteSpace: "nowrap",
    }}>
      {CONF_LABEL[conf]}
    </span>
  );
}

function Btn({ children, variant = "ghost", disabled = false, onClick, style: sx }: {
  children: React.ReactNode; variant?: "ghost" | "primary" | "danger";
  disabled?: boolean; onClick?: () => void; style?: React.CSSProperties;
}) {
  const base: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", gap: 5,
    padding: "4px 11px", borderRadius: T.radius, border: "1px solid",
    fontSize: 12, fontWeight: 500, cursor: disabled ? "not-allowed" : "pointer",
    fontFamily: T.sans, whiteSpace: "nowrap", opacity: disabled ? 0.4 : 1,
    transition: "background 0.1s",
    ...(variant === "ghost"   && { background: T.surface, color: T.text2, borderColor: T.border }),
    ...(variant === "primary" && { background: T.accent,  color: "#fff",  borderColor: T.accent }),
    ...(variant === "danger"  && { background: T.surface, color: T.crit,  borderColor: "#FECACA" }),
    ...sx,
  };
  return <button style={base} disabled={disabled} onClick={onClick}>{children}</button>;
}

// ── collapsible section header ─────────────────────────────────────────────
function SectionHeader({ label, count, collapsed, onToggle, actions, loading }: {
  label: string;
  count?: number;
  collapsed: boolean;
  onToggle: () => void;
  actions?: React.ReactNode;
  loading?: boolean;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px 8px", background: T.border2, borderTop: `1px solid ${T.border}`, cursor: "pointer", userSelect: "none" }} onClick={onToggle}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 10, color: T.text3, transition: "transform .15s", display: "inline-block", transform: collapsed ? "rotate(-90deg)" : "rotate(0deg)" }}>▾</span>
        <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", color: T.text2 }}>
          {label}
        </span>
        {loading ? (
          <span style={{ fontSize: 11, color: T.text3, fontStyle: "italic" }}>loading…</span>
        ) : count !== undefined && (
          <span style={{ fontSize: 11, fontWeight: 600, color: T.text3, background: T.border, borderRadius: 10, padding: "1px 7px" }}>{count}</span>
        )}
      </div>
      {actions && <div onClick={e => e.stopPropagation()}>{actions}</div>}
    </div>
  );
}

// ── bill detail slide-out panel ────────────────────────────────────────────
function BillDetailPanel({ billID, onClose }: { billID: number; onClose: () => void }) {
  const [detail, setDetail] = useState<BillDetail | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setDetail(null); setErr(null);
    fetchBillDetail(billID)
      .then(d => setDetail(d))
      .catch(() => setErr("Failed to load bill details"));
  }, [billID]);

  const fmtAmt = (cents: number) => (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
  const fmtDate = (iso?: string | null) => {
    if (!iso) return null;
    const [y, m, d] = iso.split("-");
    return `${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][+m-1]} ${+d}, ${y}`;
  };

  const source = detail?.qbo_bill_id ? "QuickBooks Online" : detail?.buildium_bill_id ? "Buildium" : "Platform";
  const sourceID = detail?.qbo_bill_id ?? detail?.buildium_bill_id ?? String(detail?.id ?? "");

  const Section = ({ title }: { title: string }) => (
    <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: T.text3, marginBottom: 10, marginTop: 20, paddingBottom: 6, borderBottom: `1px solid ${T.border}` }}>
      {title}
    </div>
  );
  const Field = ({ label, value, mono }: { label: string; value?: string | null; mono?: boolean }) =>
    value ? (
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".07em", color: T.text3, marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 13, color: T.text, fontFamily: mono ? T.mono : T.sans }}>{value}</div>
      </div>
    ) : null;

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.22)", zIndex: 99 }} />
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, width: 460,
        background: "#fff", boxShadow: "-4px 0 32px rgba(0,0,0,.13)",
        zIndex: 100, display: "flex", flexDirection: "column", fontFamily: T.sans,
      }}>
        {/* header */}
        <div style={{ padding: "20px 24px 16px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".09em", color: T.text3, marginBottom: 5 }}>{source}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: T.text }}>Bill #{detail?.id ?? billID}</div>
            {detail && (
              <span style={{
                marginTop: 6, display: "inline-block", fontSize: 11, fontWeight: 600,
                padding: "2px 9px", borderRadius: 10,
                background: detail.status === "paid" ? T.goodBg : T.warnBg,
                color: detail.status === "paid" ? T.good : T.warn,
              }}>
                {detail.status === "paid" ? "Paid" : "Unpaid"}
              </span>
            )}
          </div>
          <button onClick={onClose} style={{ border: "none", background: "none", fontSize: 20, color: T.text3, cursor: "pointer", padding: 4, marginTop: 2 }}>✕</button>
        </div>

        {/* body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "4px 24px 32px" }}>
          {!detail && !err && (
            <div style={{ color: T.text3, fontSize: 13, textAlign: "center", paddingTop: 48 }}>Loading…</div>
          )}
          {err && (
            <div style={{ color: T.crit, fontSize: 13, padding: "16px 0" }}>{err}</div>
          )}
          {detail && (
            <>
              {/* Amount prominent */}
              <div style={{ marginTop: 20, marginBottom: 4 }}>
                <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".07em", color: T.text3, marginBottom: 3 }}>Total</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: T.accent, fontFamily: T.mono }}>{fmtAmt(detail.amount_cents)}</div>
              </div>

              <Section title="Bill Details" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
                <Field label="Date" value={fmtDate(detail.statement_date)} />
                <Field label="Due Date" value={fmtDate(detail.due_date)} />
                {detail.period_start && <Field label="Period Start" value={fmtDate(detail.period_start)} />}
                {detail.period_end && <Field label="Period End" value={fmtDate(detail.period_end)} />}
                <Field label="Invoice #" value={detail.invoice_number} />
                <Field label="Source" value={detail.source} />
              </div>
              {detail.memo && <Field label="Memo" value={detail.memo} />}
              {detail.work_order_refs && <Field label="Work Order Refs" value={detail.work_order_refs} />}

              {/* Vendor section */}
              {detail.vendor_name && (
                <>
                  <Section title="Vendor" />
                  <Field label="Name" value={detail.vendor_name} />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
                    <Field label="Email" value={detail.vendor_email} />
                    <Field label="Phone" value={detail.vendor_phone} />
                  </div>
                  <Field label="Address" value={detail.vendor_address} />
                  {detail.vendor_notes && <Field label="Notes" value={detail.vendor_notes} />}
                </>
              )}

              {/* Property section */}
              {detail.property_name && (
                <>
                  <Section title="Property" />
                  <Field label="Name" value={detail.property_name} />
                  {detail.property_address && (
                    <Field label="Address" value={[detail.property_address, detail.property_city, detail.property_state].filter(Boolean).join(", ")} />
                  )}
                </>
              )}

              {/* Payment section */}
              {(detail.paid_by_account || detail.paid_doc_number || detail.paid_on || detail.paid_memo) && (
                <>
                  <Section title="Payment" />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
                    <Field label="Paid On" value={fmtDate(detail.paid_on)} />
                    <Field label="Account" value={detail.paid_by_account} />
                    <Field label="Check / Doc #" value={detail.paid_doc_number} />
                  </div>
                  <Field label="Payment Memo" value={detail.paid_memo} />
                </>
              )}

              {/* Line items */}
              {detail.line_items.length > 0 && (
                <>
                  <Section title="Line Items" />
                  <div style={{ border: `1px solid ${T.border}`, borderRadius: T.radius, overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: T.border2 }}>
                          <th style={{ padding: "7px 12px", textAlign: "left", fontWeight: 600, color: T.text2, fontSize: 11 }}>Description</th>
                          <th style={{ padding: "7px 12px", textAlign: "right", fontWeight: 600, color: T.text2, fontSize: 11 }}>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detail.line_items.map((li, i) => (
                          <tr key={i} style={{ borderTop: `1px solid ${T.border}` }}>
                            <td style={{ padding: "8px 12px", color: T.text }}>{li.description || "—"}</td>
                            <td style={{ padding: "8px 12px", textAlign: "right", fontFamily: T.mono, color: T.text }}>{fmtAmt(li.amount_cents)}</td>
                          </tr>
                        ))}
                        <tr style={{ borderTop: `2px solid ${T.border}`, background: T.border2 }}>
                          <td style={{ padding: "8px 12px", fontWeight: 600, color: T.text }}>Total</td>
                          <td style={{ padding: "8px 12px", textAlign: "right", fontFamily: T.mono, fontWeight: 700, color: T.accent }}>{fmtAmt(detail.amount_cents)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              <div style={{ marginTop: 28, fontSize: 11, color: T.text3 }}>
                Source: {source} · ID {sourceID}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ── AI bill slim panel (for bills with no platform row) ────────────────────
function AISuggBillPanel({ sugg, onClose }: { sugg: AISuggestion; onClose: () => void }) {
  const fmtAmt = (cents: number) => (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
  const fmtDate = (iso?: string | null) => {
    if (!iso) return null;
    const [y, m, d] = iso.split("-");
    return `${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][+m-1]} ${+d}, ${y}`;
  };
  const sourceLabel = sugg.bill_source === "qbo" ? "QuickBooks Online" : "Buildium";
  const Field = ({ label, value, mono }: { label: string; value?: string | null; mono?: boolean }) =>
    value ? (
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: ".07em", color: T.text3, marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 13, color: T.text, fontFamily: mono ? T.mono : T.sans }}>{value}</div>
      </div>
    ) : null;
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.22)", zIndex: 99 }} />
      <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 420, background: "#fff", boxShadow: "-4px 0 32px rgba(0,0,0,.13)", zIndex: 100, display: "flex", flexDirection: "column", fontFamily: T.sans }}>
        <div style={{ padding: "20px 24px 16px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: ".09em", color: T.text3, marginBottom: 5 }}>{sourceLabel} Bill</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: T.text }}>{sugg.bill_vendor || `Bill ${sugg.bill_external_id}`}</div>
            <div style={{ marginTop: 6, fontSize: 18, fontFamily: T.mono, fontWeight: 600, color: T.text }}>{fmtAmt(sugg.bill_amount_cents)}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, color: T.text3, cursor: "pointer", padding: 4 }}>✕</button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
          <Field label="Bill Date" value={fmtDate(sugg.bill_date)} />
          <Field label={`${sourceLabel} ID`} value={sugg.bill_external_id} mono />
          {sugg.bill_vendor && <Field label="Vendor" value={sugg.bill_vendor} />}
          {sugg.reasoning && <Field label="AI Match Reasoning" value={sugg.reasoning} />}
          <div style={{ marginTop: 20, padding: 12, background: T.bg, borderRadius: T.radius, fontSize: 12, color: T.text3 }}>
            This bill exists only in {sourceLabel}. Full details are available directly in that system.
          </div>
        </div>
      </div>
    </>
  );
}

// ── suggestion row ──────────────────────────────────────────────────────────
// ── AI suggestion row (statement ↔ unpaid bill) ─────────────────────────────
function AISuggRow({ sugg, onAccept, onBillClick, onSuggClick, loading }: {
  sugg: AISuggestion;
  onAccept: () => void;
  onBillClick?: (billID: number) => void;  // for platform bills
  onSuggClick?: (sugg: AISuggestion) => void; // for source-only bills
  loading?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const [billHovered, setBillHovered] = useState(false);
  const { statement_row: stmt, confidence } = sugg;
  // Platform bills (bill_id > 0) open the full BillDetailPanel.
  // Source-only bills open the slim AISuggBillPanel.
  const handleBillClick = () => {
    if (sugg.bill_id && sugg.bill_id > 0 && onBillClick) {
      onBillClick(sugg.bill_id);
    } else if (onSuggClick) {
      onSuggClick(sugg);
    }
  };

  const confColor = confidence === "high"
    ? { bg: T.goodBg, text: T.good }
    : confidence === "medium"
    ? { bg: T.accentBg, text: T.accent }
    : { bg: T.warnBg, text: T.warn };
  const confLabel = confidence === "high" ? "High" : confidence === "medium" ? "Medium" : "Low";

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "#fff", border: `1px solid ${T.border}`, borderRadius: T.radius,
        display: "grid", gridTemplateColumns: "1fr 72px 1fr auto", alignItems: "center",
        overflow: "hidden", opacity: loading ? 0.5 : 1,
      }}
    >
      {/* statement side */}
      <div style={{ padding: "10px 14px", borderRight: `1px solid ${T.border2}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ fontSize: 13, color: T.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{stmt.description}</div>
          {stmt.card_member && (
            <span style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", borderRadius: 3, padding: "1px 6px", fontSize: 10, fontWeight: 500, background: "#E0F2FE", color: "#0369A1", border: "1px solid #BAE6FD", whiteSpace: "nowrap" }}>
              {stmt.card_member}
            </span>
          )}
        </div>
        <div style={{ fontSize: 11, color: T.text3, marginTop: 1 }}>{fmtDate(stmt.date)} · row {stmt.source_row}</div>
        <div style={{ fontFamily: T.mono, fontSize: 13, fontWeight: 600, marginTop: 3 }}>{fmt(stmt.amount_cents)}</div>
      </div>
      {/* connector */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, padding: "8px 4px", background: T.bg, borderLeft: `1px solid ${T.border2}`, borderRight: `1px solid ${T.border2}` }}>
        <span style={{ display: "inline-flex", alignItems: "center", padding: "1px 6px", borderRadius: 3, fontSize: 10, fontWeight: 600, background: confColor.bg, color: confColor.text, whiteSpace: "nowrap" }}>
          {confLabel}
        </span>
        <span style={{ color: T.text3, fontSize: 11, marginTop: 1 }}>bill</span>
        <span style={{ color: T.text3, fontSize: 14 }}>↔</span>
      </div>
      {/* bill side — always clickable, routes to platform panel or slim panel */}
      <div
        onClick={handleBillClick}
        onMouseEnter={() => setBillHovered(true)}
        onMouseLeave={() => setBillHovered(false)}
        style={{
          padding: "10px 14px", borderLeft: `1px solid ${T.border2}`,
          cursor: "pointer",
          background: billHovered ? T.accentBg : "transparent",
          transition: "background .12s",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ fontSize: 13, color: billHovered ? T.accent : T.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontWeight: billHovered ? 500 : 400 }}>
            {sugg.bill_vendor || `Bill ${sugg.bill_external_id}`}
          </div>
          <span style={{
            flexShrink: 0, display: "inline-flex", alignItems: "center", borderRadius: 3,
            padding: "1px 6px", fontSize: 10, fontWeight: 600,
            background: sugg.bill_source === "qbo" ? "#EDE9FE" : "#DBEAFE",
            color: sugg.bill_source === "qbo" ? "#6D28D9" : "#1D4ED8",
            border: `1px solid ${sugg.bill_source === "qbo" ? "#C4B5FD" : "#BFDBFE"}`,
          }}>
            {sugg.bill_source === "qbo" ? "QBO" : "Buildium"}
          </span>
          {billHovered && <span style={{ fontSize: 10, color: T.accent, flexShrink: 0 }}>View ↗</span>}
        </div>
        <div style={{ fontSize: 11, color: T.text3, marginTop: 1 }}>{fmtDate(sugg.bill_date)} · {sugg.bill_source} #{sugg.bill_external_id}</div>
        <div style={{ fontFamily: T.mono, fontSize: 13, fontWeight: 600, marginTop: 3 }}>{fmt(sugg.bill_amount_cents)}</div>
        {sugg.reasoning && (
          <div style={{ fontSize: 11, color: T.text2, marginTop: 3, fontStyle: "italic" }}>{sugg.reasoning}</div>
        )}
      </div>
      {/* actions */}
      <div style={{ padding: "0 12px", display: "flex", gap: 6, alignItems: "center", opacity: hovered ? 1 : 0.5, transition: "opacity 0.1s" }}>
        <Btn variant="primary" onClick={onAccept} disabled={loading}>Accept & Pay</Btn>
      </div>
    </div>
  );
}

function SuggRow({ pair, onAccept, onSkip, loading }: {
  pair: MatchPair;
  onAccept: () => void;
  onSkip: () => void;
  loading?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const { statement: stmt, qbo, confidence } = pair;
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "#fff", border: `1px solid ${T.border}`, borderRadius: T.radius,
        display: "grid", gridTemplateColumns: "1fr 56px 1fr auto", alignItems: "center",
        overflow: "hidden", opacity: loading ? 0.5 : 1,
      }}
    >
      {/* statement side */}
      <div style={{ padding: "10px 14px", borderRight: `1px solid ${T.border2}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ fontSize: 13, color: T.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{stmt.description}</div>
          {stmt.card_member && (
            <span style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", borderRadius: 3, padding: "1px 6px", fontSize: 10, fontWeight: 500, background: "#E0F2FE", color: "#0369A1", border: "1px solid #BAE6FD", whiteSpace: "nowrap" }}>
              {stmt.card_member}
            </span>
          )}
        </div>
        <div style={{ fontSize: 11, color: T.text3, marginTop: 1 }}>{fmtDate(stmt.date)} · row {stmt.source_row}</div>
        <div style={{ fontFamily: T.mono, fontSize: 13, fontWeight: 600, marginTop: 3 }}>{fmt(stmt.amount_cents)}</div>
      </div>
      {/* connector */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, padding: "8px 4px", background: T.bg, borderLeft: `1px solid ${T.border2}`, borderRight: `1px solid ${T.border2}` }}>
        <Chip conf={confidence} />
        <span style={{ color: T.text3, fontSize: 14 }}>↔</span>
      </div>
      {/* qbo side */}
      <div style={{ padding: "10px 14px", borderLeft: `1px solid ${T.border2}` }}>
        <div style={{ fontSize: 13, color: T.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{qboDisplay(qbo)}</div>
        <div style={{ fontSize: 11, color: T.text3, marginTop: 1 }}>{fmtDate(qbo.txn_date)} · {qbo.txn_type}</div>
        <div style={{ fontFamily: T.mono, fontSize: 13, fontWeight: 600, marginTop: 3 }}>{fmt(qbo.amount_cents)}</div>
      </div>
      {/* actions */}
      <div style={{ padding: "0 12px", display: "flex", gap: 6, alignItems: "center", opacity: hovered ? 1 : 0.5, transition: "opacity 0.1s" }}>
        <Btn variant="primary" onClick={onAccept} disabled={loading}>Accept</Btn>
        <Btn onClick={onSkip} disabled={loading}>Skip</Btn>
      </div>
    </div>
  );
}

// ── main component ─────────────────────────────────────────────────────────
export default function ReconRedesign() {
  const { recId } = useParams<{ recId: string }>();
  const navigate = useNavigate();
  const recID = Number(recId);

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // AI bill-match suggestions (on-demand, stored for the session).
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[] | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiCached, setAiCached] = useState(false);

  const [skippedKeys, setSkippedKeys] = useState<Set<string>>(new Set());

  const [tab, setTab] = useState<"suggestions" | "pair" | "cleared">("suggestions");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const toggleSection = (key: string) => setCollapsed(prev => ({ ...prev, [key]: !prev[key] }));
  const [search, setSearch] = useState("");
  const [billPanelID, setBillPanelID] = useState<number | null>(null);
  const [aiSuggPanel, setAiSuggPanel] = useState<AISuggestion | null>(null);
  const [showEditRec, setShowEditRec] = useState(false);
  const [editRecSaving, setEditRecSaving] = useState(false);
  const [quickBillRows, setQuickBillRows] = useState<StatementRow[]>([]);

  // pair tab selection
  const [selStmt, setSelStmt] = useState<StatementRow | null>(null);
  // Multi-select: one statement row can be paired against multiple QBO/Buildium txns (split payments).
  const [selQboSet, setSelQboSet] = useState<CreditCardActivityRow[]>([]);
  const toggleSelQbo = (r: CreditCardActivityRow) => {
    const key = qboRowKey(r);
    setSelQboSet(prev => prev.some(s => qboRowKey(s) === key) ? prev.filter(s => qboRowKey(s) !== key) : [...prev, r]);
  };

  const loadWorkspace = useCallback(async () => {
    try {
      const ws = await getReconciliationWorkspace(recID);
      setWorkspace(ws);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load workspace");
    } finally {
      setLoading(false);
    }
  }, [recID]);

  useEffect(() => { loadWorkspace(); }, [loadWorkspace]);

  // Auto-run AI matching once per workspace load when a statement is present.
  // Fires after the workspace loads so we have the statement row count available.
  // The user can also manually refresh via the button.
  useEffect(() => {
    if (workspace && workspace.statement_rows.length > 0 && aiSuggestions === null && !aiLoading) {
      runAISuggest();
    }
    // Only re-run when workspace first becomes available, not on every reload.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace !== null]);

  // derived
  const pairKey = (p: MatchPair) => `${p.statement.source_row}|${p.qbo.qbo_txn_id ?? ""}`;
  const autoSugg = useMemo(() =>
    (workspace?.suggestions ?? []).filter(s => s.confidence !== "possible" && !skippedKeys.has(pairKey(s))),
    [workspace, skippedKeys]);
  const reviewSugg = useMemo(() =>
    (workspace?.suggestions ?? []).filter(s => s.confidence === "possible" && !skippedKeys.has(pairKey(s))),
    [workspace, skippedKeys]);

  const q = search.trim().toLowerCase();

  const visStmt = useMemo(() => {
    const rows = workspace?.unmatched_statement ?? [];
    if (!q) return rows;
    return rows.filter(r =>
      r.description.toLowerCase().includes(q) ||
      r.date.includes(q) ||
      String(Math.abs(r.amount_cents) / 100).includes(q)
    );
  }, [workspace, q]);

  const visQbo = useMemo(() => {
    const rows = workspace?.unmatched_qbo ?? [];
    if (!q) return rows;
    return rows.filter(r =>
      qboDisplay(r).toLowerCase().includes(q) ||
      r.txn_date.includes(q) ||
      String(Math.abs(r.amount_cents) / 100).includes(q)
    );
  }, [workspace, q]);

  const visCleared = useMemo(() => {
    const lines = workspace?.matched_lines ?? [];
    if (!q) return lines;
    return lines.filter(l =>
      (l.statement_row?.description ?? "").toLowerCase().includes(q) ||
      (l.qbo_vendor ?? "").toLowerCase().includes(q) ||
      l.txn_date.includes(q)
    );
  }, [workspace, q]);

  const visAutoSugg = useMemo(() => {
    if (!q) return autoSugg;
    return autoSugg.filter(s =>
      s.statement.description.toLowerCase().includes(q) ||
      qboDisplay(s.qbo).toLowerCase().includes(q)
    );
  }, [autoSugg, q]);

  const visReviewSugg = useMemo(() => {
    if (!q) return reviewSugg;
    return reviewSugg.filter(s =>
      s.statement.description.toLowerCase().includes(q) ||
      qboDisplay(s.qbo).toLowerCase().includes(q)
    );
  }, [reviewSugg, q]);

  // Source rows already handled by confident/needs-review or accepted into matched_lines.
  // Used to filter AI suggestions so cached results don't re-show already-matched rows.
  const alreadyMatchedRows = useMemo(() => {
    const set = new Set<number>();
    for (const s of workspace?.suggestions ?? []) set.add(s.statement.source_row);
    for (const l of workspace?.matched_lines ?? []) {
      if (l.statement_row) set.add(l.statement_row.source_row);
    }
    return set;
  }, [workspace]);

  const visAiSugg = useMemo(() => {
    if (!aiSuggestions) return aiSuggestions;
    const filtered = aiSuggestions.filter(s => !alreadyMatchedRows.has(s.statement_row.source_row));
    if (!q) return filtered;
    return filtered.filter(s =>
      s.statement_row.description.toLowerCase().includes(q) ||
      (s.bill_vendor ?? "").toLowerCase().includes(q)
    );
  }, [aiSuggestions, q, alreadyMatchedRows]);

  async function acceptSugg(pair: MatchPair) {
    const key = pairKey(pair);
    setSkippedKeys(prev => new Set(prev).add(key));
    try {
      await matchReconciliationLine(recID, {
        source_system: pair.qbo.source,
        qbo_txn_type: pair.qbo.txn_type,
        qbo_txn_id: pair.qbo.source === "buildium"
          ? (pair.qbo.buildium_txn_id ?? pair.qbo.qbo_txn_id ?? "")
          : (pair.qbo.qbo_txn_id ?? ""),
        txn_date: pair.qbo.txn_date,
        amount_cents: pair.qbo.amount_cents,
        statement_row: pair.statement,
        match_confidence: pair.confidence,
      });
      loadWorkspace(); // background
    } catch (e) {
      setSkippedKeys(prev => { const s = new Set(prev); s.delete(key); return s; });
      toast.error(cleanErr(e, "Accept failed"));
    }
  }

  async function acceptAllAuto() {
    setActionLoading(true);
    try {
      for (const pair of autoSugg) {
        await matchReconciliationLine(recID, {
          source_system: pair.qbo.source,
          qbo_txn_type: pair.qbo.txn_type,
          qbo_txn_id: pair.qbo.source === "buildium"
            ? (pair.qbo.buildium_txn_id ?? pair.qbo.qbo_txn_id ?? "")
            : (pair.qbo.qbo_txn_id ?? ""),
          txn_date: pair.qbo.txn_date,
          amount_cents: pair.qbo.amount_cents,
          statement_row: pair.statement,
          match_confidence: pair.confidence,
        });
      }
      await loadWorkspace();
    } catch (e) {
      toast.error(cleanErr(e, "Accept all failed"));
    } finally {
      setActionLoading(false);
    }
  }

  async function doPair() {
    if (!selStmt || selQboSet.length === 0) return;
    // Optimistic: clear selections immediately so the pair bar disappears.
    const pairedStmt = selStmt;
    const pairedSet = selQboSet;
    const pairedKeys = new Set(pairedSet.map(qboRowKey));
    setSelStmt(null);
    setSelQboSet([]);
    // Optimistic: remove the paired rows from workspace so they vanish instantly.
    setWorkspace(ws => ws ? {
      ...ws,
      unmatched_statement: ws.unmatched_statement.filter(r => r.source_row !== pairedStmt.source_row),
      unmatched_qbo: ws.unmatched_qbo.filter(r => !pairedKeys.has(qboRowKey(r))),
    } : ws);
    try {
      // Pair each selected QBO/Buildium transaction to the same statement row sequentially.
      for (const qbo of pairedSet) {
        await matchReconciliationLine(recID, {
          source_system: qbo.source,
          qbo_txn_type: qbo.txn_type,
          qbo_txn_id: qbo.source === "buildium"
            ? (qbo.buildium_txn_id ?? "")
            : (qbo.qbo_txn_id ?? ""),
          txn_date: qbo.txn_date,
          amount_cents: qbo.amount_cents,
          statement_row: pairedStmt,
          match_confidence: "manual",
        });
      }
      loadWorkspace(); // background sync
    } catch (e) {
      toast.error(cleanErr(e, "Pair failed"));
      loadWorkspace(); // rollback via full reload
    }
  }

  async function doUnmatch(line: ReconciliationLine) {
    // Optimistic: remove the line immediately so the row vanishes in Cleared.
    setWorkspace(ws => ws ? {
      ...ws,
      matched_lines: ws.matched_lines.filter(l => l.id !== line.id),
    } : ws);
    try {
      await unmatchReconciliationLine(recID, line.id);
      loadWorkspace(); // background sync
    } catch (e) {
      toast.error(cleanErr(e, "Unmatch failed"));
      loadWorkspace(); // rollback via full reload
    }
  }

  async function doDefer(row: StatementRow) {
    // Optimistic: move from unmatched_statement to resolved_statement immediately.
    setWorkspace(ws => ws ? {
      ...ws,
      unmatched_statement: ws.unmatched_statement.filter(r => r.source_row !== row.source_row),
      resolved_statement: [...(ws.resolved_statement ?? []), { ...row, action: "defer" as const }],
    } : ws);
    try {
      await setStatementAction(recID, { source_row: row.source_row, action: "defer" });
      loadWorkspace(); // background sync
    } catch (e) {
      toast.error(cleanErr(e, "Defer failed"));
      loadWorkspace(); // rollback via full reload
    }
  }

  async function deferAll() {
    const rows = workspace?.unmatched_statement ?? [];
    if (rows.length === 0) return;
    setWorkspace(ws => ws ? {
      ...ws,
      unmatched_statement: [],
      resolved_statement: [...(ws.resolved_statement ?? []), ...rows.map(r => ({ ...r, action: "defer" as const }))],
    } : ws);
    try {
      // Single atomic read-modify-write on the backend — no JSONB clobber race.
      await batchStatementActions(recID, rows.map(r => ({ source_row: r.source_row, action: "defer" })));
    } catch (e) {
      toast.error(cleanErr(e, "Defer all failed"));
    }
    loadWorkspace();
  }

  const [finalizing, setFinalizing] = useState(false);
  async function handleFinalize() {
    if (finalizing) return;
    setFinalizing(true);
    try {
      await finalizeReconciliation(recID);
      loadWorkspace();
    } catch (e) {
      toast.error(cleanErr(e, "Finalize failed"));
    } finally {
      setFinalizing(false);
    }
  }

  const [reopening, setReopening] = useState(false);
  async function handleReopen() {
    if (!window.confirm("Reopen this reconciliation for editing?")) return;
    setReopening(true);
    try {
      await reopenReconciliation(recID, "Reopened for editing");
      loadWorkspace();
    } catch (e) {
      toast.error(cleanErr(e, "Reopen failed"));
    } finally {
      setReopening(false);
    }
  }

  async function undoDefer(row: StatementRow) {
    // Optimistic: move back to unmatched_statement immediately.
    setWorkspace(ws => ws ? {
      ...ws,
      resolved_statement: (ws.resolved_statement ?? []).filter(r => r.source_row !== row.source_row),
      unmatched_statement: [...ws.unmatched_statement, { ...row, action: undefined, action_note: undefined, action_by_user_id: undefined, action_at: undefined }],
    } : ws);
    try {
      await setStatementAction(recID, { source_row: row.source_row, action: "clear" });
      loadWorkspace(); // background sync
    } catch (e) {
      toast.error(cleanErr(e, "Undo defer failed"));
      loadWorkspace(); // rollback
    }
  }

  async function runAISuggest(force = false) {
    setAiLoading(true);
    setAiError(null);
    try {
      // Pass source_rows from confident + needs-review suggestions so the backend
      // skips them — those rows already have a QBO/Buildium match candidate.
      const excludeSourceRows = (workspace?.suggestions ?? []).map(s => s.statement.source_row);
      const { suggestions, cached } = await fetchAISuggestions(recID, 30, force, excludeSourceRows);
      setAiSuggestions(suggestions);
      setAiCached(cached);
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "AI matching failed");
    } finally {
      setAiLoading(false);
    }
  }

  async function acceptAISugg(s: AISuggestion) {
    setActionLoading(true);
    try {
      await acceptAIBill(recID, {
        statement_row: s.statement_row,
        bill_source: s.bill_source,
        bill_external_id: s.bill_external_id,
        bill_id: s.bill_id,
        qbo_vendor_id: s.qbo_vendor_id,
        bill_amount_cents: s.bill_amount_cents,
      });
      // Remove from local AI suggestions list; workspace reload will show it in Cleared.
      setAiSuggestions(prev => prev?.filter(x => x.statement_row.source_row !== s.statement_row.source_row) ?? null);
      await loadWorkspace();
    } catch (e) {
      toast.error(cleanErr(e, "Accept failed"));
    } finally {
      setActionLoading(false);
    }
  }

  async function skipSugg(pair: MatchPair) {
    const txnID = pair.qbo.qbo_txn_id ?? "";
    const key = pairKey(pair);
    // Optimistic: hide immediately, persist + reload in background.
    setSkippedKeys(prev => new Set(prev).add(key));
    try {
      await skipSuggestion(recID, pair.statement.source_row, txnID);
      loadWorkspace(); // background — don't await
    } catch (e) {
      // Rollback optimistic update on failure.
      setSkippedKeys(prev => { const s = new Set(prev); s.delete(key); return s; });
      toast.error(cleanErr(e, "Skip failed"));
    }
  }

  // math
  const rec = workspace?.reconciliation;
  const beginCents = rec?.beginning_balance_cents ?? 0;
  const clearedCents = workspace?.cleared_total_cents ?? 0;
  const computedCents = beginCents + clearedCents;
  const endingCents = rec?.ending_balance_cents ?? 0;
  const diffCents = workspace?.difference_cents ?? 0;

  const sugTotal = (workspace?.suggestions ?? []).length;
  const stmtUnmatched = workspace?.unmatched_statement.length ?? 0;
  const qboUnmatched = workspace?.unmatched_qbo.length ?? 0;
  const pairBarVisible = selStmt !== null && selQboSet.length > 0;



  const HEADER_H = 52, MATH_H = 68, TAB_H = 40;
  const contentH = `calc(100vh - ${HEADER_H + MATH_H + TAB_H}px)`;

  // ── loading / error ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: T.sans, color: T.text2 }}>
        Loading reconciliation…
      </div>
    );
  }

  if (error && !workspace) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: T.sans, gap: 12 }}>
        <div style={{ color: T.crit }}>{error}</div>
        <Btn onClick={() => { setError(null); setLoading(true); loadWorkspace(); }}>Retry</Btn>
      </div>
    );
  }

  if (!workspace) return null;

  const status = rec?.status ?? "in_progress";
  const statusLabel = status === "finalized" ? "Finalized" : status === "needs_review" ? "Needs review" : "In progress";
  const statusStyle: React.CSSProperties = status === "finalized"
    ? { background: T.goodBg, color: T.good, border: `1px solid #A7F3D0` }
    : status === "needs_review"
    ? { background: T.critBg, color: T.crit, border: `1px solid #FECACA` }
    : { background: T.warnBg, color: T.warn, border: `1px solid #FDE68A` };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden", fontFamily: T.sans, fontSize: 13, color: T.text, background: T.bg, WebkitFontSmoothing: "antialiased" }}>
      {billPanelID !== null && (
        <BillDetailPanel billID={billPanelID} onClose={() => setBillPanelID(null)} />
      )}
      {aiSuggPanel !== null && (
        <AISuggBillPanel sugg={aiSuggPanel} onClose={() => setAiSuggPanel(null)} />
      )}
      <QuickBillBatchModal
        open={quickBillRows.length > 0}
        onOpenChange={open => { if (!open) setQuickBillRows([]); }}
        reconciliationID={recID}
        rows={quickBillRows}
        onDone={() => { setQuickBillRows([]); loadWorkspace(); }}
      />

      {/* ── EDIT RECONCILIATION MODAL ── */}
      {showEditRec && rec && (() => {
        const centsToStr = (c: number) => (c / 100).toFixed(2);
        const strToCents = (s: string) => Math.round(parseFloat(s.replace(/,/g, "")) * 100);
        let startVal = rec.period_start;
        let endVal = rec.period_end;
        let beginVal = centsToStr(rec.beginning_balance_cents);
        let endingVal = centsToStr(rec.ending_balance_cents);
        let notesVal = rec.notes ?? "";

        const overlay = { position: "fixed" as const, inset: 0, background: "rgba(0,0,0,.65)", zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center" };
        const box = { background: T.surface, borderRadius: 10, padding: 28, width: 480, boxShadow: "0 8px 32px rgba(0,0,0,.28)", display: "flex", flexDirection: "column" as const, gap: 16 };
        const row = { display: "flex", flexDirection: "column" as const, gap: 5 };
        const lbl = { fontSize: 11, textTransform: "uppercase" as const, letterSpacing: ".06em", color: T.text3, fontWeight: 500, whiteSpace: "nowrap" as const };
        const inp = { background: T.bg, border: `1px solid ${T.border}`, borderRadius: 6, padding: "7px 10px", fontSize: 13, color: T.text, fontFamily: T.sans, width: "100%", boxSizing: "border-box" as const };
        const twoCol = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, alignItems: "start" };

        const handleSave = async () => {
          setEditRecSaving(true);
          try {
            await updateReconciliation(recID, {
              period_start: startVal,
              period_end: endVal,
              beginning_balance_cents: strToCents(beginVal),
              ending_balance_cents: strToCents(endingVal),
              notes: notesVal || undefined,
            });
            setShowEditRec(false);
            loadWorkspace();
          } catch (e) {
            toast.error(cleanErr(e, "Save failed"));
          } finally {
            setEditRecSaving(false);
          }
        };

        return (
          <div style={overlay} onClick={e => { if (e.target === e.currentTarget) setShowEditRec(false); }}>
            <div style={box}>
              <span style={{ fontWeight: 600, fontSize: 15 }}>Edit reconciliation</span>
              <div style={twoCol}>
                <div style={row}>
                  <label style={lbl}>Period start</label>
                  <input type="date" defaultValue={startVal} style={inp} onChange={e => { startVal = e.target.value; }} />
                </div>
                <div style={row}>
                  <label style={lbl}>Period end</label>
                  <input type="date" defaultValue={endVal} style={inp} onChange={e => { endVal = e.target.value; }} />
                </div>
              </div>
              <div style={twoCol}>
                <div style={row}>
                  <label style={lbl}>Beginning balance ($)</label>
                  <input type="text" defaultValue={beginVal} style={inp} onChange={e => { beginVal = e.target.value; }} />
                </div>
                <div style={row}>
                  <label style={lbl}>Ending balance ($)</label>
                  <input type="text" defaultValue={endingVal} style={inp} onChange={e => { endingVal = e.target.value; }} />
                </div>
              </div>
              <div style={row}>
                <label style={lbl}>Notes</label>
                <input type="text" defaultValue={notesVal} style={inp} onChange={e => { notesVal = e.target.value; }} />
              </div>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
                <Btn onClick={() => setShowEditRec(false)}>Cancel</Btn>
                <Btn variant="primary" onClick={handleSave} disabled={editRecSaving}>{editRecSaving ? "Saving…" : "Save"}</Btn>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── HEADER ── */}
      <header style={{ height: HEADER_H, flexShrink: 0, background: T.surface, borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <a href="/reconciliation" style={{ color: T.text2, textDecoration: "none", fontSize: 12 }}>← Reconciliation</a>
          <div style={{ width: 1, height: 18, background: T.border }} />
          <span style={{ fontWeight: 600, fontSize: 14 }}>{workspace.account.qbo_name}</span>
          <span style={{ color: T.text2, fontSize: 12 }}>
            {fmtDate(rec?.period_start ?? "")} – {fmtDate(rec?.period_end ?? "")}
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 500, ...statusStyle }}>
            {statusLabel}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {status === "in_progress" && <Btn onClick={() => setShowEditRec(true)}>Edit</Btn>}
          <Btn>↑ Replace statement</Btn>
          <Btn onClick={() => navigate(`/reconciliations/${recID}/report`)}>View report</Btn>
          {status === "finalized" ? (
            <Btn onClick={handleReopen} disabled={reopening}>
              {reopening ? "Reopening…" : "Reopen"}
            </Btn>
          ) : (
            <span title={stmtUnmatched > 0 ? `${stmtUnmatched} statement rows still need a decision` : diffCents !== 0 ? "Difference must be $0" : ""}>
              <Btn variant="primary" onClick={handleFinalize} disabled={status !== "in_progress" || diffCents !== 0 || stmtUnmatched > 0 || finalizing}>
                {finalizing ? "Finalizing…" : "Finalize"}
              </Btn>
            </span>
          )}
        </div>
      </header>

      {/* ── MATH BAR ── */}
      <div style={{ height: MATH_H, flexShrink: 0, background: T.surface, borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px" }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          {([
            { label: "Beginning balance", amount: fmt(beginCents) },
            { op: "+" as const },
            { label: "Cleared", amount: fmt(clearedCents) },
            { op: "=" as const },
            { label: "Computed ending", amount: fmt(computedCents) },
            { op: "vs" as const },
            { label: "Statement ending", amount: fmt(endingCents) },
          ] as Array<{ label: string; amount: string } | { op: string }>).map((item, i) => "op" in item ? (
            <span key={i} style={{ color: T.border, fontSize: 18, fontWeight: 300, padding: "0 8px", alignSelf: "flex-end", marginBottom: 6 }}>{item.op}</span>
          ) : (
            <div key={i} style={{ display: "flex", flexDirection: "column", padding: "0 16px" }}>
              <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: ".06em", color: T.text3, fontWeight: 500 }}>{item.label}</span>
              <span style={{ fontFamily: T.mono, fontSize: 17, fontWeight: 600, marginTop: 1 }}>{item.amount}</span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", borderLeft: `1px solid ${T.border}`, paddingLeft: 24 }}>
          <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: ".06em", color: T.text3, fontWeight: 500 }}>Difference</span>
          <span style={{ fontFamily: T.mono, fontSize: 26, fontWeight: 700, color: diffCents === 0 ? T.good : T.crit, lineHeight: 1.1 }}>
            {diffCents === 0 ? "Balanced ✓" : fmt(diffCents)}
          </span>
          {stmtUnmatched > 0 && (
            <span style={{ fontSize: 11, color: T.warn, marginTop: 1 }}>{stmtUnmatched} unmatched stmt rows</span>
          )}
        </div>
      </div>


      {/* ── TAB BAR ── */}
      <nav style={{ height: TAB_H, flexShrink: 0, background: T.bg, borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "stretch", padding: "0 20px" }}>
        {(["suggestions", "pair", "cleared"] as const).map(t => {
          const label = t === "suggestions" ? "Suggestions" : t === "pair" ? "Pair" : "Cleared";
          const count = t === "suggestions"
            ? (sugTotal > 0 ? sugTotal : "✓")
            : t === "pair"
            ? `${stmtUnmatched} stmt · ${qboUnmatched} txns`
            : workspace.matched_lines.length;
          const active = tab === t;
          return (
            <button key={t} onClick={() => { setTab(t); setSearch(""); }} style={{
              display: "inline-flex", alignItems: "center", gap: 6, padding: "0 16px",
              fontSize: 12, fontWeight: 500, background: "none", border: "none",
              borderBottom: `2px solid ${active ? T.accent : "transparent"}`,
              color: active ? T.accent : T.text2, cursor: "pointer", whiteSpace: "nowrap",
              marginBottom: -1,
            }}>
              {label}
              <span style={{
                fontSize: 11, fontWeight: 400, padding: "1px 6px", borderRadius: 8,
                background: active ? T.accentBg : T.border2,
                color: active ? T.accent : T.text3,
              }}>{count}</span>
            </button>
          );
        })}
        <div style={{ flex: 1 }} />
        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Filter rows…"
          style={{
            alignSelf: "center", height: 26, border: `1px solid ${T.border}`, borderRadius: T.radius,
            padding: "0 10px", fontSize: 12, color: T.text, background: T.surface, outline: "none", width: 160,
            fontFamily: T.sans,
          }}
        />
      </nav>

      {/* ── CONTENT ── */}
      <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>

        {/* SUGGESTIONS */}
        {tab === "suggestions" && (
          <div style={{ height: "100%", overflowY: "auto", padding: "0 0 24px" }}>
            {workspace.statement_rows.length === 0 ? (
              <div style={{ padding: "40px 20px", textAlign: "center", color: T.text3 }}>
                <div style={{ fontWeight: 500, color: T.text2, fontSize: 14, marginBottom: 6 }}>No statement uploaded</div>
                Upload a statement from the workspace to see suggestions.
              </div>
            ) : (
              <>
                {/* Auto-confident */}
                <SectionHeader
                  label={`Confident matches — same amount + date or name`}
                  count={visAutoSugg.length}
                  collapsed={!!collapsed["auto"]}
                  onToggle={() => toggleSection("auto")}
                  actions={
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Btn variant="primary" disabled={autoSugg.length === 0 || actionLoading} onClick={acceptAllAuto}>
                        Accept all {autoSugg.length}
                      </Btn>
                    </div>
                  }
                />
                {!collapsed["auto"] && (
                  <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 2, paddingBottom: 8 }}>
                    {visAutoSugg.length === 0 ? (
                      <div style={{ padding: "32px 0", textAlign: "center", color: T.text3 }}>
                        <div style={{ fontSize: 14, color: T.text2, fontWeight: 500, marginBottom: 4 }}>All accepted ✓</div>
                        Move on to Pair for any remaining rows.
                      </div>
                    ) : visAutoSugg.map((pair, i) => (
                      <SuggRow key={i} pair={pair} loading={actionLoading}
                        onAccept={() => acceptSugg(pair)}
                        onSkip={() => skipSugg(pair)} />
                    ))}
                  </div>
                )}

                {/* Review */}
                <SectionHeader
                  label="Needs review — possible match, verify before accepting"
                  count={visReviewSugg.length}
                  collapsed={!!collapsed["review"]}
                  onToggle={() => toggleSection("review")}
                />
                {!collapsed["review"] && (
                  <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 2, paddingBottom: 8 }}>
                    {visReviewSugg.length === 0 ? (
                      <div style={{ padding: "24px 0", textAlign: "center", color: T.text3 }}>No review items.</div>
                    ) : visReviewSugg.map((pair, i) => (
                      <SuggRow key={i} pair={pair} loading={actionLoading}
                        onAccept={() => acceptSugg(pair)}
                        onSkip={() => skipSugg(pair)} />
                    ))}
                  </div>
                )}

                {/* AI bill matches */}
                <SectionHeader
                  label="Platform bill matches — AI"
                  count={aiSuggestions?.length}
                  collapsed={!!collapsed["ai"]}
                  onToggle={() => toggleSection("ai")}
                  loading={aiLoading}
                  actions={
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      {aiCached && aiSuggestions !== null && (
                        <span style={{ fontSize: 11, color: T.text3 }}>cached</span>
                      )}
                      {aiSuggestions !== null && !aiLoading && (
                        <button
                          title="Force re-run AI match (bypass cache)"
                          disabled={actionLoading}
                          onClick={() => runAISuggest(true)}
                          style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: T.radius, padding: "2px 7px", fontSize: 13, cursor: "pointer", color: T.text2, lineHeight: 1 }}
                        >↺</button>
                      )}
                      <Btn disabled={aiLoading || actionLoading} onClick={() => runAISuggest(false)}>
                        {aiLoading
                          ? "Matching…"
                          : aiSuggestions !== null
                          ? `Bill matches (${(visAiSugg ?? aiSuggestions).length})`
                          : "Find bill matches →"}
                      </Btn>
                    </div>
                  }
                />
                {!collapsed["ai"] && (
                  <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 2, paddingBottom: 24 }}>
                    {aiLoading && (
                      <div style={{ padding: "24px 0", textAlign: "center", color: T.text3 }}>
                        Analyzing {workspace.unmatched_statement.length} statement rows against unpaid bills…
                      </div>
                    )}
                    {aiError && (
                      <div style={{ padding: "12px 16px", borderRadius: T.radius, background: T.critBg, color: T.crit, fontSize: 12 }}>
                        {aiError}
                      </div>
                    )}
                    {!aiLoading && aiSuggestions !== null && (visAiSugg ?? []).length === 0 && (
                      <div style={{ padding: "24px 0", textAlign: "center", color: T.text3 }}>
                        {q ? "No results match your filter." : "No bill matches found."}
                      </div>
                    )}
                    {!aiLoading && (visAiSugg ?? []).map((s, i) => (
                      <AISuggRow key={i} sugg={s} loading={actionLoading} onAccept={() => acceptAISugg(s)} onBillClick={id => setBillPanelID(id)} onSuggClick={sg => setAiSuggPanel(sg)} />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* PAIR */}
        {tab === "pair" && (
          <div style={{ height: "100%", display: "grid", gridTemplateColumns: "1fr 1fr", overflow: "hidden", position: "relative" }}>
            {/* Statement column */}
            <div style={{ display: "flex", flexDirection: "column", overflow: "hidden", borderRight: `1px solid ${T.border}` }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 16px", borderBottom: `1px solid ${T.border}`, background: T.bg, flexShrink: 0 }}>
                <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", color: T.text2 }}>Statement ({visStmt.length})</span>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {stmtUnmatched > 0 && (
                    <>
                      <span
                        onClick={() => setQuickBillRows(workspace?.unmatched_statement ?? [])}
                        style={{ fontSize: 10, fontWeight: 600, color: T.accent, cursor: "pointer", textDecoration: "underline", whiteSpace: "nowrap" }}
                      >Quick bill all</span>
                      <span
                        onClick={deferAll}
                        style={{ fontSize: 10, fontWeight: 600, color: T.text2, cursor: "pointer", textDecoration: "underline", whiteSpace: "nowrap" }}
                      >Defer all</span>
                    </>
                  )}
                  <span style={{ fontSize: 11, fontFamily: T.mono, color: selStmt ? T.accent : T.text3 }}>
                    {selStmt ? fmt(selStmt.amount_cents) : fmt(visStmt.reduce((s, r) => s + r.amount_cents, 0))}
                  </span>
                </div>
              </div>
              <div style={{ flex: 1, overflowY: "auto" }}>
                {visStmt.length === 0 ? (
                  <div style={{ padding: "40px 20px", textAlign: "center", color: T.text3 }}>
                    <div style={{ fontWeight: 500, color: T.text2, marginBottom: 4 }}>
                      {stmtUnmatched === 0 ? "All rows matched ✓" : "No rows match filter"}
                    </div>
                  </div>
                ) : visStmt.map((r, i) => {
                  const isSel = selStmt?.source_row === r.source_row;
                  return (
                    <div key={i} onClick={() => setSelStmt(isSel ? null : r)} style={{
                      display: "flex", alignItems: "center", gap: 10, padding: "10px 16px",
                      borderBottom: `1px solid ${T.border2}`, cursor: "pointer",
                      borderLeft: `3px solid ${isSel ? T.accent : "transparent"}`,
                      background: isSel ? T.accentBg : "transparent",
                      transition: "background 0.08s",
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
                          {r.is_credit && (
                            <span style={{ fontSize: 10, fontWeight: 600, padding: "1px 5px", borderRadius: 3, background: T.goodBg, color: T.good, border: `1px solid #A7F3D0`, flexShrink: 0 }}>CREDIT</span>
                          )}
                          <span style={{ fontSize: 13, color: T.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.description}</span>
                          {r.card_member && (
                            <span style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", borderRadius: 3, padding: "1px 5px", fontSize: 10, fontWeight: 500, background: "#E0F2FE", color: "#0369A1", border: "1px solid #BAE6FD" }}>
                              {r.card_member}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: T.text3, marginTop: 1 }}>{fmtDate(r.date)} · row {r.source_row}</div>
                      </div>
                      <div style={{ display: "flex", gap: 8, flexShrink: 0, opacity: isSel ? 1 : 0, transition: "opacity 0.1s" }}>
                        <span onClick={e => { e.stopPropagation(); setQuickBillRows([r]); }} style={{ fontSize: 10, color: T.accent, cursor: "pointer", textDecoration: "underline" }}>Bill</span>
                        <span onClick={e => { e.stopPropagation(); doDefer(r); }} style={{ fontSize: 10, color: T.text2, cursor: "pointer", textDecoration: "underline" }}>Defer</span>
                      </div>
                      <span style={{ fontFamily: T.mono, fontSize: 13, fontWeight: 600, flexShrink: 0 }}>{fmt(r.amount_cents)}</span>
                    </div>
                  );
                })}
              </div>
              {/* Deferred rows */}
              {(workspace?.resolved_statement ?? []).length > 0 && (
                <div style={{ flexShrink: 0, borderTop: `1px solid ${T.border}` }}>
                  <div style={{ padding: "6px 16px", background: T.bg, display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", color: T.text3 }}>Deferred ({workspace!.resolved_statement!.length})</span>
                  </div>
                  <div style={{ maxHeight: 160, overflowY: "auto" }}>
                    {workspace!.resolved_statement!.map((r, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 16px", borderBottom: `1px solid ${T.border2}`, opacity: 0.7 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, color: T.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.description}</div>
                          <div style={{ fontSize: 10, color: T.text3, marginTop: 1 }}>{fmtDate(r.date)} · row {r.source_row}</div>
                        </div>
                        <span onClick={() => undoDefer(r)} style={{ fontSize: 10, color: T.accent, cursor: "pointer", textDecoration: "underline", flexShrink: 0 }}>Undo</span>
                        <span style={{ fontFamily: T.mono, fontSize: 12, flexShrink: 0 }}>{fmt(r.amount_cents)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* QBO column */}
            <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 16px", borderBottom: `1px solid ${T.border}`, background: T.bg, flexShrink: 0 }}>
                <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", color: T.text2 }}>QBO / Buildium ({visQbo.length})</span>
                {selQboSet.length > 0 && <span style={{ fontSize: 11, color: T.accent, fontFamily: T.mono }}>{selQboSet.length > 1 ? `${selQboSet.length} selected · ` : ""}{fmt(selQboSet.reduce((s, r) => s + r.amount_cents, 0))}</span>}
              </div>
              <div style={{ flex: 1, overflowY: "auto" }}>
                {visQbo.length === 0 ? (
                  <div style={{ padding: "40px 20px", textAlign: "center", color: T.text3 }}>
                    <div style={{ fontWeight: 500, color: T.text2, marginBottom: 4 }}>
                      {qboUnmatched === 0 ? "All rows cleared ✓" : "No rows match filter"}
                    </div>
                  </div>
                ) : visQbo.map((r, i) => {
                  const isSel = selQboSet.some(s => qboRowKey(s) === qboRowKey(r));
                  const inPeriod = rec && r.txn_date >= rec.period_start && r.txn_date <= rec.period_end;
                  return (
                    <div key={i} onClick={() => toggleSelQbo(r)} style={{
                      display: "flex", alignItems: "center", gap: 10, padding: "10px 16px",
                      borderBottom: `1px solid ${T.border2}`, cursor: "pointer",
                      borderLeft: `3px solid ${isSel ? T.accent : "transparent"}`,
                      background: isSel ? T.accentBg : "transparent",
                      opacity: inPeriod ? 1 : 0.55,
                      transition: "background 0.08s",
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, color: T.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{qboDisplay(r)}</div>
                        <div style={{ fontSize: 11, color: T.text3, marginTop: 1 }}>
                          {fmtDate(r.txn_date)} · {r.txn_type}
                          {!inPeriod && <span style={{ marginLeft: 6, color: "#F59E0B", fontWeight: 500 }}>outside period</span>}
                        </div>
                      </div>
                      <span style={{ fontFamily: T.mono, fontSize: 13, fontWeight: 600, flexShrink: 0 }}>{fmt(r.amount_cents)}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Floating pair bar */}
            <div style={{
              position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)",
              background: T.text, color: "#fff", borderRadius: 6,
              display: "flex", alignItems: "center", gap: 10, padding: "10px 16px",
              boxShadow: "0 4px 16px rgba(0,0,0,.25)", whiteSpace: "nowrap", fontSize: 12,
              opacity: pairBarVisible ? 1 : 0, pointerEvents: pairBarVisible ? "all" : "none",
              transition: "opacity 0.15s",
              zIndex: 10,
            }}>
              <span style={{ color: "rgba(255,255,255,.6)" }}>
                {selStmt && selQboSet.length > 0
                  ? selQboSet.length === 1
                    ? `${selStmt.description}  ↔  ${qboDisplay(selQboSet[0])}`
                    : `${selStmt.description}  ↔  ${selQboSet.length} txns (${fmt(selQboSet.reduce((s, r) => s + r.amount_cents, 0))})`
                  : "Select a row on each side"}
              </span>
              <button onClick={doPair} disabled={actionLoading} style={{
                background: "#fff", color: T.accent, fontWeight: 600, border: "none",
                borderRadius: T.radius, padding: "5px 14px", fontSize: 12, cursor: "pointer", fontFamily: T.sans,
                opacity: actionLoading ? 0.5 : 1,
              }}>
                Pair ↔
              </button>
              <button onClick={() => { setSelStmt(null); setSelQboSet([]); }} style={{ background: "none", border: "none", color: "rgba(255,255,255,.5)", cursor: "pointer", fontSize: 18, lineHeight: 1, padding: "0 2px", fontFamily: T.sans }}>
                ✕
              </button>
            </div>
          </div>
        )}

        {/* CLEARED */}
        {tab === "cleared" && (
          <div style={{ height: "100%", overflowY: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Statement description", "QBO / Buildium", "Date", "Confidence", "Amount", ""].map((h, i) => (
                    <th key={i} style={{
                      position: "sticky", top: 0, zIndex: 1,
                      padding: "9px 16px", textAlign: i === 4 ? "right" : "left",
                      fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".07em",
                      color: T.text3, background: T.bg, borderBottom: `1px solid ${T.border}`, whiteSpace: "nowrap",
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visCleared.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: "40px 16px", textAlign: "center", color: T.text3 }}>No cleared lines yet.</td></tr>
                ) : visCleared.map((line, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border2}` }}>
                    <td style={{ padding: "9px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 13, color: T.text }}>{line.statement_row?.description ?? "—"}</span>
                        {line.statement_row?.card_member && (
                          <span style={{ display: "inline-flex", alignItems: "center", borderRadius: 3, padding: "1px 5px", fontSize: 10, fontWeight: 500, background: "#E0F2FE", color: "#0369A1", border: "1px solid #BAE6FD", whiteSpace: "nowrap" }}>
                            {line.statement_row.card_member}
                          </span>
                        )}
                      </div>
                      {line.force_clear_reason && <div style={{ fontSize: 11, color: T.warn, marginTop: 1 }}>{line.force_clear_reason}</div>}
                    </td>
                    <td style={{ padding: "9px 16px", fontSize: 12, color: T.text2 }}>{line.qbo_vendor || line.qbo_memo || (line.qbo_txn_id ? `Buildium payment #${line.qbo_txn_id}` : "—")}</td>
                    <td style={{ padding: "9px 16px", fontSize: 12, color: T.text2, whiteSpace: "nowrap" }}>{fmtDate(line.txn_date)}</td>
                    <td style={{ padding: "9px 16px" }}><Chip conf={line.match_confidence} /></td>
                    <td style={{ padding: "9px 16px", fontFamily: T.mono, fontSize: 13, fontWeight: 600, textAlign: "right" }}>{fmt(line.amount_cents)}</td>
                    <td style={{ padding: "9px 16px" }}>
                      <Btn style={{ fontSize: 10, padding: "2px 8px" }} disabled={actionLoading}
                        onClick={() => doUnmatch(line)}>Unmatch</Btn>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
