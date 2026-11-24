// The steps of a plan, the query of the steps, the matrix of the library, and the step gate.

import { checkUnits, resultOf } from "@mark1russell7/guidebook";
import type { CitedUnit, Finding, GateResult, Source, SourceId, UseContext } from "@mark1russell7/guidebook";
import type { Phase } from "./ladder.ts";
import type { Society } from "./master.ts";

/**
 * One action of a plan. A step belongs to a key and to a phase.
 * A key names a case (a kind of event) or a cut (a service that an event stops). A plan of a case is its own steps and the steps of its cuts.
 */
export interface Step<P extends string = Phase> {
  readonly id: string;
  /** The key of the step: a case or a cut. */
  readonly on: string;
  readonly phase: P;
  /** The needs that the step protects. */
  readonly needs: readonly string[];
  /** An optional condition: a Vex program over the live state. No `when` means always. */
  readonly when?: string;
  /**
   * The action, as one instruction in Simplified Technical English, in the words of the guidebook.
   * When the step has a `when`, this text names the condition in words, because a print cannot examine `when`.
   */
  readonly do: string;
  /** The parts, the resources and the topics that the step uses. */
  readonly uses?: readonly string[];
  /** The order of the step in its phase, from 1. */
  readonly order: number;
  /** The sources of the step. A step with no `reasoning` has one or more. */
  readonly sources: readonly SourceId[];
  /**
   * The reasoning of a strategy step from first principles, for a step that no source tells.
   * A step with a number in its text (a dose, a time or a safety limit) still cites a source.
   */
  readonly reasoning?: string;
  /** The states of society that the step is for. No `society` means each state. */
  readonly society?: readonly Society[];
}

/** A marked gap: a key and a phase that have no step on purpose, with the reason. */
export interface Gap<P extends string = Phase> {
  readonly on: string;
  readonly phase: P;
  /** The reason, for example "A house fire gives no warning." */
  readonly why: string;
}

/** A cell of the matrix of a library: the steps of one key in one phase, or the marked gap of the cell. */
export interface Cell<P extends string = Phase> {
  readonly on: string;
  readonly phase: P;
  readonly steps: readonly Step<P>[];
  readonly gap?: Gap<P>;
}

const byOrder = <P extends string>(a: Step<P>, b: Step<P>): number => a.order - b.order || a.id.localeCompare(b.id);

/** The options of the steps query. */
export interface StepsForOptions {
  /** Only the steps for this state of society. A step with no `society` is for each state. */
  readonly society?: Society;
}

/**
 * This function gives the steps whose `on` is in `on` and whose phase is in `phases`.
 * The sequence is by `on`, then by `phases`, then by `order`. A step that matches two entries of `on` comes one time.
 * Steps with the same text are one step: the first, with the sources, the needs and the states of society of each.
 */
export function stepsFor<P extends string>(library: readonly Step<P>[], on: readonly string[], phases: readonly P[], options: StepsForOptions = {}): readonly Step<P>[] {
  const { society } = options;
  const fits = (step: Step<P>): boolean => society === undefined || step.society === undefined || step.society.includes(society);
  const out: Step<P>[] = [];
  const seen = new Set<string>();
  const byText = new Map<string, number>();
  for (const key of on) {
    for (const phase of phases) {
      const hits = library.filter((step) => step.on === key && step.phase === phase && !seen.has(step.id) && fits(step)).sort(byOrder);
      for (const step of hits) {
        seen.add(step.id);
        const at = byText.get(step.do);
        if (at === undefined) {
          byText.set(step.do, out.length);
          out.push(step);
        } else {
          out[at] = mergeSteps(out[at] as Step<P>, step);
        }
      }
    }
  }
  return out;
}

const union = <T>(a: readonly T[], b: readonly T[]): readonly T[] => [...new Set([...a, ...b])];

