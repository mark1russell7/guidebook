// The state of the copies of each bundle, against the copy rule of its level, and the checks that are due.

import { DAY_MS, timeOf } from "@mark1russell7/guidebook";
import type { Finding, IsoDate } from "@mark1russell7/guidebook";
import { addDays } from "./date.ts";
import type { Bundle, Copy, CopyRule, MediumKind } from "./records.ts";

/** The codes of the copy gaps. */
export const GAP_CODES = ["few-copies", "few-kinds", "few-places", "no-rule", "check-due", "bad-hash", "old-version"] as const;

/** A code of a copy gap. */
export type GapCode = (typeof GAP_CODES)[number];

/** A copy gap: an error on a bundle with too few good copies, or a warning on one copy. */
export type GapFinding = Finding<GapCode, "bundle" | "copy">;

/**
 * The status of one copy at a date.
 * - `good`: the copy had a check within the days of its rule, and its hash agrees with the bundle.
 * - `old`: as `good`, but the copy holds an earlier release of the bundle. It counts as a good copy.
 * - `due`: the last check is older than the days of the rule. The copy does not count until a new check.
 * - `bad`: the hash of the copy does not agree with the hash of the same release. Replace the copy.
 */
export type CopyStatus = "good" | "old" | "due" | "bad";

/** The state of the copies of one bundle. */
export interface CopyState {
  readonly bundle: string;
  readonly level: string;
  /** The rule of the level, or `undefined` when no rule has the level. */
  readonly rule: CopyRule | undefined;
  readonly copies: readonly { readonly copy: Copy; readonly status: CopyStatus }[];
  /** The count of good copies (the status `good` or `old`). */
  readonly good: number;
  /** The different kinds of media of the good copies. */
  readonly kinds: readonly MediumKind[];
  /** The different places of the good copies. */
  readonly places: readonly string[];
  /** This field is true when the good copies obey the rule. */
  readonly ok: boolean;
}

/** The result of `copyStates`. */
export interface CopyStates {
  readonly states: readonly CopyState[];
  readonly findings: readonly GapFinding[];
}

function statusOf(copy: Copy, bundle: Bundle, rule: CopyRule | undefined, at: number): CopyStatus {
  const sameRelease = bundle.version === undefined || copy.version === undefined || bundle.version === copy.version;
  if (sameRelease && bundle.sha256 !== undefined && copy.sha256 !== undefined && bundle.sha256 !== copy.sha256) return "bad";
  const checked = timeOf(copy.checked);
  if (checked === undefined) return "due";
  if (rule !== undefined && (at - checked) / DAY_MS > rule.everyDays) return "due";
  return sameRelease ? "good" : "old";
}

/**
 * This function gives the state of the copies of each bundle at the date `at`, and the gaps.
 * A bundle with fewer good copies, kinds or places than the rule of its level gets an error.
 * A copy with a check that is due, a bad hash or an earlier release gets a warning.
 */
