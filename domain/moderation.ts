import type { GenericId } from "convex/values";
import type { PostVisibility } from "./post";

export type ReportStatus = "open" | "resolved";

export type ReportReviewAction = "restore" | "keepHidden";

export type ClosedOverrideAction = "close" | "reopen";

export type ReportReviewPlan =
  | {
      ok: true;
      reportStatus: "resolved";
      visibility: PostVisibility;
    }
  | { ok: false; reason: "not-open" | "not-hidden" | "wrong-report" };

export type ClosedOverridePlan =
  | {
      action: "close";
      listingStatus: "gravestone";
      closedAt: number;
    }
  | {
      action: "reopen";
      listingStatus: "listed";
    }
  | { ok: false; reason: "already-closed" | "already-listed" };

export function planReportReview(input: {
  reportStatus: ReportStatus;
  reportId: GenericId<"reports">;
  visibility: PostVisibility;
  action: ReportReviewAction;
}): ReportReviewPlan {
  if (input.reportStatus !== "open") {
    return { ok: false, reason: "not-open" };
  }
  if (input.visibility.kind !== "hidden") {
    return { ok: false, reason: "not-hidden" };
  }
  if (input.visibility.reportId !== input.reportId) {
    return { ok: false, reason: "wrong-report" };
  }
  if (input.action === "restore") {
    return { ok: true, reportStatus: "resolved", visibility: { kind: "visible" } };
  }
  return {
    ok: true,
    reportStatus: "resolved",
    visibility: input.visibility,
  };
}

export function planClosedOverride(input: {
  listingStatus: "listed" | "gravestone";
  action: ClosedOverrideAction;
  now: number;
}): ClosedOverridePlan {
  if (input.action === "close") {
    if (input.listingStatus === "gravestone") {
      return { ok: false, reason: "already-closed" };
    }
    return {
      action: "close",
      listingStatus: "gravestone",
      closedAt: input.now,
    };
  }
  if (input.listingStatus === "listed") {
    return { ok: false, reason: "already-listed" };
  }
  return { action: "reopen", listingStatus: "listed" };
}

export function isOwnerEmail(
  candidate: string | null | undefined,
  ownerEmail: string | undefined,
): boolean {
  if (!candidate || !ownerEmail) {
    return false;
  }
  return candidate.trim().toLowerCase() === ownerEmail.trim().toLowerCase();
}
