export type VoteStanding = {
  firstPostAt: number;
  latestVisiblePostAt: number;
};

export type VoteOutcome = "granted" | "kept" | "retracted" | "absent";

export type VoteReconciliation =
  | { outcome: "absent" }
  | { outcome: "granted"; standing: VoteStanding }
  | { outcome: "kept"; standing: VoteStanding }
  | { outcome: "retracted" };

export function desiredVote(
  visiblePostCreatedAts: readonly number[],
): VoteStanding | null {
  if (visiblePostCreatedAts.length === 0) {
    return null;
  }

  let firstPostAt = visiblePostCreatedAts[0];
  let latestVisiblePostAt = visiblePostCreatedAts[0];

  for (const createdAt of visiblePostCreatedAts.slice(1)) {
    firstPostAt = Math.min(firstPostAt, createdAt);
    latestVisiblePostAt = Math.max(latestVisiblePostAt, createdAt);
  }

  return { firstPostAt, latestVisiblePostAt };
}

export function reconcileVote(
  existing: VoteStanding | null,
  desired: VoteStanding | null,
): VoteReconciliation {
  if (desired === null) {
    return existing === null ? { outcome: "absent" } : { outcome: "retracted" };
  }
  if (existing === null) {
    return { outcome: "granted", standing: desired };
  }
  return { outcome: "kept", standing: desired };
}
