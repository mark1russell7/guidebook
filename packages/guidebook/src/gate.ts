// The source gate: the checks of the sources and the cited units of a guidebook.
// The gate gives each finding as data. A caller prints the findings, or stops with `assertGate`.

import { LICENSE_RULES, LICENSES, permits } from "./license.ts";
import type { Layer, License, UseContext } from "./license.ts";
import type { CitedUnit, IsoDate, Source, SourceId } from "./source.ts";

/** The codes of the findings of the gate. */
export const FINDING_CODES = [
  "duplicate-id",
  "empty-title",
  "empty-text",
  "bad-url",
  "bad-date",
  "unknown-license",
  "checked-in-future",
  "stale",
  "missing-source",
  "use-refused",
] as const;

/** A code of a finding. */
export type FindingCode = (typeof FINDING_CODES)[number];

/**
 * A finding of a gate. A finding with the level `error` stops the gate. A `warning` tells of a review to do.
 * An add-on gives its own codes `C` and its own kinds of record `R`.
 */
export interface Finding<C extends string = FindingCode, R extends string = "source" | "unit"> {
  readonly level: "error" | "warning";
  readonly code: C;
  /** The kind of the record with the finding. */
  readonly record: R;
  /** The `id` of the record with the finding. */
  readonly id: string;
  readonly message: string;
}

/** The options of the gate. */
export interface GateOptions extends UseContext {
  /** The date of the gate. Without it, the gate does not examine the age of the checks. */
  readonly at?: IsoDate;
  /** A source whose check is older than this number of days gets the warning `stale`. The default is 365. */
  readonly maxAgeDays?: number;
}

/** The result of a gate. */
export interface GateResult<F extends Finding<string, string> = Finding> {
  /** This field is true when the result has no finding with the level `error`. */
  readonly ok: boolean;
  readonly findings: readonly F[];
}

/** This function gives the result of a list of findings. */
export function resultOf<F extends Finding<string, string>>(findings: readonly F[]): GateResult<F> {
  return { ok: findings.every((finding) => finding.level !== "error"), findings };
}

/** This function throws an error with each finding of the level `error`. The name of the gate starts the message. */
export function throwOnErrors(name: string, findings: readonly Finding<string, string>[]): void {
  const lines = findings.filter((finding) => finding.level === "error").map((finding) => `- ${finding.code}: ${finding.message}`);
  if (lines.length > 0) throw new Error(`The ${name} found ${lines.length} errors:\n${lines.join("\n")}`);
}

const DAY_MS = 86_400_000;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** This function gives the time of a date `YYYY-MM-DD` in milliseconds, or `undefined` when the date is not a real date. */
function timeOf(date: string): number | undefined {
  if (!ISO_DATE.test(date)) return undefined;
  const time = Date.parse(`${date}T00:00:00Z`);
  if (Number.isNaN(time)) return undefined;
  return new Date(time).toISOString().slice(0, 10) === date ? time : undefined;
}

function isLicense(value: unknown): value is License {
  return typeof value === "string" && (LICENSES as readonly string[]).includes(value);
}

/** An address with `https:` or `http:`, a host, and no space. The core uses no platform type, so it does not use `URL`. */
const WEB_ADDRESS = /^https?:\/\/[a-z0-9.-]+(?::\d+)?(?:[/?#]\S*)?$/iu;

function isWebAddress(url: string): boolean {
  return WEB_ADDRESS.test(url);
}

/** This function gives the findings of the sources: duplicate ids, empty titles, bad addresses, bad dates, unknown licenses and old checks. */
export function checkSources(sources: readonly Source[], options: GateOptions = {}): readonly Finding[] {
  const out: Finding[] = [];
  const error = (code: FindingCode, id: string, message: string): void => {
    out.push({ level: "error", code, record: "source", id, message });
  };
  const at = options.at === undefined ? undefined : timeOf(options.at);
  if (options.at !== undefined && at === undefined) throw new RangeError(`checkSources: the date "${options.at}" of the gate is not a date YYYY-MM-DD.`);
  const maxAge = options.maxAgeDays ?? 365;
  const seen = new Set<SourceId>();
  for (const source of sources) {
    if (seen.has(source.id)) error("duplicate-id", source.id, `Two sources have the id "${source.id}".`);
    seen.add(source.id);
    if (source.title.trim() === "") error("empty-title", source.id, `The source "${source.id}" has no title.`);
    if (!isWebAddress(source.url)) error("bad-url", source.id, `The source "${source.id}" has the address "${source.url}". It needs an address with https: or http:.`);
    if (!isLicense(source.license)) error("unknown-license", source.id, `The source "${source.id}" has the unknown license "${String(source.license)}".`);
    const checked = timeOf(source.checked);
    if (checked === undefined) {
      error("bad-date", source.id, `The source "${source.id}" has the check date "${source.checked}". It needs a date YYYY-MM-DD.`);
    } else if (at !== undefined) {
      if (checked > at) error("checked-in-future", source.id, `The source "${source.id}" has a check date after the date of the gate.`);
      const days = (at - checked) / DAY_MS;
      if (days > maxAge) {
        out.push({ level: "warning", code: "stale", record: "source", id: source.id, message: `The last check of the source "${source.id}" is ${days} days old. Read the source again.` });
      }
    }
  }
  return out;
}

/** This function gives the findings of the units: duplicate ids, empty text, a missing source, and a use that the license refuses. */
export function checkUnits(units: readonly CitedUnit[], sources: readonly Source[], options: UseContext = {}): readonly Finding[] {
  const out: Finding[] = [];
  const error = (code: FindingCode, id: string, message: string): void => {
    out.push({ level: "error", code, record: "unit", id, message });
  };
  const byId = new Map(sources.map((source) => [source.id, source] as const));
  const seen = new Set<string>();
  for (const unit of units) {
    if (seen.has(unit.id)) error("duplicate-id", unit.id, `Two units have the id "${unit.id}".`);
    seen.add(unit.id);
    if (unit.text.trim() === "") error("empty-text", unit.id, `The unit "${unit.id}" has no text.`);
    const source = byId.get(unit.source);
    if (source === undefined) {
      error("missing-source", unit.id, `The unit "${unit.id}" cites the source "${unit.source}", but the list does not have it.`);
      continue;
    }
    if (isLicense(source.license) && !permits(source.license, unit.use, options)) {
      error("use-refused", unit.id, `The license "${source.license}" of the source "${source.id}" refuses the use "${unit.use}" of the unit "${unit.id}".`);
    }
  }
  return out;
}

/** This function applies the gate to the sources and the units of a guidebook. */
export function gate(units: readonly CitedUnit[], sources: readonly Source[], options: GateOptions = {}): GateResult {
  return resultOf([...checkSources(sources, options), ...checkUnits(units, sources, options)]);
}

/** This function applies the gate, and throws an error with each finding of the level `error`. */
export function assertGate(units: readonly CitedUnit[], sources: readonly Source[], options: GateOptions = {}): void {
  const result = gate(units, sources, options);
  if (result.ok) return;
  const lines = result.findings.filter((finding) => finding.level === "error").map((finding) => `- ${finding.code}: ${finding.message}`);
  throw new Error(`The source gate found ${lines.length} errors:\n${lines.join("\n")}`);
}

/** This function gives the layer of a printed unit. Only a quote of a share-alike source goes to the share-alike layer. */
export function layerOf(unit: CitedUnit, source: Source): Layer {
  return unit.use === "quote" ? LICENSE_RULES[source.license].layer : "main";
}
