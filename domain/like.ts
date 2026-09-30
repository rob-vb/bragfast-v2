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

/** A gallery photo as the like credit sees it. */
export type CreditPhoto = {
  id: string;
  spotId: string;
  uploadedBy: string;
};

/**
 * The photo a new like credits: the one in view when the visitor tapped,
 * else the spot's hero. A visitor never credits their own photo. The credit
 * moves no rank; the like counts for the spot either way.
 */
export function pickLikeCredit(input: {
  likerId: string;
  spotId: string;
  inView: CreditPhoto | null;
  hero: CreditPhoto | null;
}): string | null {
  const photo = input.inView ?? input.hero;
  if (
    photo === null ||
    photo.spotId !== input.spotId ||
    photo.uploadedBy === input.likerId
  ) {
    return null;
  }
  return photo.id;
}

/** How many likes each photo brought its spot, keyed by photo id. */
export function likesBroughtByPhoto(
  likes: readonly { viaPhotoId?: string }[],
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const like of likes) {
    if (like.viaPhotoId !== undefined) {
      counts.set(like.viaPhotoId, (counts.get(like.viaPhotoId) ?? 0) + 1);
    }
  }
  return counts;
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

export type CityBoardSortKey = "likes" | "name";
export type CityBoardSortDir = "desc" | "asc";

export type CityBoardSort = {
  readonly key: CityBoardSortKey;
  readonly dir: CityBoardSortDir;
};

export const DEFAULT_CITY_BOARD_SORT: CityBoardSort = {
  key: "likes",
  dir: "desc",
};

export type CityBoardSortable = CityBoardRank & { name: string };

export function parseCityBoardSort(key: string, dir: string): CityBoardSort {
  return {
    key: key === "name" || key === "likes" ? key : "likes",
    dir: dir === "asc" || dir === "desc" ? dir : "desc",
  };
}

export function applyCityBoardSort<T extends CityBoardSortable>(
  spots: readonly T[],
  sort: CityBoardSort,
  collator: Intl.Collator,
): T[] {
  if (sort.key === "likes") {
    const ranked = sortCityBoard(spots);
    return sort.dir === "desc" ? ranked : ranked.reverse();
  }
  const copy = [...spots];
  copy.sort((a, b) => collator.compare(a.name, b.name));
  return sort.dir === "asc" ? copy : copy.reverse();
}
