/** The only fields of a /maintenance/submissions/{id} payload that affect routing. */
export type SubmissionRouteInput = {
  fto_id?: number | string | null;
  FTOID?: number | string | null;
  ftoId?: number | string | null;
};

/**
 * Resolve the approve-page route for an fto_submissions row.
 *
 * A submission either hangs off an FTO (fto_id set) or is a standalone misc
 * expense (fto_id NULL — what ApproveFtoPage calls isMiscMode). Both are
 * viewable, they just live on different routes, both registered in App.tsx:
 *   /field-team-orders/approve/:ftoId
 *   /field-team-orders/approve/submission/:submissionId
 *
 * A submission id alone is always enough to route, so this never fails — the
 * old caller threw "FTO ID not found in submission" on every misc expense.
 */
export function approveRouteForSubmission(
  submissionId: number,
  submission: SubmissionRouteInput | null | undefined,
): string {
  const raw = submission?.fto_id ?? submission?.FTOID ?? submission?.ftoId;
  const ftoId = Number(raw);
  if (raw != null && Number.isFinite(ftoId) && ftoId > 0) {
    return `/field-team-orders/approve/${ftoId}`;
  }
  return `/field-team-orders/approve/submission/${submissionId}`;
}
