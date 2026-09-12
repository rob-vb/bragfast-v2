export type AdderRow = {
  username: string;
  likeSum: number;
  spotCount: number;
  earliestAddAt: number;
};

export type AdderSpot = {
  username: string;
  likeCount: number;
  addedAt: number;
};

function foldAdderRows(spots: readonly AdderSpot[]): AdderRow[] {
  const byUser = new Map<string, AdderRow>();
  for (const spot of spots) {
    const existing = byUser.get(spot.username);
    if (!existing) {
      byUser.set(spot.username, {
        username: spot.username,
        likeSum: spot.likeCount,
        spotCount: 1,
        earliestAddAt: spot.addedAt,
      });
      continue;
    }
    existing.likeSum += spot.likeCount;
    existing.spotCount += 1;
    if (spot.addedAt < existing.earliestAddAt) {
      existing.earliestAddAt = spot.addedAt;
    }
  }
  return [...byUser.values()];
}

export function rankAdders(rows: readonly AdderRow[]): AdderRow[] {
  return [...rows]
    .filter((row) => row.spotCount > 0)
    .sort((a, b) => {
      if (b.likeSum !== a.likeSum) {
        return b.likeSum - a.likeSum;
      }
      if (b.spotCount !== a.spotCount) {
        return b.spotCount - a.spotCount;
      }
      return a.earliestAddAt - b.earliestAddAt;
    });
}

export function rankedLeaderboard(spots: readonly AdderSpot[]): AdderRow[] {
  return rankAdders(foldAdderRows(spots));
}
