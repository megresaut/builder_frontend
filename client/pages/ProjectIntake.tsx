import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import PageTemplate from "@/layout/PageTemplate";

/**
 * Project Intake — frontend-only DEMO of the preplanning → auto-create pipeline
 * (see PREPLANNING outline). Flow: freeform meeting notes → simulated model
 * extraction → human review with provenance markers + flags → create.
 * No API calls; everything is local sample state and resets on reload.
 */

type Step = "notes" | "extracting" | "review" | "created";

/* ------------------------------- primitives ------------------------------- */

function Pill({ label, text, bg }: { label: string; text: string; bg: string }) {
  return (
    <span className="inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ color: text, backgroundColor: bg }}>
      {label}
    </span>
  );
}

function SampleBanner({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-800">
      <span className="rounded-full bg-amber-100 px-2 py-0.5 font-semibold uppercase tracking-wider">Demo</span>
      <span>{children}</span>
    </div>
  );
}

function Card({ title, action, children }: { title?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-[0_1px_2px_0_rgba(0,0,0,0.03)]">
      {title && (
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}

/** Provenance chip: AI-extracted until the field is touched, then "edited". */
function Prov({ edited }: { edited: boolean }) {
  return edited ? (
    <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-500">edited</span>
  ) : (
    <span className="rounded bg-violet-50 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-violet-700">✨ AI</span>
  );
}

const fieldCls =
  "w-full rounded-md border border-[#DADADA] px-3 py-2 text-sm focus:border-[#013764] focus:outline-none";

/* -------------------------------- sample data ------------------------------ */

const SAMPLE_NOTES = `Meeting w/ the Hendersons @ 78 Round Hill Rd — Sat Jul 12
On call: me (Carter), Mrs. Henderson, Tony from Aqua Pools (phone, last 20 min)

They want to redo the whole backyard for next summer. Main pieces: gunite pool (~18x36), pool house w/ half bath + outdoor shower, new bluestone patio connecting to the existing deck, landscaping/privacy plantings along the north fence, electrical + gas runs for the pool heater and the pool house.

Tony quoted 145k verbal for the pool itself — includes excavation, gunite, plaster, coping, standard equipment package. Heater is separate depending on the gas run. No timeline given, says "get on the list now".

Pool house — they liked the 14x20 design from the Hekma project. Bring Teixera in for masonry/foundation again, maybe DiSanto for framing. No numbers yet.

Frank Clark can do the electrical — ballpark 30-35k for panel upgrade + runs to pool equipment + pool house subpanel. He wasn't on the call, number came from his text to me Friday.

Patio — Mrs. H wants the same cedar lake stone as Husted Lane. Teixera again probably. Rough guess 60-70k?

Budget talk: they're comfortable "all-in around 400, maybe 450 if the pool house is right". Want to start after Labor Day, pool usable by Memorial Day '27.

TODO: get Tony's quote in writing, COI for Aqua Pools (new vendor for us), ask DiSanto for a framing quote, check gas line capacity w/ Guasco's.`;

interface ScopeItem {
  key: number;
  name: string;
  amount: string; // dollars, editable text
  hint?: string;
}

const EXTRACTED_TITLE = "78 Round Hill Rd — Pool & Pool House";
const EXTRACTED_SUMMARY =
  "Full backyard renovation: gunite pool (~18x36), 14x20 pool house with half bath and outdoor shower, bluestone patio, privacy landscaping, and supporting electrical + gas infrastructure. Construction targeted from Sep 2026; pool usable by Memorial Day 2027.";
const EXTRACTED_SCOPE: ScopeItem[] = [
  { key: 1, name: "Pool installation", amount: "145000", hint: "From Aqua Pools verbal quote" },
  { key: 2, name: "Pool house construction", amount: "", hint: "No numbers yet — Teixera / DiSanto" },
  { key: 3, name: "Patio & masonry", amount: "65000", hint: "PM rough guess 60–70k, midpoint" },
  { key: 4, name: "Electrical", amount: "32500", hint: "Frank Clark ballpark 30–35k, midpoint" },
  { key: 5, name: "Landscaping & plantings", amount: "", hint: "North fence privacy — unpriced" },
  { key: 6, name: "Gas run / pool heater", amount: "", hint: "Depends on Guasco's capacity check" },
];
const EXTRACTED_START = "2026-09-08";
const EXTRACTED_END = "2027-05-31";
const EXTRACTED_BUDGET_NOTES =
  "Client comfortable at $400k all-in, up to $450k if the pool house is right. Verbal/ballpark quotes cover ~$242k; pool house, landscaping, and gas run are unpriced.";

interface ExtractedVendor {
  name: string;
  trade: string;
  onCall: boolean;
  known: boolean; // matched against the vendor list
  coi: boolean; // insurance on file (vendor-compliance)
  quote?: { amount: string; scope: string; analysis: "needs_review" | "missing_info" | "looks_complete"; analysisNote: string };
}

const EXTRACTED_VENDORS: ExtractedVendor[] = [
  {
    name: "Aqua Pools (Tony)",
    trade: "Pool contractor",
    onCall: true,
    known: false,
    coi: false,
    quote: {
      amount: "$145,000",
      scope: "Excavation, gunite, plaster, coping, standard equipment package. Heater excluded.",
      analysis: "needs_review",
      analysisNote: "Verbal only, no timeline, heater excluded — get it in writing.",
    },
  },
  {
    name: "Frank Clark",
    trade: "Electrical",
    onCall: false,
    known: true,
    coi: true,
    quote: {
      amount: "$30,000–35,000",
      scope: "Panel upgrade, runs to pool equipment, pool house subpanel.",
      analysis: "missing_info",
      analysisNote: "Text-message ballpark, no itemization — recorded midpoint $32,500.",
    },
  },
  { name: "Teixera Construction", trade: "Masonry / foundation", onCall: false, known: true, coi: true },
  { name: "DiSanto Builders", trade: "Framing", onCall: false, known: true, coi: false },
];

const QUOTE_ANALYSIS_META = {
  looks_complete: { label: "Looks complete", text: "#15803D", bg: "#E7F6EC" },
  missing_info: { label: "Missing info", text: "#B45309", bg: "#FCF2E1" },
  needs_review: { label: "Needs review", text: "#B91C1C", bg: "#FCEAEA" },
};

interface Flag {
  id: number;
  text: string;
  resolved: boolean;
}

const EXTRACTED_FLAGS: Flag[] = [
  { id: 1, text: "Aqua Pools is not in the vendor system — request COI before contracting.", resolved: false },
  { id: 2, text: "Pool quote is verbal — get it in writing (a written quote will supersede it as a revision).", resolved: false },
  { id: 3, text: "Frank Clark's number is a text-message ballpark ($30–35k) — midpoint $32,500 recorded.", resolved: false },
  { id: 4, text: "Patio figure is the PM's rough guess, not a vendor quote.", resolved: false },
  { id: 5, text: "Timeline inferred from “after Labor Day” / “Memorial Day '27” — confirm dates with client.", resolved: false },
  { id: 6, text: "Gas line capacity check with Guasco's needed before the heater decision.", resolved: false },
];

const EXTRACTION_STEPS = [
  "Reading meeting notes…",
  "Identifying scope items…",
  "Matching vendors against the vendor list…",
  "Checking insurance (COI) on file…",
  "Analyzing quotes for completeness…",
  "Assembling project draft…",
];

/* --------------------------------- page ----------------------------------- */

export default function ProjectIntake() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("notes");
  const [notes, setNotes] = useState(SAMPLE_NOTES);
  const [property, setProperty] = useState("(C) 78 Round Hill Rd — Greenwich, CT");
  const [extractIdx, setExtractIdx] = useState(0);

  // review state
  const [title, setTitle] = useState(EXTRACTED_TITLE);
  const [summary, setSummary] = useState(EXTRACTED_SUMMARY);
  const [scope, setScope] = useState<ScopeItem[]>(EXTRACTED_SCOPE);
  const [startDate, setStartDate] = useState(EXTRACTED_START);
  const [endDate, setEndDate] = useState(EXTRACTED_END);
  const [budgetNotes, setBudgetNotes] = useState(EXTRACTED_BUDGET_NOTES);
  const [flags, setFlags] = useState<Flag[]>(EXTRACTED_FLAGS);
  const [edited, setEdited] = useState<Set<string>>(new Set());
  const scopeSeq = useRef(100);

  const mark = (field: string) => setEdited((s) => (s.has(field) ? s : new Set(s).add(field)));

  // Simulated extraction: cycle through step messages, then land on review.
  useEffect(() => {
    if (step !== "extracting") return;
    setExtractIdx(0);
    const iv = setInterval(() => setExtractIdx((i) => Math.min(i + 1, EXTRACTION_STEPS.length - 1)), 450);
    const done = setTimeout(() => setStep("review"), 450 * EXTRACTION_STEPS.length + 300);
    return () => {
      clearInterval(iv);
      clearTimeout(done);
    };
  }, [step]);

  const scopeTotal = scope.reduce((s, c) => s + (Number(c.amount) || 0), 0);
  const openFlags = flags.filter((f) => !f.resolved).length;

  return (
    <PageTemplate>
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div>
          <button onClick={() => navigate("/projects")} className="text-sm text-gray-500 hover:text-gray-700">
            ← Projects
          </button>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold text-[#303030]">New Project from Meeting Notes</h1>
            <Pill label="Intake" text="#7C3AED" bg="#F1EBFD" />
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Capture the messy first conversation, let the model structure it, review, and create the project — nothing goes
            live without your sign-off.
          </p>
        </div>

        <SampleBanner>
          Frontend-only preview for the preplanning pipeline. The notes are pre-loaded with a realistic sample and the
          "extraction" is simulated — no model call, nothing saved.
        </SampleBanner>

        {/* step indicator */}
        <div className="flex items-center gap-2 text-xs font-medium">
          {(["Notes", "Extract", "Review", "Create"] as const).map((label, i) => {
            const stepIdx = { notes: 0, extracting: 1, review: 2, created: 3 }[step];
            const active = i === stepIdx;
            const done = i < stepIdx;
            return (
              <div key={label} className="flex items-center gap-2">
                {i > 0 && <span className="h-px w-8 bg-gray-300" />}
                <span
                  className={`flex h-6 items-center gap-1.5 rounded-full px-2.5 ${
                    active ? "bg-[#013764] text-white" : done ? "bg-[#E7F6EC] text-green-700" : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {done ? "✓" : i + 1} {label}
                </span>
              </div>
            );
          })}
        </div>

        {/* ------------------------------ step: notes ------------------------------ */}
        {step === "notes" && (
          <div className="flex flex-col gap-6">
            <Card title="Property">
              <select value={property} onChange={(e) => setProperty(e.target.value)} className={fieldCls} aria-label="Property">
                <option>(C) 78 Round Hill Rd — Greenwich, CT</option>
                <option>(C) 45 Husted Lane — Greenwich, CT</option>
                <option>(C) 3 Hekma Rd — Greenwich, CT</option>
              </select>
            </Card>

            <Card
              title="Meeting Notes"
              action={
                <button onClick={() => setNotes("")} className="h-7 rounded-lg border border-[#DADADA] bg-white px-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
                  Clear
                </button>
              }
            >
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={16}
                placeholder={"Dump everything from the meeting — scope as discussed, vendors mentioned, verbal quotes, budget talk, timeline…\nThe model structures it in the next step; you review before anything is created."}
                className={`${fieldCls} font-mono text-[13px] leading-relaxed`}
              />
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium uppercase tracking-wide text-gray-400">Attachments</span>
                {["pool-house-sketch.pdf", "hekma-poolhouse-photos.zip"].map((f) => (
                  <button
                    key={f}
                    onClick={() => toast.info("Attachment preview isn't wired in this demo")}
                    className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-100"
                  >
                    📎 {f}
                  </button>
                ))}
                <button onClick={() => toast.info("Upload isn't wired in this demo")} className="rounded-full border border-dashed border-gray-300 px-2.5 py-1 text-xs text-gray-400 hover:text-gray-600">
                  + Attach
                </button>
              </div>
            </Card>

            <div className="flex justify-end">
              <button
                onClick={() => {
                  if (!notes.trim()) {
                    toast.error("Add some notes first");
                    return;
                  }
                  setStep("extracting");
                }}
                className="h-10 rounded-lg bg-[#013764] px-5 text-sm font-medium text-white hover:bg-[#003a73]"
              >
                ✨ Extract project draft
              </button>
            </div>
          </div>
        )}

        {/* ---------------------------- step: extracting ---------------------------- */}
        {step === "extracting" && (
          <Card>
            <div className="flex flex-col items-center gap-4 py-10">
              <span className="h-10 w-10 animate-spin rounded-full border-[3px] border-gray-200 border-t-[#013764]" />
              <div className="text-sm font-medium text-gray-900">{EXTRACTION_STEPS[extractIdx]}</div>
              <div className="flex flex-col gap-1 text-xs text-gray-400">
                {EXTRACTION_STEPS.slice(0, extractIdx).map((s) => (
                  <span key={s}>✓ {s.replace("…", "")}</span>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* ------------------------------ step: review ------------------------------ */}
        {step === "review" && (
          <div className="flex flex-col gap-6">
            <div className="rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3 text-sm text-gray-700">
              <span className="font-semibold text-[#013764]">Review before anything is created.</span>{" "}
              Fields marked <Prov edited={false} /> came from the model; anything you touch becomes <Prov edited={true} />.
              The raw notes and the extraction are kept with the project for auditing.
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6 items-start">
              {/* left rail: source notes + flags */}
              <div className="flex flex-col gap-6">
                <Card title="Source Notes">
                  <div className="max-h-64 overflow-y-auto whitespace-pre-wrap font-mono text-[12px] leading-relaxed text-gray-600">
                    {notes}
                  </div>
                </Card>
                <Card title={`Flags (${openFlags} open)`}>
                  <div className="flex flex-col gap-2.5">
                    {flags.map((f) => (
                      <div key={f.id} className={`flex items-start justify-between gap-2 rounded-lg border px-3 py-2 text-xs ${f.resolved ? "border-gray-100 bg-gray-50 text-gray-400 line-through" : "border-amber-200 bg-amber-50 text-amber-800"}`}>
                        <span>⚠ {f.text}</span>
                        {!f.resolved && (
                          <button
                            onClick={() => setFlags((v) => v.map((x) => (x.id === f.id ? { ...x, resolved: true } : x)))}
                            className="shrink-0 font-medium text-amber-700 hover:underline"
                          >
                            Resolve
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              {/* right: the draft */}
              <div className="flex flex-col gap-6">
                <Card title="Project">
                  <div className="flex flex-col gap-4">
                    <div>
                      <div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                        Title <Prov edited={edited.has("title")} />
                      </div>
                      <input value={title} onChange={(e) => { setTitle(e.target.value); mark("title"); }} className={fieldCls} aria-label="Project title" />
                    </div>
                    <div>
                      <div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                        Summary <Prov edited={edited.has("summary")} />
                      </div>
                      <textarea value={summary} onChange={(e) => { setSummary(e.target.value); mark("summary"); }} rows={3} className={fieldCls} aria-label="Project summary" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                          Start <Prov edited={edited.has("start")} />
                        </div>
                        <input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); mark("start"); }} className={fieldCls} aria-label="Start date" />
                      </div>
                      <div>
                        <div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                          Target end <Prov edited={edited.has("end")} />
                        </div>
                        <input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); mark("end"); }} className={fieldCls} aria-label="Target end date" />
                      </div>
                    </div>
                  </div>
                </Card>

                <Card
                  title="Scope → Budget Categories"
                  action={
                    <button
                      onClick={() => setScope((s) => [...s, { key: scopeSeq.current++, name: "", amount: "" }])}
                      className="h-7 rounded-lg border border-[#DADADA] bg-white px-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                      + Category
                    </button>
                  }
                >
                  <div className="flex flex-col gap-2">
                    {scope.map((c) => (
                      <div key={c.key} className="flex flex-wrap items-center gap-2">
                        <input
                          value={c.name}
                          placeholder="Category"
                          aria-label="Category name"
                          onChange={(e) => { setScope((s) => s.map((x) => (x.key === c.key ? { ...x, name: e.target.value } : x))); mark(`scope-${c.key}`); }}
                          className={`${fieldCls} min-w-[180px] flex-1`}
                        />
                        <div className="flex items-center gap-1">
                          <span className="text-gray-400">$</span>
                          <input
                            type="number"
                            value={c.amount}
                            placeholder="unpriced"
                            aria-label="Category amount in dollars"
                            onChange={(e) => { setScope((s) => s.map((x) => (x.key === c.key ? { ...x, amount: e.target.value } : x))); mark(`scope-${c.key}`); }}
                            className={`${fieldCls} w-32 text-right tabular-nums`}
                          />
                        </div>
                        <Prov edited={edited.has(`scope-${c.key}`) || c.key >= 100} />
                        <button onClick={() => setScope((s) => s.filter((x) => x.key !== c.key))} aria-label="Remove category" className="px-1 text-gray-400 hover:text-red-600">✕</button>
                        {c.hint && <span className="w-full pl-1 text-xs text-gray-400 sm:w-auto">{c.hint}</span>}
                      </div>
                    ))}
                    <div className="mt-1 flex justify-between border-t border-gray-100 pt-3 text-sm font-semibold text-gray-900">
                      <span>Priced so far</span>
                      <span className="tabular-nums">${scopeTotal.toLocaleString()}</span>
                    </div>
                  </div>
                </Card>

                <Card title="Vendors & Quotes">
                  <div className="flex flex-col gap-3">
                    {EXTRACTED_VENDORS.map((v) => (
                      <div key={v.name} className="rounded-lg border border-gray-200 px-4 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">{v.name}</span>
                          <span className="text-xs text-gray-500">{v.trade}</span>
                          {v.onCall && <Pill label="On the call" text="#1D4ED8" bg="#E7EEFE" />}
                          {v.known ? <Pill label="Known vendor" text="#15803D" bg="#E7F6EC" /> : <Pill label="Not in vendor list" text="#B91C1C" bg="#FCEAEA" />}
                          {v.known && (v.coi ? <Pill label="COI on file" text="#15803D" bg="#E7F6EC" /> : <Pill label="COI expired" text="#B45309" bg="#FCF2E1" />)}
                        </div>
                        {v.quote ? (
                          <div className="mt-2 rounded-md bg-gray-50 px-3 py-2">
                            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                              <span className="font-medium tabular-nums text-gray-900">{v.quote.amount}</span>
                              <Pill {...QUOTE_ANALYSIS_META[v.quote.analysis]} label={QUOTE_ANALYSIS_META[v.quote.analysis].label} />
                            </div>
                            <div className="mt-1 text-xs text-gray-600">{v.quote.scope}</div>
                            <div className="mt-1 text-xs text-amber-700">{v.quote.analysisNote}</div>
                          </div>
                        ) : (
                          <div className="mt-2 text-xs text-gray-400">No quote yet — mentioned for this project.</div>
                        )}
                      </div>
                    ))}
                    <p className="text-xs text-gray-400">
                      Quotes land on the project's Quotes tab as “received (verbal — from intake)”. New vendors are flagged,
                      never auto-created.
                    </p>
                  </div>
                </Card>

                <Card title="Budget Notes">
                  <div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                    <Prov edited={edited.has("budgetNotes")} />
                  </div>
                  <textarea value={budgetNotes} onChange={(e) => { setBudgetNotes(e.target.value); mark("budgetNotes"); }} rows={2} className={fieldCls} aria-label="Budget notes" />
                </Card>

                <div className="flex items-center justify-between">
                  <button onClick={() => setStep("notes")} className="h-10 rounded-lg border border-[#DADADA] bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50">
                    ← Back to notes
                  </button>
                  <button
                    onClick={() => setStep("created")}
                    className="h-10 rounded-lg bg-[#013764] px-5 text-sm font-medium text-white hover:bg-[#003a73]"
                  >
                    Create project in Planning
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------ step: created ----------------------------- */}
        {step === "created" && (
          <Card>
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-2xl text-green-700">✓</span>
              <div>
                <div className="text-lg font-semibold text-gray-900">{title}</div>
                <div className="mt-0.5 text-sm text-gray-500">created in <span className="font-medium text-gray-700">Planning</span> for {property}</div>
              </div>
              <div className="grid grid-cols-2 gap-x-10 gap-y-2 text-sm text-gray-600 sm:grid-cols-4">
                <div><span className="font-semibold text-gray-900">{scope.filter((s) => s.name.trim()).length}</span> budget categories</div>
                <div><span className="font-semibold text-gray-900">{EXTRACTED_VENDORS.length}</span> vendors linked</div>
                <div><span className="font-semibold text-gray-900">2</span> quotes logged</div>
                <div><span className="font-semibold text-gray-900">{openFlags}</span> flags carried over</div>
              </div>
              <p className="max-w-lg text-xs text-gray-400">
                Scope items became Payables budget categories; verbal quotes landed on the Quotes tab as received; open flags
                appear on the project Dashboard. The raw notes and extraction output are stored with the project for auditing.
              </p>
              <div className="flex gap-2">
                <button onClick={() => { setStep("notes"); toast.info("Demo reset"); }} className="h-9 rounded-lg border border-[#DADADA] bg-white px-3 text-sm font-medium text-gray-700 hover:bg-gray-50">
                  Run demo again
                </button>
                {/* Points at the demo DB's real pergola project (id 1) so the demo flows on. */}
                <button onClick={() => navigate("/projects/1")} className="h-9 rounded-lg border border-[#013764] bg-white px-3 text-sm font-medium text-[#013764] hover:bg-[#013764]/5">
                  See a built-out project →
                </button>
                <button onClick={() => navigate("/projects")} className="h-9 rounded-lg bg-[#013764] px-3.5 text-sm font-medium text-white hover:bg-[#003a73]">
                  Back to Projects
                </button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </PageTemplate>
  );
}
