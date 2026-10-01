import type { GenericId } from "convex/values";

export type ReportStatus = "open" | "resolved";

export type ReportReviewAction = "restore" | "keepHidden";

export type ClosedOverrideAction = "close" | "reopen";

export type ReportReviewPlan =
  | { ok: true; reportStatus: "resolved" }
  | { ok: false; reason: "not-open" };

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
  action: ReportReviewAction;
}): ReportReviewPlan {
  if (input.reportStatus !== "open") {
    return { ok: false, reason: "not-open" };
  }
  return { ok: true, reportStatus: "resolved" };
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

/** Why a visitor reports a photo. Offensive covers illegal too. */
export const PHOTO_REPORT_REASONS = ["offensive", "spam", "wrong-spot"] as const;

export type PhotoReportReason = (typeof PHOTO_REPORT_REASONS)[number];

export function isPhotoReportReason(value: string): value is PhotoReportReason {
  return (PHOTO_REPORT_REASONS as readonly string[]).includes(value);
}

export type PhotoReportPlan =
  | { action: "hide" }
  | { action: "record" }
  | { action: "reject"; reason: "missing" | "own-photo" | "already-reported" };

/**
 * A report hides the photo pending owner review. A second report on a photo
 * already hidden only adds to the queue; one viewer reports a photo once.
 */
export function planPhotoReport(input: {
  exists: boolean;
  ownPhoto: boolean;
  hidden: boolean;
  reportedByViewer: boolean;
}): PhotoReportPlan {
  if (!input.exists) {
    return { action: "reject", reason: "missing" };
  }
  if (input.ownPhoto) {
    return { action: "reject", reason: "own-photo" };
  }
  if (input.reportedByViewer) {
    return { action: "reject", reason: "already-reported" };
  }
  return input.hidden ? { action: "record" } : { action: "hide" };
}

export type BlockUploaderPlan =
  | { action: "block" }
  | { action: "noop" }
  | { action: "reject"; reason: "missing" | "own-photo" };

export function planBlockUploader(input: {
  exists: boolean;
  ownPhoto: boolean;
  alreadyBlocked: boolean;
}): BlockUploaderPlan {
  if (!input.exists) {
    return { action: "reject", reason: "missing" };
  }
  if (input.ownPhoto) {
    return { action: "reject", reason: "own-photo" };
  }
  return input.alreadyBlocked ? { action: "noop" } : { action: "block" };
}

/**
 * The spot's photo as one viewer sees it: the hero unless it is hidden or
 * by someone they blocked, else the oldest photo they may see.
 */
export function pickViewerHero<P extends {
  storageId: string;
  uploadedBy: string;
  createdAt: number;
  hidden: boolean;
}>(input: {
  heroStorageId: string | null;
  photos: readonly P[];
  blocked: ReadonlySet<string>;
}): P | null {
  const visible = input.photos.filter(
    (photo) => !photo.hidden && !input.blocked.has(photo.uploadedBy),
  );
  const hero = visible.find((photo) => photo.storageId === input.heroStorageId);
  if (hero) {
    return hero;
  }
  return [...visible].sort((a, b) => a.createdAt - b.createdAt)[0] ?? null;
}
