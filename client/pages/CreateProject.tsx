import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import PageTemplate from "@/layout/PageTemplate";
import { fetchJSON } from "@/api/fetchJSON";
import {
  createProject,
  listUnassignedTasks,
  formatUSD,
  type CreateProjectPayload,
  type ProjectStatus,
  type UnassignedTask,
} from "@/data/projects";
import {
  BudgetEditor,
  MilestonesEditor,
  budgetTotalCents,
  dollarsToCents,
  type CategoryDraft,
  type MilestoneDraft,
} from "@/components/projects/ProjectEditors";

interface SimpleProperty {
  id: number;
  name: string;
  address_line1: string | null;
  city: string | null;
  state: string | null;
}

interface SimpleManager {
  id: number;
  name: string;
  initials: string;
}

const field =
  "w-full rounded-lg border border-[#DADADA] px-3 py-2 text-sm text-gray-900 focus:border-[#013764] focus:outline-none";
const smallField =
  "rounded-md border border-[#DADADA] px-2.5 py-1.5 text-sm text-gray-900 focus:border-[#013764] focus:outline-none";
const label = "text-xs font-medium text-gray-600";

function propertyLabel(p: SimpleProperty) {
  const address = [p.address_line1, p.city, p.state].filter(Boolean).join(", ");
  return address ? `${p.name} — ${address}` : p.name;
}

