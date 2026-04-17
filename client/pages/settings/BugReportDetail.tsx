import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import BlueButton from "@/components/BlueButton";
import { Textarea } from "@/components/ui/textarea";
import BugStatusBadge from "@/components/bugs/BugStatusBadge";
import BugSeverityBadge from "@/components/bugs/BugSeverityBadge";
import { addBugComment, getBug, type BugReport } from "@/data/bugs";
import { toast } from "sonner";

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function BugReportDetail() {
  const { bugId } = useParams<{ bugId: string }>();
  const [bug, setBug] = useState<BugReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!bugId) return;
    setLoading(true);
    getBug(bugId)
      .then(setBug)
      .catch((err) => {
        console.error("Failed to load bug", err);
        toast.error("Failed to load bug");
      })
      .finally(() => setLoading(false));
  }, [bugId]);

  if (loading) {
    return <div className="text-center py-16 text-gray-500">Loading bug…</div>;
  }

  if (!bug) {
    return (
      <div className="text-center py-16 text-gray-500">
        Bug not found.{" "}
        <Link to="/settings/bugs" className="text-[#013764] hover:underline">Back to Bug Reports</Link>
      </div>
    );
  }

  const handleAddComment = async () => {
    if (!comment.trim() || !bugId) return;
    setSubmitting(true);
    try {
      const newComment = await addBugComment(bugId, comment.trim());
      setBug({ ...bug, comments: [...bug.comments, newComment], updatedAt: newComment.createdAt });
      setComment("");
    } catch (err) {
      console.error("Failed to add comment", err);
      toast.error("Failed to add comment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link to="/settings/bugs" className="text-sm text-[#013764] hover:underline">
          ← Back to Bug Reports
        </Link>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{bug.title}</h2>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <BugStatusBadge status={bug.status} />
            <BugSeverityBadge severity={bug.severity} />
            <span className="text-xs text-gray-500">{bug.module}</span>
            <span className="text-xs text-gray-400">·</span>
            <span className="text-xs text-gray-500">
              Reported by {bug.reporterName} on {formatDateTime(bug.createdAt)}
            </span>
          </div>
        </div>
        {bug.notionPageUrl && (
          <a
            href={bug.notionPageUrl}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-[#013764] hover:underline"
          >
            View in Notion ↗
          </a>
        )}
      </div>

      <section className="border border-gray-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Description</h3>
        <pre className="text-sm text-gray-800 whitespace-pre-wrap font-sans">{bug.description}</pre>
      </section>

      {bug.attachments.length > 0 && (
        <section className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Screenshots</h3>
          <div className="flex flex-wrap gap-3">
            {bug.attachments.map((a) => (
              <div key={a.id} className="w-32 h-32 bg-gray-100 rounded border border-gray-200 flex items-center justify-center text-xs text-gray-500 text-center px-2">
                {a.url ? (
                  <img src={a.url} alt={a.filename} className="w-full h-full object-cover rounded" />
                ) : (
                  a.filename
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="border border-gray-200 rounded-lg">
        <details className="group">
          <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-gray-900 flex items-center justify-between">
            <span>Technical context</span>
            <span className="text-xs text-gray-500 group-open:hidden">Show</span>
            <span className="text-xs text-gray-500 hidden group-open:inline">Hide</span>
          </summary>
          <div className="px-4 py-3 border-t border-gray-200 text-xs text-gray-700 space-y-1 bg-gray-50">
            <div><span className="text-gray-500">URL:</span> {bug.technicalContext.url}</div>
            <div><span className="text-gray-500">Viewport:</span> {bug.technicalContext.viewport}</div>
            <div><span className="text-gray-500">Role:</span> {bug.technicalContext.userRole}</div>
            <div className="truncate"><span className="text-gray-500">User Agent:</span> {bug.technicalContext.userAgent}</div>
            <div><span className="text-gray-500">Captured at:</span> {formatDateTime(bug.technicalContext.capturedAt)}</div>
            {bug.technicalContext.consoleLogs.length > 0 && (
              <div className="mt-2">
                <div className="text-gray-500 mb-1">Console ({bug.technicalContext.consoleLogs.length} entries):</div>
                <pre className="max-h-48 overflow-auto bg-white border border-gray-200 rounded p-2 text-[11px] leading-tight">
                  {bug.technicalContext.consoleLogs.map((l, i) => (
                    <div key={i}>
                      <span className="text-gray-400">[{l.level}]</span> {l.message}
                    </div>
                  ))}
                </pre>
              </div>
            )}
          </div>
        </details>
      </section>

      <section className="border border-gray-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">
          Comments ({bug.comments.length})
        </h3>
        <div className="flex flex-col gap-3 mb-4">
          {bug.comments.length === 0 ? (
            <p className="text-sm text-gray-500">No comments yet.</p>
          ) : (
            bug.comments.map((c) => (
              <div key={c.id} className="border border-gray-100 rounded-md p-3 bg-gray-50">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-sm font-medium text-gray-900">
                    {c.authorName}{" "}
                    <span className="text-xs text-gray-500 font-normal">· {c.authorRole}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {c.source === "notion" && (
                      <span className="text-[10px] uppercase tracking-wide bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
                        from Notion
                      </span>
                    )}
                    <span className="text-xs text-gray-500">{formatDateTime(c.createdAt)}</span>
                  </div>
                </div>
                <p className="text-sm text-gray-800 whitespace-pre-wrap">{c.body}</p>
              </div>
            ))
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add a comment… (will sync to Notion)"
            rows={3}
          />
          <div className="flex justify-end">
            <BlueButton onClick={handleAddComment} disabled={!comment.trim() || submitting}>
              {submitting ? "Posting…" : "Add Comment"}
            </BlueButton>
          </div>
        </div>
      </section>
    </div>
  );
}
