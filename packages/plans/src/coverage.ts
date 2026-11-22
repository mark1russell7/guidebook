// The coverage gate: each key of a catalog has steps in each phase of a set. A marked gap does not pass it.

import { resultOf } from "@mark1russell7/guidebook";
import type { Finding, GateResult } from "@mark1russell7/guidebook";
import { planMatrix, type Gap, type Step } from "./steps.ts";

/** The horizons of a plan: the phases from the first 5 minutes to 5 years. The coverage gate examines them by default. */
export const HORIZONS = ["P0", "P1", "P2", "P3", "P4", "P5"] as const;

/** The codes of the findings of the coverage gate. */
export const COVERAGE_FINDING_CODES = ["no-step", "marked-gap"] as const;

/** A code of a finding of the coverage gate. */
export type CoverageFindingCode = (typeof COVERAGE_FINDING_CODES)[number];

/** A finding of the coverage gate. Its `id` is `<key>/<phase>`. */
export type CoverageFinding = Finding<CoverageFindingCode, "cell">;

/** The options of the coverage gate. */
export interface CoverageOptions<P extends string> {
  /** The keys of the catalog. Each key needs steps in each phase. */
  readonly on: readonly string[];
  /** The phases that each key needs. */
  readonly phases: readonly P[];
  /** The marked gaps of the library. The gate shows the reason of a gap, but the gap does not pass. */
  readonly gaps?: readonly Gap<P>[];
}

/** The coverage of one key: the phases with steps and the phases with no step. */
export interface KeyCoverage<P extends string> {
  readonly on: string;
  readonly covered: readonly P[];
  readonly missing: readonly P[];
}

/** This function gives the coverage of each key of `on` over `phases`, in the sequence of `on`. */
export function coverageOf<P extends string>(steps: readonly Step<P>[], on: readonly string[], phases: readonly P[]): readonly KeyCoverage<P>[] {
  return planMatrix(steps, [], on, phases).map((row, index) => ({
    on: on[index] ?? "",
    covered: row.filter((cell) => cell.steps.length > 0).map((cell) => cell.phase),
    missing: row.filter((cell) => cell.steps.length === 0).map((cell) => cell.phase),
  }));
}

/**
 * This function applies the coverage gate. Each key of `on` needs one or more steps in each phase of `phases`.
 * A cell with no step is an error, also when a gap marks it: the finding `marked-gap` gives the reason of the gap.
 * Thus a key with no step shows each of its gaps, and it does not pass.
 */
export function checkCoverage<P extends string>(steps: readonly Step<P>[], options: CoverageOptions<P>): GateResult<CoverageFinding> {
  const out: CoverageFinding[] = [];
  for (const row of planMatrix(steps, options.gaps ?? [], options.on, options.phases)) {
    for (const cell of row) {
      if (cell.steps.length > 0) continue;
      const id = `${cell.on}/${cell.phase}`;
      out.push(
        cell.gap === undefined
          ? { level: "error", code: "no-step", record: "cell", id, message: `"${cell.on}" has no step in phase "${cell.phase}".` }
          : { level: "error", code: "marked-gap", record: "cell", id, message: `"${cell.on}" has no step in phase "${cell.phase}". The gap gives the reason: ${cell.gap.why}` },
      );
    }
  }
  return resultOf(out);
}
