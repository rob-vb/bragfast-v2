export type LikeRow = {
  userId: string;
  spotId: string;
};

export type LikeCommand = {
  action: "like" | "unlike";
  userId: string;
  spotId: string;
};

export type LikeTogglePlan = { action: "like" } | { action: "unlike" };

export type CityBoardRank = {
  likeCount: number;
  lastLikedAt: number;
  addedAt: number;
};

function sameLike(row: LikeRow, userId: string, spotId: string): boolean {
  return row.userId === userId && row.spotId === spotId;
}

export function planLikeToggle(existing: LikeRow | null): LikeTogglePlan {
  return existing === null ? { action: "like" } : { action: "unlike" };
}

export function applyLikeCommand(
  rows: readonly LikeRow[],
  command: LikeCommand,
): LikeRow[] {
  const others = rows.filter(
    (row) => !sameLike(row, command.userId, command.spotId),
  );
  if (command.action === "unlike") {
    return others;
  }
  return [...others, { userId: command.userId, spotId: command.spotId }];
}

export function likeCountFor(
  rows: readonly LikeRow[],
  spotId: string,
): number {
  return rows.filter((row) => row.spotId === spotId).length;
}

export function sortCityBoard<T extends CityBoardRank>(spots: readonly T[]): T[] {
  return [...spots].sort((a, b) => {
    if (b.likeCount !== a.likeCount) {
      return b.likeCount - a.likeCount;
    }
    if (b.lastLikedAt !== a.lastLikedAt) {
      return b.lastLikedAt - a.lastLikedAt;
    }
    return b.addedAt - a.addedAt;
  });
}
