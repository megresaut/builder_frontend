import { Fragment, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import PageTemplate from "@/layout/PageTemplate";
import { SparkleIcon } from "@/components/icons";
import { fetchJSON } from "@/api/fetchJSON";
import {
  extractProjectIntake,
  createProject,
  type IntakeDraft,
  type CreateProjectPayload,
} from "@/data/projects";

/**
 * Project Intake — "New Project from Meeting Notes".
 * Flow: freeform notes → model extraction (POST /projects/intake/extract) →
 * human review of a single calm AI draft → create (POST /projects). The raw
 * notes and the model's extraction are stored with the created project for
 * auditing. Nothing is persisted until the reviewer hits Create.
 */

type Step = "notes" | "extracting" | "review" | "created";

interface SimpleProperty {
  id: number;
  name: string;
  address_line1: string | null;
  city: string | null;
  state: string | null;
}
function propertyLabel(p: SimpleProperty) {
  const address = [p.address_line1, p.city, p.state].filter(Boolean).join(", ");
  return address ? `${p.name} — ${address}` : p.name;
}

const EXTRACTION_STEPS = [
  "Reading meeting notes…",
  "Structuring scope & budget…",
  "Matching vendors & checking insurance…",
  "Assembling the draft…",
];

/* ------------------------------- primitives ------------------------------- */

const field =
  "w-full rounded-md border border-[#D7DCE3] bg-white px-3 py-2.5 text-sm text-[#17202B] focus:border-[#013764] focus:outline-none focus:ring-2 focus:ring-[#EAF0F6]";
const labelCls = "block text-[11px] font-semibold uppercase tracking-[0.06em] text-[#8A93A0] mb-1.5";

function Card({ title, action, children }: { title?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      {title && (
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-[15px]">
          <h3 className="text-[13.5px] font-semibold text-[#17202B]">{title}</h3>
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}

type ChipTone = "ai" | "good" | "warn" | "bad" | "muted";
const chipTones: Record<ChipTone, string> = {
  ai: "bg-[#E9F0F7] text-[#2F5578]",
  good: "bg-[#E7F6EC] text-[#15803D]",
  warn: "bg-[#F8EEDD] text-[#B45309]",
  bad: "bg-[#FBEBEC] text-[#B4232B]",
  muted: "bg-[#EAF0F6] text-[#5C6672]",
};
function Chip({ tone, children }: { tone: ChipTone; children: React.ReactNode }) {
  return (
    <span className={`inline-flex h-[22px] items-center gap-1 rounded-full px-2.5 text-[11.5px] font-semibold ${chipTones[tone]}`}>
      {children}
    </span>
  );
}

const btnPrimary =
  "inline-flex h-10 items-center gap-2 rounded-lg bg-[#013764] px-[18px] text-sm font-medium text-white transition-colors hover:bg-[#024a86] disabled:opacity-60";
const btnGhost =
  "inline-flex h-10 items-center gap-2 rounded-lg border border-[#D7DCE3] bg-white px-4 text-sm font-medium text-[#17202B] transition-colors hover:bg-gray-50";
const btnGhostSm =
  "inline-flex h-[30px] items-center gap-1.5 rounded-lg border border-[#D7DCE3] bg-white px-2.5 text-xs font-medium text-[#17202B] hover:bg-gray-50";

/* --------------------------------- types ---------------------------------- */

interface ScopeRow {
  key: number;
  name: string;
  amount: string; // dollars text, "" = unpriced
  hint?: string;
}
interface FlagRow {
  id: number;
  text: string;
  resolved: boolean;
}

/* --------------------------------- page ----------------------------------- */

export default function ProjectIntake() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("notes");

  const [properties, setProperties] = useState<SimpleProperty[]>([]);
  const [propertyId, setPropertyId] = useState<number | "">("");
  const [loadingProps, setLoadingProps] = useState(true);

  const [notes, setNotes] = useState("");
  const [extractIdx, setExtractIdx] = useState(0);

  // review state — populated from the extracted draft
  const [draft, setDraft] = useState<IntakeDraft | null>(null);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [scope, setScope] = useState<ScopeRow[]>([]);
  const [flags, setFlags] = useState<FlagRow[]>([]);
  const scopeSeq = useRef(1000);

  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<{ id: number; name: string } | null>(null);

  // load real properties for the selector
  useEffect(() => {
    let alive = true;
    fetchJSON("/properties")
      .then((rows: SimpleProperty[]) => {
        if (alive) setProperties(rows ?? []);
      })
      .catch(() => {
        if (alive) toast.error("Couldn't load properties");
      })
      .finally(() => {
        if (alive) setLoadingProps(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  // cycle the loading labels while extraction is in flight (cosmetic)
  useEffect(() => {
    if (step !== "extracting") return;
    setExtractIdx(0);
    const iv = setInterval(() => setExtractIdx((i) => Math.min(i + 1, EXTRACTION_STEPS.length - 1)), 900);
    return () => clearInterval(iv);
  }, [step]);

  const scopeTotal = scope.reduce((s, c) => s + (parseFloat(c.amount) || 0), 0);
  const openFlags = flags.filter((f) => !f.resolved).length;
  const stepIdx = { notes: 0, extracting: 1, review: 2, created: 3 }[step];

  async function runExtract() {
    if (propertyId === "") {
      toast.error("Pick a property first");
      return;
    }
    if (!notes.trim()) {
      toast.error("Add some notes first");
      return;
    }
    setStep("extracting");
    try {
      const d = await extractProjectIntake({ property_id: Number(propertyId), notes: notes.trim() });
      setDraft(d);
      setTitle(d.title ?? "");
      setSummary(d.summary ?? "");
      setStartDate(d.start_date ?? "");
      setEndDate(d.target_end_date ?? "");
      setScope(
        (d.scope ?? []).map((s, i) => ({
          key: i,
          name: s.name,
          amount: s.amount_cents == null ? "" : String(s.amount_cents / 100),
          hint: s.hint,
        })),
      );
      setFlags((d.flags ?? []).map((f, i) => ({ id: i, text: f.text, resolved: false })));
      setStep("review");
    } catch (e: any) {
      toast.error(e?.message || "Extraction failed");
      setStep("notes");
    }
  }

  async function runCreate() {
    if (propertyId === "") return;
    setCreating(true);
    try {
      const payload: CreateProjectPayload = {
        name: title.trim() || "Untitled project",
        property_id: Number(propertyId),
        status: "planning",
        description: summary.trim(),
        start_date: startDate || undefined,
        target_end_date: endDate || undefined,
        budget: scope
          .filter((s) => s.name.trim())
          .map((s) => {
            const n = Number(s.amount);
            return {
              name: s.name.trim(),
              amount_cents: s.amount.trim() === "" || !Number.isFinite(n) ? 0 : Math.round(n * 100),
            };
          }),
        intake_notes: notes.trim(),
        intake_extraction: draft?.raw_extraction,
      };
      const res = await createProject(payload);
      setCreated({ id: res.project.id, name: res.project.name });
      setStep("created");
    } catch (e: any) {
      toast.error(e?.message || "Failed to create project");
    } finally {
      setCreating(false);
    }
  }

  return (
    <PageTemplate>
      <div className="mx-auto max-w-[940px] pb-20">
        {/* header */}
        <button onClick={() => navigate("/projects")} className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
          Projects
        </button>
        <h1 className="text-[24px] font-semibold leading-[1.15] tracking-[-0.01em] text-[#17202B]">New project from meeting notes</h1>
        <p className="mt-1.5 max-w-[62ch] text-[#5C6672]">
          Capture the messy first conversation, let the model structure it into a draft, then review and create — nothing is
          saved until you sign off.
        </p>

        {/* stepper */}
        <nav className="my-7 flex items-center" aria-label="Progress">
          {(["Notes", "Extract", "Review", "Create"] as const).map((lbl, i) => {
            const active = i === stepIdx;
            const done = i < stepIdx;
            return (
              <Fragment key={lbl}>
                {i > 0 && <span className="mx-3 h-px min-w-[20px] flex-1 bg-gray-300" />}
                <div className={`flex items-center gap-2 text-[13px] font-medium ${active ? "text-[#17202B]" : done ? "text-[#5C6672]" : "text-[#8A93A0]"}`}>
                  <span
                    className={`flex h-[22px] w-[22px] flex-none items-center justify-center rounded-full border-[1.5px] text-[12px] font-semibold ${
                      active
                        ? "border-[#013764] bg-[#013764] text-white"
                        : done
                          ? "border-transparent bg-[#EAF0F6] text-[#013764]"
                          : "border-[#D7DCE3] bg-white text-[#8A93A0]"
                    }`}
                  >
                    {done ? "✓" : i + 1}
                  </span>
                  {lbl}
                </div>
              </Fragment>
            );
          })}
        </nav>

        {/* ------------------------------ step: notes ------------------------------ */}
        {step === "notes" && (
          <div className="flex flex-col gap-[18px]">
            <Card title="Property">
              <label className={labelCls} htmlFor="pi-prop">Property</label>
              <select
                id="pi-prop"
                value={propertyId}
                onChange={(e) => setPropertyId(e.target.value === "" ? "" : Number(e.target.value))}
                className={field}
                disabled={loadingProps && properties.length === 0}
              >
                <option value="">{loadingProps && properties.length === 0 ? "Loading properties…" : "Select a property…"}</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {propertyLabel(p)}
                  </option>
                ))}
              </select>
            </Card>

            <Card title="Meeting notes" action={<button onClick={() => setNotes("")} className={btnGhostSm}>Clear</button>}>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                spellCheck={false}
                placeholder={"Dump everything — scope, vendors, verbal quotes, budget talk, timeline…"}
                className={`${field} min-h-[340px] resize-y font-mono text-[13px] leading-relaxed`}
              />
              <p className="mt-3 text-[12.5px] text-[#8A93A0]">
                The model structures it in the next step; you review before anything is created.
              </p>
            </Card>

            <div className="flex justify-end">
              <button onClick={runExtract} className={btnPrimary}>
                <SparkleIcon width={16} height={16} /> Extract project draft
              </button>
            </div>
          </div>
        )}

        {/* ---------------------------- step: extracting ---------------------------- */}
        {step === "extracting" && (
          <Card>
            <div className="flex flex-col items-center gap-4 py-16 text-center">
              <span className="h-[34px] w-[34px] animate-spin rounded-full border-[3px] border-[#D7DCE3] border-t-[#013764] motion-reduce:animate-none" />
              <div className="text-sm font-medium text-[#17202B]">{EXTRACTION_STEPS[extractIdx]}</div>
              <div className="text-[13px] text-[#8A93A0]">This usually takes a few seconds.</div>
            </div>
          </Card>
        )}

        {/* ------------------------------ step: review ------------------------------ */}
        {step === "review" && (
          <div className="flex flex-col gap-[18px]">
            <div className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5 text-[12.5px] text-[#5C6672]">
              <span className="text-[#2F5578]"><SparkleIcon width={14} height={14} /></span>
              <span>
                Everything below is an <b className="font-semibold text-[#17202B]">AI draft</b> from your notes. Edit anything —
                the raw notes and this draft are saved with the project for auditing.
              </span>
            </div>

            <Card title="Project">
              <div className="flex flex-col gap-4">
                <div>
                  <label className={labelCls} htmlFor="pi-title">Project title</label>
                  <input id="pi-title" value={title} onChange={(e) => setTitle(e.target.value)} className={field} />
                </div>
                <div>
                  <label className={labelCls} htmlFor="pi-summary">Summary</label>
                  <textarea id="pi-summary" value={summary} onChange={(e) => setSummary(e.target.value)} rows={3} className={`${field} resize-y leading-relaxed`} />
                </div>
                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                  <div>
                    <label className={labelCls} htmlFor="pi-start">Start</label>
                    <input id="pi-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={field} />
                  </div>
                  <div>
                    <label className={labelCls} htmlFor="pi-end">Target completion</label>
                    <input id="pi-end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={field} />
                  </div>
                </div>
              </div>
            </Card>

            <Card
              title="Scope & budget"
              action={
                <button onClick={() => setScope((s) => [...s, { key: scopeSeq.current++, name: "", amount: "" }])} className={btnGhostSm}>
                  + Category
                </button>
              }
            >
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="pb-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[#8A93A0]">Category</th>
                    <th className="pb-2.5 text-right text-[11px] font-semibold uppercase tracking-[0.06em] text-[#8A93A0]">Amount</th>
                    <th className="w-9" />
                  </tr>
                </thead>
                <tbody>
                  {scope.map((c) => (
                    <tr key={c.key} className="border-t border-gray-100">
                      <td className="py-1.5 align-middle">
                        <input
                          value={c.name}
                          placeholder="Category"
                          aria-label="Category name"
                          onChange={(e) => setScope((s) => s.map((x) => (x.key === c.key ? { ...x, name: e.target.value } : x)))}
                          className="w-full rounded-md border border-transparent bg-transparent px-2 py-1.5 text-sm text-[#17202B] hover:border-gray-200 focus:border-[#013764] focus:bg-white focus:outline-none"
                        />
                        {c.hint && <div className="px-2 text-[11.5px] text-[#8A93A0]">{c.hint}</div>}
                      </td>
                      <td className="py-1.5 text-right align-middle">
                        <span className="inline-flex items-center justify-end gap-0.5">
                          <span className="text-[#8A93A0]">$</span>
                          <input
                            value={c.amount}
                            inputMode="numeric"
                            placeholder="unpriced"
                            aria-label="Category amount in dollars"
                            onChange={(e) => setScope((s) => s.map((x) => (x.key === c.key ? { ...x, amount: e.target.value.replace(/[^0-9.]/g, "") } : x)))}
                            className="w-[108px] rounded-md border border-transparent bg-transparent px-2 py-1.5 text-right text-sm tabular-nums text-[#17202B] placeholder:italic placeholder:text-[#8A93A0] hover:border-gray-200 focus:border-[#013764] focus:bg-white focus:outline-none"
                          />
                        </span>
                      </td>
                      <td className="py-1.5 align-middle">
                        <button
                          onClick={() => setScope((s) => s.filter((x) => x.key !== c.key))}
                          aria-label="Remove category"
                          className="rounded-md px-1.5 py-1 text-[15px] leading-none text-[#8A93A0] hover:bg-[#FBEBEC] hover:text-[#B4232B]"
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td className="border-t-[1.5px] border-[#D7DCE3] pt-3 text-sm font-semibold text-[#17202B]">Priced so far</td>
                    <td className="border-t-[1.5px] border-[#D7DCE3] pt-3 text-right text-sm font-semibold tabular-nums text-[#17202B]">
                      ${scopeTotal.toLocaleString()}
                    </td>
                    <td className="border-t-[1.5px] border-[#D7DCE3]" />
                  </tr>
                </tfoot>
              </table>
            </Card>

            <Card title="Vendors mentioned">
              <div>
                {(draft?.vendors ?? []).length === 0 && (
                  <div className="text-[13px] text-[#8A93A0]">No vendors mentioned in the notes.</div>
                )}
                {(draft?.vendors ?? []).map((v, i) => (
                  <div key={`${v.name}-${i}`} className={`py-3 ${i > 0 ? "border-t border-gray-100" : "pt-0.5"}`}>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-[#17202B]">{v.name}</span>
                      {v.trade && <span className="text-[13px] text-[#5C6672]">{v.trade}</span>}
                      <span className="ml-auto flex flex-wrap gap-1.5">
                        {v.known && <Chip tone="muted">Known vendor</Chip>}
                        {!v.known ? (
                          <Chip tone="bad">Not in vendor list</Chip>
                        ) : v.has_coi ? (
                          <Chip tone="good">{v.coi_expires_on ? `COI on file · exp ${v.coi_expires_on}` : "COI on file"}</Chip>
                        ) : (
                          <Chip tone="warn">No COI on file</Chip>
                        )}
                      </span>
                    </div>
                    {v.quote_amount ? (
                      <div className="mt-2 flex items-baseline gap-2 text-[13px] text-[#5C6672]">
                        <b className="font-semibold tabular-nums text-[#17202B]">{v.quote_amount}</b>
                        {v.quote_note && <span>{v.quote_note}</span>}
                      </div>
                    ) : (
                      <div className="mt-2 text-[13px] text-[#8A93A0]">No quote yet — mentioned for this project.</div>
                    )}
                  </div>
                ))}
                <p className="mt-3.5 text-[12.5px] text-[#8A93A0]">
                  Matched against your vendor list; new vendors are flagged, never auto-created. Quote fair-price analysis
                  comes in a later phase.
                </p>
              </div>
            </Card>

            <Card title={`Follow-ups (${openFlags} open)`}>
              <div>
                {flags.length === 0 && <div className="text-[13px] text-[#8A93A0]">No follow-ups raised.</div>}
                {flags.map((f, i) => (
                  <div key={f.id} className={`flex items-start gap-2.5 py-2.5 ${i > 0 ? "border-t border-gray-100" : ""} ${f.resolved ? "text-[#8A93A0]" : ""}`}>
                    <span className={`mt-1.5 h-[7px] w-[7px] flex-none rounded-full ${f.resolved ? "bg-[#D7DCE3]" : "bg-[#B45309]"}`} />
                    <span className={`flex-1 text-[13px] ${f.resolved ? "line-through" : "text-[#5C6672]"}`}>{f.text}</span>
                    {!f.resolved && (
                      <button
                        onClick={() => setFlags((v) => v.map((x) => (x.id === f.id ? { ...x, resolved: true } : x)))}
                        className="px-1 text-[12.5px] font-semibold text-[#B45309] hover:underline"
                      >
                        Resolve
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            <details className="group rounded-[10px] border border-gray-100 bg-gray-50">
              <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-[13px] font-medium text-[#5C6672] [&::-webkit-details-marker]:hidden">
                <svg className="transition-transform group-open:rotate-90" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
                View source notes
              </summary>
              <div className="max-h-[260px] overflow-auto whitespace-pre-wrap border-t border-gray-100 px-4 py-3.5 font-mono text-[12px] leading-[1.65] text-[#5C6672]">
                {notes}
              </div>
            </details>

            <div className="mt-1 flex items-center justify-between">
              <button onClick={() => setStep("notes")} className={btnGhost}>Back to notes</button>
              <button onClick={runCreate} disabled={creating} className={btnPrimary}>
                {creating ? "Creating…" : "Create project in Planning"}
              </button>
            </div>
          </div>
        )}

        {/* ------------------------------ step: created ----------------------------- */}
        {step === "created" && created && (
          <Card>
            <div className="flex flex-col items-center gap-3.5 py-12 text-center">
              <div className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[#E7F6EC] text-[#15803D]">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5" /></svg>
              </div>
              <div>
                <h2 className="text-[19px] font-semibold text-[#17202B]">{created.name}</h2>
                <p className="text-[#5C6672]">Created in <b className="font-semibold text-[#17202B]">Planning</b> — you can keep building it out from here.</p>
              </div>
              <div className="my-1.5 flex flex-wrap justify-center gap-x-[34px] gap-y-3">
                <div className="text-center">
                  <b className="block text-[20px] font-semibold tabular-nums text-[#17202B]">{scope.filter((s) => s.name.trim()).length}</b>
                  <span className="text-[12.5px] text-[#5C6672]">budget categories</span>
                </div>
                <div className="text-center">
                  <b className="block text-[20px] font-semibold tabular-nums text-[#17202B]">{draft?.vendors.length ?? 0}</b>
                  <span className="text-[12.5px] text-[#5C6672]">vendors surfaced</span>
                </div>
                <div className="text-center">
                  <b className="block text-[20px] font-semibold tabular-nums text-[#17202B]">{openFlags}</b>
                  <span className="text-[12.5px] text-[#5C6672]">follow-ups</span>
                </div>
              </div>
              <div className="mt-1.5 flex gap-2.5">
                <button onClick={() => navigate("/projects")} className={btnGhost}>Back to Projects</button>
                <button onClick={() => navigate(`/projects/${created.id}`)} className={btnPrimary}>Open project →</button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </PageTemplate>
  );
}
