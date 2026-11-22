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
  {
    id: "media.optical.life",
    use: "fact",
    text: "The NIST and Library of Congress study defines the life expectancy of a disc as the time to 5% failure (95% survival), with 95% confidence, at 25 °C and 50% RH.",
    source: "nist-lc-optical",
    locator: "Section 5, Life Expectancy",
  },
  {
    id: "media.optical.cdr",
    use: "fact",
    text: "All 7 CD-R products of the study had a life expectancy of more than 30 years. 5 of them had more than 45 years.",
    source: "nist-lc-optical",
    locator: "Section 5, Recordable CD, and Fig. 5",
  },
  {
    id: "media.optical.dvd",
    use: "fact",
    text: "Of the 15 recordable DVD products of the study, 7 had a life expectancy of more than 45 years, 4 had 30 to 45 years, 2 had 15 to 30 years and 2 had less than 15 years.",
    source: "nist-lc-optical",
    locator: "Section 5, Recordable and rewritable DVD, and Fig. 6",
  },
  {
    id: "media.optical.limits",
    use: "fact",
    text: "The study modeled only temperature and relative humidity. It did not model light, corrosive gases, contaminants, mishandling or the playback device.",
    source: "nist-lc-optical",
    locator: "Section 1, Introduction",
  },
];

/** The yearly loss of each kind with a cited rate, and the unit of the rate. */
export const MEDIUM_LOSSES: Readonly<Partial<Record<MediumKind, { readonly yearlyLoss: number; readonly unit: string }>>> = {
  hdd: { yearlyLoss: 0.0141, unit: "media.hdd.afr" },
  ssd: { yearlyLoss: 0.009, unit: "media.ssd.afr" },
};

/**
 * The kinds with no cited rate. A plan of copies cannot use them until a source gives a rate.
 * - `optical`: the study of NIST and the Library of Congress gives a time to 5% failure, not a yearly rate. The units `media.optical.*` give its facts.
 *   An aging disc fails more frequently when it is old, so a constant yearly rate from that time is not a safe bound.
 * - `flash` and `paper`: no open source with a rate was found on 2026-11-22.
 */
export const MEDIUM_GAPS: readonly MediumKind[] = ["flash", "optical", "paper"];