function initialsFromName(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-[0_1px_2px_0_rgba(0,0,0,0.03)]">
      <div className="border-b border-gray-100 px-5 py-4">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export default function CreateProject() {
  const navigate = useNavigate();
  const seq = useRef(1);
  const nextId = () => seq.current++;

  const [name, setName] = useState("");
  const [propertyId, setPropertyId] = useState<number | "">("");
  const [status, setStatus] = useState<ProjectStatus>("planning");
  const [managerUserId, setManagerUserId] = useState<number | "">("");
  const [startDate, setStartDate] = useState("");
  const [targetEndDate, setTargetEndDate] = useState("");
  const [description, setDescription] = useState("");
  const [categories, setCategories] = useState<CategoryDraft[]>([]);
  const [milestones, setMilestones] = useState<MilestoneDraft[]>([]);
  const [attached, setAttached] = useState<Set<number>>(new Set());
  const [taskMilestone, setTaskMilestone] = useState<Record<number, number | "">>({});

  const [properties, setProperties] = useState<SimpleProperty[]>([]);
  const [managers, setManagers] = useState<SimpleManager[]>([]);
  const [unassignedTasks, setUnassignedTasks] = useState<UnassignedTask[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setOptionsLoading(true);
    Promise.all([
      fetchJSON("/properties").catch(() => []),
      fetchJSON("/users/property-managers").catch(() => []),
      listUnassignedTasks().catch(() => []),
    ])
      .then(([propsRes, managersRes, tasksRes]) => {
        if (cancelled) return;
        setProperties(propsRes || []);
        setManagers(
          (managersRes || []).map((u: any) => {
            const uname = u.name || u.email || `User #${u.id}`;
            return { id: Number(u.id), name: uname, initials: initialsFromName(uname) };
          }),
        );
        setUnassignedTasks(tasksRes || []);
      })
      .catch((err) => {
        if (!cancelled)
          toast.error(err instanceof Error ? err.message : "Failed to load form options");
      })
      .finally(() => {
        if (!cancelled) setOptionsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const canCreate = name.trim().length > 0 && propertyId !== "" && !submitting;
  const totalBudgetCents = budgetTotalCents(categories);
  const subCount = categories.reduce((s, c) => s + c.subBudgets.length, 0);

  const toggleTask = (id: number) =>
    setAttached((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const suggestedTasks = useMemo(() => {
    if (propertyId === "") return unassignedTasks;
    return [...unassignedTasks].sort(
      (a, b) => Number(b.property_id === propertyId) - Number(a.property_id === propertyId),
    );
  }, [propertyId, unassignedTasks]);

  const selectedProperty =
    propertyId === "" ? undefined : properties.find((p) => p.id === propertyId);
  const selectedManager =
    managerUserId === "" ? undefined : managers.find((m) => m.id === managerUserId);

  const create = async () => {
    if (!canCreate) return;

    const categoryIndexById = new Map(categories.map((c, i) => [c.id, i]));
    const milestoneIndexById = new Map(milestones.map((m, i) => [m.id, i]));

    const budgetPayload: CreateProjectPayload["budget"] = categories.map((c) => {
      const hasSubs = c.subBudgets.length > 0;
      return {
        name: c.name.trim() || "Untitled category",
        amount_cents: hasSubs ? 0 : dollarsToCents(c.amount),
        ...(hasSubs
          ? {
              sub_budgets: c.subBudgets.map((s) => ({
                name: s.name.trim() || "Untitled",
                amount_cents: dollarsToCents(s.amount),
              })),
            }
          : {}),
      };
    });

    const milestonesPayload: CreateProjectPayload["milestones"] = milestones.map((m) => {
      const categoryIndex = m.categoryId != null ? categoryIndexById.get(m.categoryId) : undefined;
      return {
        name: m.name.trim() || "Untitled milestone",
        ...(m.targetDate ? { target_date: m.targetDate } : {}),
        status: m.status,
        ...(categoryIndex != null ? { budget_category_index: categoryIndex } : {}),
      };
    });

    const tasksPayload: CreateProjectPayload["tasks"] = Array.from(attached).map((taskId) => {
      const draftMilestoneId = taskMilestone[taskId];
      const milestoneIndex =
        draftMilestoneId !== "" && draftMilestoneId != null
          ? milestoneIndexById.get(draftMilestoneId)
          : undefined;
      return milestoneIndex != null
        ? { task_id: taskId, milestone_index: milestoneIndex }
        : { task_id: taskId };
    });

    const payload: CreateProjectPayload = {
      name: name.trim(),
      property_id: propertyId,
      status,
      ...(managerUserId !== "" ? { manager_user_id: managerUserId } : {}),
      ...(startDate ? { start_date: startDate } : {}),
      ...(targetEndDate ? { target_end_date: targetEndDate } : {}),
      ...(description.trim() ? { description: description.trim() } : {}),
      ...(budgetPayload.length ? { budget: budgetPayload } : {}),
      ...(milestonesPayload.length ? { milestones: milestonesPayload } : {}),
      ...(tasksPayload.length ? { tasks: tasksPayload } : {}),
    };

    setSubmitting(true);
    try {
      const created = await createProject(payload);
      navigate(`/projects/${created.project.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create project");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageTemplate>
      <div className="flex w-full flex-col">
        <button onClick={() => navigate("/projects")} className="mb-2 w-fit text-xs font-medium text-gray-400 hover:text-gray-600">
          ← Projects
        </button>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">New project</h1>
            <p className="text-sm text-gray-500">Start tracking a large job — add as much or as little as you know now.</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate("/projects")} className="h-9 rounded-lg border border-[#DADADA] bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
            <button onClick={create} disabled={!canCreate} className="h-9 rounded-lg bg-[#013764] px-4 text-sm font-medium text-white hover:bg-[#003a73] disabled:cursor-not-allowed disabled:opacity-50">{submitting ? "Creating…" : "Create project"}</button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px] items-start">
          {/* form column */}
          <div className="flex min-w-0 flex-col gap-6">
            <SectionCard title="Details">
              <div className="flex flex-col gap-4">
                <div>
                  <label htmlFor="cp-name" className={label}>Project name<span className="text-red-500" aria-hidden="true"> *</span></label>
                  <input id="cp-name" required aria-required="true" className={`${field} mt-1`} value={name} placeholder="e.g. Full Kitchen Renovation" onChange={(e) => setName(e.target.value)} autoFocus />
                </div>
                <div>
                  <label htmlFor="cp-property" className={label}>Property<span className="text-red-500" aria-hidden="true"> *</span></label>
                  <select
                    id="cp-property"
                    required
                    aria-required="true"
                    className={`${field} mt-1`}
                    value={propertyId}
                    onChange={(e) => setPropertyId(e.target.value === "" ? "" : Number(e.target.value))}
                    disabled={optionsLoading && properties.length === 0}
                  >
                    <option value="">
                      {optionsLoading && properties.length === 0 ? "Loading properties…" : "Select a property…"}
                    </option>
                    {properties.map((p) => (
                      <option key={p.id} value={p.id}>{propertyLabel(p)}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="cp-status" className={label}>Status</label>
                    <select id="cp-status" className={`${field} mt-1`} value={status} onChange={(e) => setStatus(e.target.value as ProjectStatus)}>
                      <option value="planning">Planning</option>
                      <option value="active">Active</option>
                      <option value="on_hold">On Hold</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="cp-manager" className={label}>Project manager</label>
                    <select
                      id="cp-manager"
                      className={`${field} mt-1`}
                      value={managerUserId}
                      onChange={(e) => setManagerUserId(e.target.value === "" ? "" : Number(e.target.value))}
                    >
                      <option value="">
                        {optionsLoading && managers.length === 0 ? "Loading…" : "Unassigned"}
                      </option>
                      {managers.map((m) => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="cp-start" className={label}>Start date</label>
                    <input id="cp-start" type="date" className={`${field} mt-1`} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                  </div>
                  <div>
                    <label htmlFor="cp-target" className={label}>Target end date</label>
                    <input id="cp-target" type="date" className={`${field} mt-1`} value={targetEndDate} onChange={(e) => setTargetEndDate(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label htmlFor="cp-desc" className={label}>Description</label>
                  <textarea id="cp-desc" rows={2} className={`${field} mt-1 resize-none`} value={description} placeholder="What is this project?" onChange={(e) => setDescription(e.target.value)} />
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Budget" subtitle="Break the budget into categories, and each category into sub-budgets. Totals roll up automatically.">
              <BudgetEditor categories={categories} onChange={setCategories} newId={nextId} />
            </SectionCard>

            <SectionCard title="Milestones" subtitle="Dated checkpoints to track progress. Optionally tie one to a budget category.">
              <MilestonesEditor milestones={milestones} categories={categories} onChange={setMilestones} newId={nextId} />
            </SectionCard>

            <SectionCard title="Attach existing tasks" subtitle="Pull standalone tasks into this project — optionally assign each to a milestone.">
              <div className="max-h-56 overflow-y-auto rounded-lg border border-gray-200 divide-y divide-gray-100">
                {optionsLoading && suggestedTasks.length === 0 && (
                  <p className="px-3 py-2 text-sm text-gray-400">Loading tasks…</p>
                )}
                {!optionsLoading && suggestedTasks.length === 0 && (
                  <p className="px-3 py-2 text-sm text-gray-400">No unassigned tasks available.</p>
                )}
                {suggestedTasks.map((t) => {
                  const checked = attached.has(t.id);
                  return (
                    <div key={t.id} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50">
                      <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
                        <input type="checkbox" checked={checked} onChange={() => toggleTask(t.id)} className="rounded" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm text-gray-900">{t.name}</span>
                          <span className="block truncate text-xs text-gray-500">{t.property_name}</span>
                        </span>
                      </label>
                      {checked && milestones.length > 0 && (
                        <select
                          aria-label={`Milestone for ${t.name}`}
                          value={taskMilestone[t.id] ?? ""}
                          onChange={(e) =>
                            setTaskMilestone((prev) => ({ ...prev, [t.id]: e.target.value === "" ? "" : Number(e.target.value) }))
                          }
                          className={`${smallField} max-w-[160px]`}
                        >
                          <option value="">No milestone</option>
                          {milestones.map((m, i) => (
                            <option key={m.id} value={m.id}>{m.name.trim() || `Milestone ${i + 1}`}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  );
                })}
              </div>
              {milestones.length === 0 && (
                <p className="mt-1 text-xs text-gray-400">Add milestones above to group these tasks by section.</p>
              )}
            </SectionCard>
          </div>

          {/* live summary rail */}
          <div className="lg:sticky lg:top-4">
            <div className="rounded-xl border border-gray-200 bg-white shadow-[0_1px_2px_0_rgba(0,0,0,0.03)]">
              <div className="border-b border-gray-100 px-5 py-4">
                <h3 className="text-sm font-semibold text-gray-900">Summary</h3>
              </div>
              <div className="flex flex-col gap-4 p-5 text-sm">
                <div>
                  <div className="text-xs uppercase tracking-wide text-gray-400">Total budget</div>
                  <div className="mt-0.5 text-2xl font-semibold tabular-nums text-gray-900">{formatUSD(totalBudgetCents)}</div>
                </div>
                <div className="grid grid-cols-3 gap-2 border-t border-gray-100 pt-3 text-center">
                  <div>
                    <div className="text-lg font-semibold text-gray-900">{categories.length}</div>
                    <div className="text-[11px] uppercase tracking-wide text-gray-400">Categories</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-gray-900">{subCount}</div>
                    <div className="text-[11px] uppercase tracking-wide text-gray-400">Sub-budgets</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-gray-900">{milestones.length}</div>
                    <div className="text-[11px] uppercase tracking-wide text-gray-400">Milestones</div>
                  </div>
                </div>
                <div className="border-t border-gray-100 pt-3 text-gray-600">
                  <div className="flex justify-between py-0.5">
                    <span className="text-gray-500">Property</span>
                    <span className="text-right text-gray-800">{selectedProperty ? propertyLabel(selectedProperty).split(" — ")[0] : "—"}</span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="text-gray-500">Manager</span>
                    <span className="text-gray-800">{selectedManager ? selectedManager.name : "Unassigned"}</span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="text-gray-500">Tasks attached</span>
                    <span className="text-gray-800">{attached.size}</span>
                  </div>
                </div>
                <button onClick={create} disabled={!canCreate} className="h-9 w-full rounded-lg bg-[#013764] text-sm font-medium text-white hover:bg-[#003a73] disabled:cursor-not-allowed disabled:opacity-50">{submitting ? "Creating…" : "Create project"}</button>
                {!canCreate && !submitting && <p className="text-center text-xs text-gray-400">Add a name and property to create.</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTemplate>
  );
}
