// The decision chart: trigger rules as data. Each rule names a trigger, the keys of the trigger and a target in the steps.
// The rule gate examines that each key is known, each target has steps and each rule cites its sources.

import { resultOf } from "@mark1russell7/guidebook";
import type { Finding, GateResult, Source } from "@mark1russell7/guidebook";
import type { Phase } from "./ladder.ts";
import type { Step } from "./steps.ts";

/**
 * The kinds of rule, in the sequence of the chart.
 * The chart asks first for the place. Then it asks for an immediate danger and for the cuts.
 * Then it asks when to stay, to go or to change the plan.
 */
export const RULE_KINDS = ["place", "reflex", "module", "stay", "go", "fallback", "long-plan"] as const;

/** A kind of rule. */
export type RuleKind = (typeof RULE_KINDS)[number];

/** The words of each kind of rule, for a chart. */
export const RULE_KIND_TITLES: Readonly<Record<RuleKind, string>> = {
  place: "Where am I?",
  reflex: "Is there an immediate danger?",
  module: "What is cut?",
  stay: "When do I stay?",
  go: "When do I go?",
  fallback: "When do I go to a fallback place?",
  "long-plan": "When do I change to the long plan?",
};

/** The target of a rule: the steps of a key in the given phases. */
export interface RuleTarget<P extends string = Phase> {
  readonly on: string;
  readonly phases: readonly P[];
}

/** A trigger rule of the decision chart. */
export interface Rule<P extends string = Phase> {
  readonly id: string;
  readonly kind: RuleKind;
  /** The trigger, as one sentence in Simplified Technical English. A print shows it. */
  readonly when: string;
  /** The action, as one instruction. A print shows it with the target. */
  readonly then: string;
  /** The keys that the trigger names: cases, cuts or needs. */
  readonly on: readonly string[];
  /** The steps that the rule sends the reader to. A rule of the kind `place` has no target, because the places are input data. */
  readonly target?: RuleTarget<P>;
  /** The rank in its kind. A rule with a lower rank comes first. */
  readonly rank: number;
  /** The ids of the sources that tell the trigger and the action. */
  readonly sources: readonly string[];
}

/** The codes of the findings of the rule gate. */
export const RULE_FINDING_CODES = ["duplicate-id", "unknown-key", "no-target", "target-without-steps", "no-source", "unknown-source"] as const;

/** A code of a finding of the rule gate. */
export type RuleFindingCode = (typeof RULE_FINDING_CODES)[number];

/** A finding of the rule gate. */
export type RuleFinding = Finding<RuleFindingCode, "rule">;

/** The options of the rule gate. */
export interface RuleGateOptions {
  /** The known keys: the cases, the cuts and the needs. */
  readonly on: readonly string[];
}

/**
 * This function applies the rule gate.
 * Each key of a rule is known. Each rule other than `place` has a target with one or more steps. Each rule cites a known source.
 */
export function checkRules<P extends string>(rules: readonly Rule<P>[], steps: readonly Step<P>[], sources: readonly Source[], options: RuleGateOptions): GateResult<RuleFinding> {
  const out: RuleFinding[] = [];
  const known = new Set(options.on);
  const sourceIds = new Set(sources.map((source) => source.id));
  const seen = new Set<string>();
  const error = (code: RuleFindingCode, id: string, message: string): void => {
    out.push({ level: "error", code, record: "rule", id, message });
  };
  for (const rule of rules) {
    if (seen.has(rule.id)) error("duplicate-id", rule.id, `Two rules have the id "${rule.id}".`);
    seen.add(rule.id);
    for (const key of rule.on) if (!known.has(key)) error("unknown-key", rule.id, `The rule names the unknown key "${key}".`);
    if (rule.target === undefined) {
      if (rule.kind !== "place") error("no-target", rule.id, `The rule of the kind "${rule.kind}" has no target.`);
    } else {
      const { on, phases } = rule.target;
      if (!known.has(on)) error("unknown-key", rule.id, `The target names the unknown key "${on}".`);
      else if (!steps.some((step) => step.on === on && phases.includes(step.phase))) {
        error("target-without-steps", rule.id, `The target "${on}" has no step in the phases ${phases.join(", ")}.`);
      }
    }
    if (rule.sources.length === 0) error("no-source", rule.id, "The rule cites no source.");
    for (const id of rule.sources) if (!sourceIds.has(id)) error("unknown-source", rule.id, `The rule cites the unknown source "${id}".`);
  }
  return resultOf(out);
}

/** One question of the chart: a kind of rule and its rules in the sequence of their rank. */
export interface ChartQuestion<P extends string = Phase> {
  readonly kind: RuleKind;
  readonly title: string;
  readonly rules: readonly Rule<P>[];
}

/** This function gives the chart of a set of rules: one question for each kind that has rules, in the sequence of `RULE_KINDS`. */
export function chartOf<P extends string>(rules: readonly Rule<P>[]): readonly ChartQuestion<P>[] {
  return RULE_KINDS.flatMap((kind) => {
    const ofKind = rules.filter((rule) => rule.kind === kind).sort((a, b) => a.rank - b.rank || a.id.localeCompare(b.id));
    return ofKind.length === 0 ? [] : [{ kind, title: RULE_KIND_TITLES[kind], rules: ofKind }];
  });
}
