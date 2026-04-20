import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import BlueButton from "@/components/BlueButton";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import BugStatusBadge from "@/components/bugs/BugStatusBadge";
import BugSeverityBadge from "@/components/bugs/BugSeverityBadge";
import ReportBugModal from "@/components/bugs/ReportBugModal";
import {
  listBugs,
  BUG_MODULES,
  BUG_STATUSES,
  type BugReport,
  type BugStatus,
  type BugModule,
} from "@/data/bugs";
import { useAuth } from "@/auth/useAuth";
import { toast } from "sonner";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function BugReports() {
  const { userId } = useAuth();
  const [bugs, setBugs] = useState<BugReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<BugStatus | "all">("all");
  const [moduleFilter, setModuleFilter] = useState<BugModule | "all">("all");
  const [mineOnly, setMineOnly] = useState(false);

  const reload = async () => {
    try {
      const data = await listBugs({
        status: statusFilter,
        module: moduleFilter,
        mine: mineOnly,
        search: search.trim() || undefined,
      });
      setBugs(data);
    } catch (err) {
      console.error("Failed to load bugs", err);
      toast.error("Failed to load bugs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, moduleFilter, mineOnly]);

  // debounce search a bit
  useEffect(() => {
    const t = setTimeout(reload, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const filtered = bugs;

  const handleCreated = (b: BugReport) => {
    setBugs((prev) => [b, ...prev]);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Bug Reports</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {filtered.length} {filtered.length === 1 ? "bug" : "bugs"}
            {(statusFilter !== "all" || moduleFilter !== "all" || mineOnly || search) ? " matching filters" : " total"}
          </p>
        </div>
        <BlueButton onClick={() => setModalOpen(true)}>+ Report a Bug</BlueButton>
      </div>

      <div className="border border-gray-200 rounded-lg bg-white overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-gray-200 bg-gray-50">
          <Input
            placeholder="Search bug titel…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 h-9 bg-white"
          />
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as BugStatus | "all")}>
            <SelectTrigger className="w-40 h-9 bg-white"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent className="bg-white border border-gray-200 shadow-md rounded-md">
              <SelectItem value="all">All statuses</SelectItem>
              {BUG_STATUSES.map((s) => (
                <SelectItem key={s} value={s} className="capitalize">{s.replace("_", " ")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={moduleFilter} onValueChange={(v) => setModuleFilter(v as BugModule | "all")}>
            <SelectTrigger className="w-40 h-9 bg-white"><SelectValue placeholder="Module" /></SelectTrigger>
            <SelectContent className="bg-white border border-gray-200 shadow-md rounded-md">
              <SelectItem value="all">All modules</SelectItem>
              {BUG_MODULES.map((m) => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <label className="flex items-center gap-2 text-sm text-gray-700 ml-1 cursor-pointer">
            <input
              type="checkbox"
              checked={mineOnly}
              onChange={(e) => setMineOnly(e.target.checked)}
              className="rounded border-gray-300"
            />
            Mine only
          </label>
        </div>

        <table className="w-full text-sm">
          <thead className="text-gray-500 text-xs uppercase tracking-wide">
            <tr className="border-b border-gray-200">
              <th className="text-left px-4 py-2.5 font-medium">Title</th>
              <th className="text-left px-4 py-2.5 font-medium">Module</th>
              <th className="text-left px-4 py-2.5 font-medium">Severity</th>
              <th className="text-left px-4 py-2.5 font-medium">Status</th>
              <th className="text-left px-4 py-2.5 font-medium">Reporter</th>
              <th className="text-left px-4 py-2.5 font-medium">Created</th>
              <th className="text-left px-4 py-2.5 font-medium">Updated</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-16 text-center text-gray-500">
                  Loading bugs…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-16 text-center text-gray-500">
                  No bugs match your filters.
                </td>
              </tr>
            ) : (
              filtered.map((b) => (
                <tr key={b.id} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link to={`/settings/bugs/${b.id}`} className="text-gray-900 hover:text-[#013764] font-medium">
                      {b.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{b.module}</td>
                  <td className="px-4 py-3"><BugSeverityBadge severity={b.severity} /></td>
                  <td className="px-4 py-3"><BugStatusBadge status={b.status} /></td>
                  <td className="px-4 py-3 text-gray-700">{b.reporterName}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(b.createdAt)}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(b.updatedAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ReportBugModal open={modalOpen} onOpenChange={setModalOpen} onCreated={handleCreated} />
    </div>
  );
}
