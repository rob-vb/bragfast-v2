export type LeaderboardRow = {
  username: string;
  /** Likes on spots this account added plus likes through its photos, each once. */
  likeSum: number;
  spotCount: number;
  photoCount: number;
  /** When the account first added a spot or posted a photo. */
  since: number;
};

/** The catalog as the board reads it; accounts are usernames. */
export type LeaderboardInput = {
  spots: readonly { id: string; addedBy: string | null; addedAt: number }[];
  photos: readonly { id: string; uploadedBy: string | null; createdAt: number }[];
  likes: readonly { spotId: string; viaPhotoId?: string }[];
};

function foldLeaderboardRows(input: LeaderboardInput): LeaderboardRow[] {
  const byUser = new Map<string, LeaderboardRow>();
  const rowOf = (username: string, at: number) => {
    const row = byUser.get(username) ?? {
      username,
      likeSum: 0,
      spotCount: 0,
      photoCount: 0,
      since: at,
    };
    row.since = Math.min(row.since, at);
    byUser.set(username, row);
    return row;
  };

  const adderOf = new Map<string, string>();
  for (const spot of input.spots) {
    if (spot.addedBy !== null) {
      adderOf.set(spot.id, spot.addedBy);
      rowOf(spot.addedBy, spot.addedAt).spotCount += 1;
    }
  }
  const uploaderOf = new Map<string, string>();
  for (const photo of input.photos) {
    if (photo.uploadedBy !== null) {
      uploaderOf.set(photo.id, photo.uploadedBy);
      rowOf(photo.uploadedBy, photo.createdAt).photoCount += 1;
    }
  }
  for (const like of input.likes) {
    // The adder and the credited photographer each earn it; one person once
    const earners = new Set<string>();
    const adder = adderOf.get(like.spotId);
    if (adder !== undefined) {
      earners.add(adder);
    }
    const uploader =
      like.viaPhotoId === undefined ? undefined : uploaderOf.get(like.viaPhotoId);
    if (uploader !== undefined) {
      earners.add(uploader);
    }
    for (const username of earners) {
      const row = byUser.get(username);
      if (row) {
        row.likeSum += 1;
      }
    }
  }
  return [...byUser.values()];
}

/**
 * Most likes first, then most spots added, then whoever joined in first. An
 * account shows once it added a spot or earned a like.
 */
export function rankLeaderboard(rows: readonly LeaderboardRow[]): LeaderboardRow[] {
  return [...rows]
    .filter((row) => row.spotCount > 0 || row.likeSum > 0)
    .sort((a, b) => {
      if (b.likeSum !== a.likeSum) {
        return b.likeSum - a.likeSum;
      }
      if (b.spotCount !== a.spotCount) {
        return b.spotCount - a.spotCount;
      }
      return a.since - b.since;
    });
}

export function rankedLeaderboard(input: LeaderboardInput): LeaderboardRow[] {
  return rankLeaderboard(foldLeaderboardRows(input));
}

export type LeaderboardStanding = { rank: number; likeSum: number };

/** Where an account stands on a ranked board, or null when it is absent. */
export function standingOf(
  ranked: readonly LeaderboardRow[],
  username: string,
): LeaderboardStanding | null {
  const index = ranked.findIndex((row) => row.username === username);
  if (index === -1) {
    return null;
  }
  return { rank: index + 1, likeSum: ranked[index].likeSum };
}
