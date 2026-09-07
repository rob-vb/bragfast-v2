import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.hourly("expire standing windows", internal.standing.expireWindows, {});
crons.daily(
  "catalog hygiene",
  { hourUTC: 3, minuteUTC: 0 },
  internal.ingest.refreshCatalog,
  {},
);
crons.daily(
  "instagram import",
  { hourUTC: 4, minuteUTC: 0 },
  internal.instagram.importLinked,
  {},
);

export default crons;
