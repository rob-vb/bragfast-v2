import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.hourly("expire standing windows", internal.standing.expireWindows, {});

export default crons;
