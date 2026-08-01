import { useEffect, useState } from "react";
import { ModalTemplate, ModalButtons } from "@/components/ui/ModalTemplate";
import { FieldShell } from "@/components/forms/FieldShell";
import { Input } from "@/components/ui/input";
import { authFetch, fetchJSON } from "@/api/fetchJSON";

interface PropertyOption {
  id: number;
  name: string;
}

interface TaskOption {
  id: number;
  name: string;
}

interface CreateMiscExpenseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Called with the new submission id; caller decides where to navigate
  // (typically the Approve page in misc mode).
  onCreated: (submissionId: number) => void;
}

const todayISO = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

// Quick-create modal for the PM-side misc expense flow. Captures property +
// date, hits POST /maintenance/submissions/misc to create an empty
// submission, then hands the id back so the caller can navigate to the
// approve page where the PM fills in expense rows + creates bills inline.
export default function CreateMiscExpenseModal({
  open,
  onOpenChange,
  onCreated,
}: CreateMiscExpenseModalProps) {
  const [propertyId, setPropertyId] = useState<number | null>(null);
  const [taskId, setTaskId] = useState<number | null>(null);
  const [dateOfWork, setDateOfWork] = useState<string>("");
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [tasks, setTasks] = useState<TaskOption[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setPropertyId(null);
      setTaskId(null);
      setTasks([]);
      setDateOfWork("");
      setError(null);
      return;
    }
    setDateOfWork(todayISO());

    let cancelled = false;
    setLoadingProperties(true);
    fetchJSON("/properties?limit=500")
      .then((res) => {
        if (cancelled) return;
        const list = Array.isArray(res) ? res : (res?.data ?? []);
        const opts: PropertyOption[] = list
          .map((p: any) => ({ id: Number(p.id), name: String(p.name ?? "") }))
          .filter((p: PropertyOption) => p.id > 0 && p.name)
          .sort((a: PropertyOption, b: PropertyOption) => a.name.localeCompare(b.name));
        setProperties(opts);
      })
      .catch((err) => {
        if (cancelled) return;
        setError("Failed to load properties: " + (err?.message ?? String(err)));
      })
      .finally(() => {
        if (!cancelled) setLoadingProperties(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  // Tasks are property-scoped, so they load only after a property is picked and
  // reset whenever it changes — the backend rejects a task from another property.
  useEffect(() => {
    if (!open || propertyId == null) {
      setTasks([]);
      return;
    }
    let cancelled = false;
    setLoadingTasks(true);
    fetchJSON(`/maintenance/tasks?property_id=${propertyId}&limit=200`)
      .then((res) => {
        if (cancelled) return;
        const list = Array.isArray(res) ? res : (res?.data ?? []);
        setTasks(
          list
            .map((t: any) => ({
              id: Number(t.id),
              name: String(t.name ?? "").trim() || `Task #${t.id}`,
            }))
            .filter((t: TaskOption) => t.id > 0),
        );
      })
      .catch(() => {
        if (!cancelled) setTasks([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingTasks(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, propertyId]);

  const handleSubmit = async () => {
    setError(null);
    if (!propertyId) {
      setError("Property is required.");
      return;
    }
    if (!dateOfWork) {
      setError("Date is required.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await authFetch("/maintenance/submissions/misc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          property_id: propertyId,
          date_of_work: dateOfWork,
          // Optional: links the expense to a task so it lands on that task's
          // project cost and billables. Omitted when no task is chosen.
          ...(taskId != null && { task_id: taskId }),
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Create failed (${res.status})`);
      }
      const data = await res.json();
      const id = Number(data?.submission_id);
      if (!Number.isFinite(id) || id <= 0) {
        throw new Error("Server did not return a submission id.");
      }
      onCreated(id);
      onOpenChange(false);
    } catch (err: any) {
      setError(err?.message ?? String(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalTemplate
      open={open}
      onOpenChange={onOpenChange}
      title="Create Misc Expense"
      size="sm"
      footer={
        <ModalButtons
          onCancel={() => onOpenChange(false)}
          onConfirm={handleSubmit}
          cancelLabel="Cancel"
          confirmLabel={submitting ? "Creating…" : "Create & Approve"}
          cancelDisabled={submitting}
        />
      }
    >
      <div className="text-sm text-[#717179] mb-4">
        Pick a property and date. We'll create an empty misc-expense submission
        and take you to the Approve page where you add the actual expense rows.
      </div>

      <div style={{ marginBottom: 12 }}>
        <FieldShell label="Property" htmlFor="cme-property">
          <select
            id="cme-property"
            value={propertyId == null ? "" : String(propertyId)}
            onChange={(e) => {
              setPropertyId(e.target.value ? Number(e.target.value) : null);
              setTaskId(null); // tasks are property-scoped
            }}
            disabled={loadingProperties || submitting}
            className="w-full rounded-md border border-[#DADADA] bg-white px-3 py-2 text-sm outline-none focus:border-[#013764]"
          >
            <option value="">{loadingProperties ? "Loading…" : "Select a property"}</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </FieldShell>
      </div>

      <div style={{ marginBottom: 12 }}>
        <FieldShell label="Task (optional)" htmlFor="cme-task">
          <select
            id="cme-task"
            value={taskId == null ? "" : String(taskId)}
            onChange={(e) => setTaskId(e.target.value ? Number(e.target.value) : null)}
            disabled={propertyId == null || loadingTasks || submitting}
            className="w-full rounded-md border border-[#DADADA] bg-white px-3 py-2 text-sm outline-none focus:border-[#013764] disabled:bg-gray-50 disabled:text-[#9CA3AF]"
          >
            <option value="">
              {propertyId == null
                ? "Select a property first"
                : loadingTasks
                  ? "Loading…"
                  : tasks.length === 0
                    ? "No tasks for this property"
                    : "No task"}
            </option>
            {tasks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </FieldShell>
        <div className="mt-1 text-xs text-[#717179]">
          Linking a task puts this expense on that task's project — counted as
          project cost and billable to the owner on project invoices.
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <FieldShell label="Date" htmlFor="cme-date">
          <Input
            id="cme-date"
            type="date"
            value={dateOfWork}
            onChange={(e) => setDateOfWork(e.target.value)}
            disabled={submitting}
          />
        </FieldShell>
      </div>

      {error && <div className="text-sm text-red-600 mt-2 whitespace-pre-wrap">{error}</div>}
    </ModalTemplate>
  );
}
