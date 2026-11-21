// The cited rates of loss of the kinds of media, for the plan of copies of the library add-on.
// The rates come from drives that run all the time in a data center. A drive that sits with no power can be different.

import type { CitedUnit } from "@mark1russell7/guidebook";
import type { MediumKind } from "@mark1russell7/guidebook-library";

/** The fact units of the rates. */
export const MEDIA_UNITS: readonly CitedUnit[] = [
  {
    id: "media.hdd.afr",
    use: "fact",
    text: "The lifetime annualized failure rate of all the hard drives of Backblaze is 1.41%, to 2026-06-30.",
    source: "backblaze-hdd-2026q2",
    locator: "The lifetime table, the row Totals",
  },
  {
    id: "media.ssd.afr",
    use: "fact",
    text: "The lifetime annualized failure rate of all the SSD boot drives of Backblaze is 0.90%, from Q4 2018 to Q2 2023.",
    source: "backblaze-ssd-2023",
    locator: "The section of the lifetime rates",
  },
];

/** The yearly loss of each kind with a cited rate, and the unit of the rate. */
export const MEDIUM_LOSSES: Readonly<Partial<Record<MediumKind, { readonly yearlyLoss: number; readonly unit: string }>>> = {
  hdd: { yearlyLoss: 0.0141, unit: "media.hdd.afr" },
  ssd: { yearlyLoss: 0.009, unit: "media.ssd.afr" },
};

/** The kinds with no cited rate. A plan of copies cannot use them until a source gives a rate. */
export const MEDIUM_GAPS: readonly MediumKind[] = ["flash", "optical", "paper"];