export function copyStates(bundles: readonly Bundle[], copies: readonly Copy[], rules: readonly CopyRule[], options: { readonly at: IsoDate }): CopyStates {
  const at = timeOf(options.at);
  if (at === undefined) throw new RangeError(`copyStates: the date "${options.at}" is not a date YYYY-MM-DD.`);
  const ruleOf = new Map(rules.map((rule) => [rule.level, rule]));
  const byBundle = new Map<string, Copy[]>();
  for (const copy of copies) {
    const list = byBundle.get(copy.bundle) ?? [];
    list.push(copy);
    byBundle.set(copy.bundle, list);
  }
  const states: CopyState[] = [];
  const findings: GapFinding[] = [];
  for (const bundle of bundles) {
    const rule = ruleOf.get(bundle.level);
    const rated = (byBundle.get(bundle.id) ?? []).map((copy) => ({ copy, status: statusOf(copy, bundle, rule, at) }));
    const good = rated.filter((item) => item.status === "good" || item.status === "old").map((item) => item.copy);
    const kinds = [...new Set(good.map((copy) => copy.kind))];
    const places = [...new Set(good.map((copy) => copy.place))];
    const bundleError = (code: GapCode, message: string): void => {
      findings.push({ level: "error", code, record: "bundle", id: bundle.id, message });
    };
    if (rule === undefined) {
      bundleError("no-rule", `The bundle "${bundle.id}" has the level "${bundle.level}", and no copy rule has it.`);
    } else {
      if (good.length < rule.copies) bundleError("few-copies", `The bundle "${bundle.id}" has ${good.length} good copies. Its level "${rule.level}" needs ${rule.copies}.`);
      if (kinds.length < rule.kinds) bundleError("few-kinds", `The good copies of "${bundle.id}" are on ${kinds.length} kinds of media. Its level "${rule.level}" needs ${rule.kinds}.`);
      if (places.length < rule.places) bundleError("few-places", `The good copies of "${bundle.id}" are in ${places.length} places. Its level "${rule.level}" needs ${rule.places}.`);
    }
    for (const { copy, status } of rated) {
      const id = `${copy.bundle}@${copy.medium}`;
      if (status === "due") findings.push({ level: "warning", code: "check-due", record: "copy", id, message: `Read the copy "${id}" against its hash. Its last check was on ${copy.checked}.` });
      if (status === "bad") findings.push({ level: "warning", code: "bad-hash", record: "copy", id, message: `The copy "${id}" does not agree with the hash of its release. Replace it.` });
      if (status === "old") findings.push({ level: "warning", code: "old-version", record: "copy", id, message: `The copy "${id}" holds the release "${copy.version ?? ""}". The catalog has "${bundle.version ?? ""}".` });
    }
    const ok = rule !== undefined && good.length >= rule.copies && kinds.length >= rule.kinds && places.length >= rule.places;
    states.push({ bundle: bundle.id, level: bundle.level, rule, copies: rated, good: good.length, kinds, places, ok });
  }
  return { states, findings };
}

/** A check of a copy that a schedule gives to a person or a job. */
export interface DueCheck {
  readonly bundle: string;
  readonly medium: string;
  readonly place: string;
  /** The last date on which the copy is good with no new check. */
  readonly due: IsoDate;
}

/**
 * This function gives the check of each copy whose due date is on or before `at` plus `withinDays`, the first due first.
 * A copy of a bundle with no rule, or of an unknown bundle, gets no check.
 */
export function checksDue(bundles: readonly Bundle[], copies: readonly Copy[], rules: readonly CopyRule[], options: { readonly at: IsoDate; readonly withinDays?: number }): readonly DueCheck[] {
  const limit = addDays(options.at, options.withinDays ?? 0);
  const levelOf = new Map(bundles.map((bundle) => [bundle.id, bundle.level]));
  const ruleOf = new Map(rules.map((rule) => [rule.level, rule]));
  const out: DueCheck[] = [];
  for (const copy of copies) {
    const level = levelOf.get(copy.bundle);
    const rule = level === undefined ? undefined : ruleOf.get(level);
    if (rule === undefined) continue;
    const due = timeOf(copy.checked) === undefined ? options.at : addDays(copy.checked, rule.everyDays);
    if (due <= limit) out.push({ bundle: copy.bundle, medium: copy.medium, place: copy.place, due });
  }
  return out.sort((a, b) => (a.due < b.due ? -1 : a.due > b.due ? 1 : a.bundle < b.bundle ? -1 : a.bundle > b.bundle ? 1 : a.medium < b.medium ? -1 : a.medium > b.medium ? 1 : 0));
}

/** This function gives the bytes that are necessary on one medium for each bundle of a list. */
export function bytesOf(bundles: readonly Bundle[], ids: readonly string[]): number {
  const sizeOf = new Map(bundles.map((bundle) => [bundle.id, bundle.bytes]));
  let total = 0;
  for (const id of new Set(ids)) {
    const bytes = sizeOf.get(id);
    if (bytes === undefined) throw new RangeError(`bytesOf: the bundle "${id}" is not in the catalog.`);
    total += bytes;
  }
  return total;
}
