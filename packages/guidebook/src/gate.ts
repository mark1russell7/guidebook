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
  "updated-after-check",
  "bad-sha256",
  "missing-field",
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

/** The optional fields of a source, in the order of the findings of the option `require`. */
export const SOURCE_FIELDS: readonly ["by", "note", "terms", "updated", "sha256"] = ["by", "note", "terms", "updated", "sha256"];

/** An optional field of a source that the option `require` of the gate can make necessary. */
export type SourceField = (typeof SOURCE_FIELDS)[number];

/** The options of the gate. */
export interface GateOptions extends UseContext {
  /** The date of the gate. Without it, the gate does not examine the age of the checks. */
  readonly at?: IsoDate;
  /** A source whose check is older than this number of days gets the warning `stale`. The default is 365. */
  readonly maxAgeDays?: number;
  /**
   * The optional fields that each source must have. A field with no text gets the error `missing-field`.
   * A dataset uses it for its own rules, for example `["by", "terms"]` for the credit and the evidence of a license.
   */
  readonly require?: readonly SourceField[];
  /** When this option is true, the address and the terms address of each source must start with `https:`. The default is false. */
  readonly https?: boolean;
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

/** The number of milliseconds in one day. */
export const DAY_MS = 86_400_000;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** This function gives the time of a date `YYYY-MM-DD` in milliseconds, or `undefined` when the date is not a real date. */
export function timeOf(date: string): number | undefined {
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

/** This function tells if a text is a web address that the gate accepts. */
export function isWebAddress(url: string): boolean {
  return WEB_ADDRESS.test(url);
}

/** The form of a SHA-256 hash: 64 lowercase hexadecimal digits. */
const SHA256 = /^[0-9a-f]{64}$/u;

/** This function tells if a web address starts with `https:`, in any case of the letters. */
function isSecure(url: string): boolean {
  return url.slice(0, 8).toLowerCase() === "https://";
}

/** This function tells if a text is a SHA-256 hash in the form that the gate accepts: 64 lowercase hexadecimal digits. */
export function isSha256(text: string): boolean {
  return SHA256.test(text);
}

/**
 * This function gives the findings of the sources: duplicate ids, empty titles, bad addresses, bad dates, unknown licenses and old checks.
 * It also examines the optional fields: the address `terms`, the date `updated` and the form of the hash `sha256`.
 * The options `require` and `https` add the rules of a dataset: the fields that each source must have, and addresses with `https:` only.
 * It throws a `RangeError` for a bad date of the gate or an unknown field in `require`.
 */
export function checkSources(sources: readonly Source[], options: GateOptions = {}): readonly Finding[] {
  const out: Finding[] = [];
  const error = (code: FindingCode, id: string, message: string): void => {
    out.push({ level: "error", code, record: "source", id, message });
  };
  const at = options.at === undefined ? undefined : timeOf(options.at);
  if (options.at !== undefined && at === undefined) throw new RangeError(`checkSources: the date "${options.at}" of the gate is not a date YYYY-MM-DD.`);
  const maxAge = options.maxAgeDays ?? 365;
  const unknown = (options.require ?? []).filter((field) => !(SOURCE_FIELDS as readonly string[]).includes(field));
  if (unknown.length > 0) throw new RangeError(`checkSources: the option require has the unknown fields ${unknown.join(", ")}.`);
  const necessary = SOURCE_FIELDS.filter((field) => options.require?.includes(field) === true);
  const seen = new Set<SourceId>();
  for (const source of sources) {
    if (seen.has(source.id)) error("duplicate-id", source.id, `Two sources have the id "${source.id}".`);
    seen.add(source.id);
    if (source.title.trim() === "") error("empty-title", source.id, `The source "${source.id}" has no title.`);
    if (!isWebAddress(source.url)) error("bad-url", source.id, `The source "${source.id}" has the address "${source.url}". It needs an address with https: or http:.`);
    else if (options.https === true && !isSecure(source.url)) error("bad-url", source.id, `The source "${source.id}" has the address "${source.url}". The gate accepts only an address with https:.`);
    if (!isLicense(source.license)) error("unknown-license", source.id, `The source "${source.id}" has the unknown license "${String(source.license)}".`);
    for (const field of necessary) {
      const value: unknown = source[field];
      if (typeof value !== "string" || value.trim() === "") error("missing-field", source.id, `The source "${source.id}" has no field "${field}". The gate makes it necessary.`);
    }
    if (source.terms !== undefined && !isWebAddress(source.terms)) error("bad-url", source.id, `The source "${source.id}" has the terms address "${source.terms}". It needs an address with https: or http:.`);
    else if (source.terms !== undefined && options.https === true && !isSecure(source.terms)) {
      error("bad-url", source.id, `The source "${source.id}" has the terms address "${source.terms}". The gate accepts only an address with https:.`);
    }
    if (source.sha256 !== undefined && !isSha256(source.sha256)) error("bad-sha256", source.id, `The hash of the source "${source.id}" is not 64 lowercase hexadecimal digits.`);
    const checked = timeOf(source.checked);
    const updated = source.updated === undefined ? undefined : timeOf(source.updated);
    if (source.updated !== undefined && updated === undefined) error("bad-date", source.id, `The source "${source.id}" has the change date "${source.updated}". It needs a date YYYY-MM-DD.`);
    if (updated !== undefined && checked !== undefined && updated > checked) error("updated-after-check", source.id, `The source "${source.id}" has a change date after its check date.`);
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