/**
 * This function gives the steps that each key of `on` has. An example is a kit step that each case has.
 * The sequence is the sequence of the library. Each text comes one time, as its first step.
 * A sheet for a group of cases prints these steps one time, and not again for each case.
 */
export function commonSteps<P extends string>(library: readonly Step<P>[], on: readonly string[]): readonly Step<P>[] {
  const keys = new Set(on);
  const first = new Map<string, Step<P>>();
  const keysOf = new Map<string, Set<string>>();
  for (const step of library) {
    if (!keys.has(step.on)) continue;
    if (!first.has(step.do)) first.set(step.do, step);
    const seen = keysOf.get(step.do) ?? new Set<string>();
    seen.add(step.on);
    keysOf.set(step.do, seen);
  }
  if (keys.size === 0) return [];
  return [...first].filter(([text]) => keysOf.get(text)?.size === keys.size).map(([, step]) => step);
}

/** This function gives one step for two steps with the same text. It keeps the first, with the sources, needs and states of society of both. */
function mergeSteps<P extends string>(first: Step<P>, second: Step<P>): Step<P> {
  const { society, ...rest } = first;
  const merged = { ...rest, sources: union(first.sources, second.sources), needs: union(first.needs, second.needs) };
  return society === undefined || second.society === undefined ? merged : { ...merged, society: union(society, second.society) };
}

/** This function gives the matrix of a library: one row for each key of `on`, with one cell for each phase of `phases`. */
export function planMatrix<P extends string>(
  library: readonly Step<P>[],
  gaps: readonly Gap<P>[],
  on: readonly string[],
  phases: readonly P[],
): readonly (readonly Cell<P>[])[] {
  return on.map((key) =>
    phases.map((phase) => {
      const steps = library.filter((step) => step.on === key && step.phase === phase).sort(byOrder);
      const gap = gaps.find((item) => item.on === key && item.phase === phase);
      return gap === undefined ? { on: key, phase, steps } : { on: key, phase, steps, gap };
    }),
  );
}

/** The codes of the findings of the step gate. The codes of the source gate also apply to the sources of the steps. */
export const STEP_FINDING_CODES = [
  "duplicate-id",
  "empty-text",
  "no-source",
  "number-without-source",
  "empty-reasoning",
  "missing-source",
  "use-refused",
  "unknown-phase",
  "bad-order",
  "duplicate-order",
  "unmarked-gap",
  "gap-with-steps",
  "duplicate-gap",
  "empty-reason",
] as const;

/** A code of a finding of the step gate. */
export type StepFindingCode = (typeof STEP_FINDING_CODES)[number];

/** A finding of the step gate. */
export type StepFinding = Finding<StepFindingCode, "step" | "gap" | "cell">;

/** The options of the step gate. */
export interface StepGateOptions<P extends string> extends UseContext {
  /** The phases that a step can have. */
  readonly phases: readonly P[];
  /** The keys of the matrix. With them, the gate finds each cell that has no step and no marked gap. */
  readonly on?: readonly string[];
  /** The marked gaps of the library. */
  readonly gaps?: readonly Gap<P>[];
}

/** This function gives one summary unit for each source of each step, so the source gate examines the steps. */
export function unitsOf<P extends string>(steps: readonly Step<P>[]): readonly CitedUnit[] {
  return steps.flatMap((step) => step.sources.map((source) => ({ id: `${step.id}@${source}`, use: "summary" as const, text: step.do, source })));
}

/**
 * This function applies the step gate. It examines the ids, the text, the sources, the phases and the order of each step.
 * It examines the sources with the source gate: the text of a step is a summary of each of its sources.
 * With `on`, it also finds each cell of the matrix that has no step and no marked gap.
 */
