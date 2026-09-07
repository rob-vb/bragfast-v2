import type { BoardStanding, OpeningHours } from "./spot";
import type { VoteStanding } from "./vote";

export const RANKING_WINDOW_MS = 90 * 24 * 60 * 60 * 1000;

export function computeStanding(
  votes: readonly VoteStanding[],
  now: number,
): BoardStanding | null {
  const threshold = now - RANKING_WINDOW_MS;
  const active = votes.filter((vote) => vote.latestVisiblePostAt >= threshold);

  if (active.length === 0) {
    return null;
  }

  return {
    score: active.length,
    latestBragAt: Math.max(...active.map((vote) => vote.latestVisiblePostAt)),
    windowExpiresAt: Math.min(
      ...active.map((vote) => vote.latestVisiblePostAt + RANKING_WINDOW_MS),
    ),
  };
}

export function boardComparator(
  a: BoardStanding,
  b: BoardStanding,
): number {
  return b.score - a.score || b.latestBragAt - a.latestBragAt;
}

export function standingAsOf(
  standing: BoardStanding | null,
  now: number,
): BoardStanding | null {
  if (!standing || standing.windowExpiresAt < now) {
    return null;
  }
  return standing;
}

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

function minutesFromClock(value: string): number {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value);
  if (!match) {
    return Number.NaN;
  }
  return Number(match[1]) * 60 + Number(match[2]);
}

export function openNow(hours: OpeningHours | null, now: Date): boolean {
  if (!hours || hours.periods.length === 0) {
    return false;
  }

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: hours.timezone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);

  const weekday = parts.find((part) => part.type === "weekday")?.value;
  const hour = parts.find((part) => part.type === "hour")?.value;
  const minute = parts.find((part) => part.type === "minute")?.value;
  const day = weekday ? WEEKDAY_INDEX[weekday] : undefined;
  if (day === undefined || hour === undefined || minute === undefined) {
    return false;
  }

  const current = Number(hour) * 60 + Number(minute);
  return hours.periods.some((period) => {
    if (period.day !== day) {
      return false;
    }
    const open = minutesFromClock(period.open);
    const close = minutesFromClock(period.close);
    return Number.isFinite(open) && Number.isFinite(close) && current >= open && current < close;
  });
}
