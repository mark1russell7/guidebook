// The dates of the add-on. A date is `YYYY-MM-DD` in UTC, as in the core.

import { DAY_MS, timeOf } from "@mark1russell7/guidebook";

/** This function gives the date `YYYY-MM-DD` that is `days` after the date `date`. */
export function addDays(date: string, days: number): string {
  const time = timeOf(date);
  if (time === undefined) throw new RangeError(`addDays: "${date}" is not a date YYYY-MM-DD.`);
  return new Date(time + days * DAY_MS).toISOString().slice(0, 10);
}