export function checkSteps<P extends string>(steps: readonly Step<P>[], sources: readonly Source[], options: StepGateOptions<P>): GateResult<StepFinding> {
  const out: StepFinding[] = [];
  const error = (code: StepFindingCode, record: StepFinding["record"], id: string, message: string): void => {
    out.push({ level: "error", code, record, id, message });
  };
  const phases = new Set<string>(options.phases);
  const ids = new Set<string>();
  const orders = new Map<string, string>();
  for (const step of steps) {
    if (ids.has(step.id)) error("duplicate-id", "step", step.id, `Two steps have the id "${step.id}".`);
    ids.add(step.id);
    if (step.do.trim() === "") error("empty-text", "step", step.id, `The step "${step.id}" has no text.`);
    if (step.reasoning !== undefined && step.reasoning.trim() === "") error("empty-reasoning", "step", step.id, `The step "${step.id}" has an empty reasoning.`);
    if (step.sources.length === 0) {
      if (step.reasoning === undefined) error("no-source", "step", step.id, `The step "${step.id}" cites no source and gives no reasoning.`);
      else if (/[0-9]/.test(step.do)) error("number-without-source", "step", step.id, `The step "${step.id}" has a number, so it needs a source.`);
    }
    if (!phases.has(step.phase)) error("unknown-phase", "step", step.id, `The step "${step.id}" has the unknown phase "${step.phase}".`);
    if (!Number.isInteger(step.order) || step.order < 1) error("bad-order", "step", step.id, `The step "${step.id}" has the order ${String(step.order)}. It needs an integer from 1.`);
    const cell = `${step.on}\u0000${step.phase}\u0000${String(step.order)}`;
    const other = orders.get(cell);
    if (other !== undefined) error("duplicate-order", "step", step.id, `The steps "${other}" and "${step.id}" have the same order in "${step.on}", phase "${step.phase}".`);
    else orders.set(cell, step.id);
  }
  for (const finding of checkUnits(unitsOf(steps), sources, options)) {
    if (finding.code !== "missing-source" && finding.code !== "use-refused") continue;
    const id = finding.id.slice(0, finding.id.lastIndexOf("@"));
    out.push({ level: finding.level, code: finding.code, record: "step", id, message: finding.message.replace(`unit "${finding.id}"`, `step "${id}"`) });
  }
  out.push(...checkGaps(steps, options));
  return resultOf(out);
}

function checkGaps<P extends string>(steps: readonly Step<P>[], options: StepGateOptions<P>): StepFinding[] {
  const out: StepFinding[] = [];
  const gaps = options.gaps ?? [];
  const seen = new Set<string>();
  for (const gap of gaps) {
    const id = `${gap.on}/${gap.phase}`;
    if (seen.has(id)) out.push({ level: "error", code: "duplicate-gap", record: "gap", id, message: `Two gaps mark "${gap.on}" in phase "${gap.phase}".` });
    seen.add(id);
    if (gap.why.trim() === "") out.push({ level: "error", code: "empty-reason", record: "gap", id, message: `The gap of "${gap.on}" in phase "${gap.phase}" gives no reason.` });
    const count = steps.filter((step) => step.on === gap.on && step.phase === gap.phase).length;
    if (count > 0) out.push({ level: "error", code: "gap-with-steps", record: "gap", id, message: `A gap marks "${gap.on}" in phase "${gap.phase}", but the cell has ${String(count)} steps.` });
    if (!options.phases.includes(gap.phase)) out.push({ level: "error", code: "unknown-phase", record: "gap", id, message: `The gap of "${gap.on}" has the unknown phase "${gap.phase}".` });
  }
  if (options.on === undefined) return out;
  for (const row of planMatrix(steps, gaps, options.on, options.phases)) {
    for (const cell of row) {
      const id = `${cell.on}/${cell.phase}`;
      if (cell.steps.length === 0 && cell.gap === undefined) {
        out.push({ level: "error", code: "unmarked-gap", record: "cell", id, message: `"${cell.on}" has no step in phase "${cell.phase}", and no gap marks the cell.` });
      }
    }
  }
  return out;
}
