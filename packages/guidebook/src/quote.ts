// The quote check: each unit of the use `quote` against the text of its source.
// The check is pure. A job reads the text of each source, gives the texts to `checkQuotes`, and sets the dates with `markChecked`.

import { findPassage } from "@mark1russell7/text/passage";
import type { PassageSpan } from "@mark1russell7/text/passage";
import { resultOf, timeOf } from "./gate.ts";
import type { Finding, GateResult } from "./gate.ts";
import type { CitedUnit, IsoDate, SourceId } from "./source.ts";

/** The codes of the findings of the quote check. */
export const QUOTE_CODES = ["quote-not-found", "quote-no-read"] as const;

/** A code of a finding of the quote check. */
export type QuoteCode = (typeof QUOTE_CODES)[number];

/** A finding of the quote check. */
export type QuoteFinding = Finding<QuoteCode, "unit">;

/**
 * The result of the check of one quote.
 *
 * - `found`: the text of the source holds the quote. `span` is its place in that text.
 * - `not-found`: the text of the source does not hold the quote.
 * - `no-read`: the check has no text of the source, so it cannot tell.
 */
export interface QuoteCheck {
  /** The `id` of the unit. */
  readonly unit: string;
  readonly source: SourceId;
  readonly status: "found" | "not-found" | "no-read";
  /** The place of the quote in the text of the source. Only the status `found` has it. */
  readonly span?: PassageSpan;
}

/** The result of the quote check: the findings, and the check of each quote. */
export interface QuoteResult extends GateResult<QuoteFinding> {
  readonly checks: readonly QuoteCheck[];
}

/**
 * This function compares each unit of the use `quote` with the text of its source. It has no I/O.
 *
 * - The comparison is `findPassage` of `@mark1russell7/text`. The case, the quote marks, the dashes and the white space are not significant.
 * - A quote that the text does not hold gets the error `quote-not-found`.
 * - A source with no text, or with only white space, gives the warning `quote-no-read` for each of its quotes.
 * - A unit of another use, or a unit from JSON with a bad shape, gets no check. The source gate examines its shape.
 *
 * @param units - The units of a guidebook. The function examines only the quotes.
 * @param texts - The plain text of each source that a job read, by the `id` of the source.
 * @returns The findings and the check of each quote, in the order of the units.
 */
export function checkQuotes(units: readonly CitedUnit[], texts: ReadonlyMap<SourceId, string>): QuoteResult {
  const findings: QuoteFinding[] = [];
  const checks: QuoteCheck[] = [];
  for (const raw of units) {
    const unit = Object(raw) as { readonly id?: unknown; readonly use?: unknown; readonly text?: unknown; readonly source?: unknown };
    if (unit.use !== "quote" || typeof unit.text !== "string" || typeof unit.source !== "string") continue;
    const id = String(unit.id);
    const source = unit.source;
    const text = texts.get(source);
    if (text === undefined || text.trim() === "") {
      checks.push({ unit: id, source, status: "no-read" });
      findings.push({ level: "warning", code: "quote-no-read", record: "unit", id, message: `The check has no text of the source "${source}", so it cannot examine the quote "${id}".` });
      continue;
    }
    const span = findPassage(text, unit.text);
    if (span === undefined) {
      checks.push({ unit: id, source, status: "not-found" });
      findings.push({ level: "error", code: "quote-not-found", record: "unit", id, message: `The text of the source "${source}" does not hold the quote "${id}".` });
      continue;
    }
    checks.push({ unit: id, source, status: "found", span });
  }
  return { ...resultOf(findings), checks };
}

/**
 * This function sets the date `checked` on each unit whose quote the check found. The other units do not change.
 * It throws a `RangeError` when the date is not a real date `YYYY-MM-DD`.
 *
 * @param units - The units of a guidebook.
 * @param checks - The checks of `checkQuotes`.
 * @param at - The date of the check.
 * @returns The units, in the same order.
 */
export function markChecked<U extends CitedUnit>(units: readonly U[], checks: readonly QuoteCheck[], at: IsoDate): readonly U[] {
  if (timeOf(at) === undefined) throw new RangeError(`markChecked: the date "${at}" is not a date YYYY-MM-DD.`);
  const found = new Set(checks.filter((check) => check.status === "found").map((check) => check.unit));
  return units.map((unit) => (unit.use === "quote" && found.has(unit.id) ? { ...unit, checked: at } : unit));
}
