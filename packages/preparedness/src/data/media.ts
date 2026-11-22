// The cited rates of loss of the kinds of media, for the plan of copies of the library add-on.
// The rates come from drives that run all the time in a data center. A drive that sits with no power can be different.

import type { CitedUnit } from "@mark1russell7/guidebook";
import type { MediumKind, MediumLife } from "@mark1russell7/guidebook-library";

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
 * The cited life of each type of medium with a life at a quantile, and the unit of the life.
 * A disc fails more frequently when it is old, so the plan uses the life, not a yearly rate. Give it to `MediumOffer.life` and `Copy.life`.
 * - `cd-r`: each of the 7 CD-R products of the study had a time to 5% failure of more than 30 years.
 * - A recordable DVD has no life here. 2 of the 15 DVD products had less than 15 years, so the study gives no bound for an unknown product.
 * The life holds only at 25 °C and 50% RH, away from light (the unit `media.optical.limits`).
 */
export const MEDIUM_LIVES: Readonly<Record<string, { readonly kind: MediumKind; readonly life: MediumLife; readonly unit: string }>> = {
  "cd-r": {
    kind: "optical",
    life: { years: 30, quantile: 0.05, source: "NIST and the Library of Congress: a CD-R at 25 °C and 50% RH, with 95% confidence." },
    unit: "media.optical.cdr",
  },
};

/**
 * The kinds with no cited rate and no cited life. A plan of copies cannot use them until a source gives one.
 * `flash` and `paper`: no open source with a rate was found on 2026-11-22.
 */
export const MEDIUM_GAPS: readonly MediumKind[] = ["flash", "paper"];
