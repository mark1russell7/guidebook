// The catalog gate: the checks of the bundles and of their copies.

import { LICENSES, isWebAddress, permits, timeOf } from "@mark1russell7/guidebook";
import type { Finding, License, Source, UseContext } from "@mark1russell7/guidebook";
import { MEDIUM_KINDS } from "./records.ts";
import type { Bundle, Copy, CopyRule } from "./records.ts";

/** The codes of the findings of the catalog gate. */
export const LIBRARY_CODES = [
  "duplicate-id",
  "empty-title",
  "bad-bytes",
  "bad-sha256",
  "bad-url",
  "unknown-license",
  "missing-source",
  "unknown-level",
  "use-refused",
  "missing-bundle",
  "bad-kind",
  "bad-date",
  "checked-in-future",
  "duplicate-copy",
  "bad-life",
] as const;

/** A code of a finding of the catalog gate. */
export type LibraryCode = (typeof LIBRARY_CODES)[number];

/** A finding of the catalog gate, on a bundle or on a copy. */
export type LibraryFinding = Finding<LibraryCode, "bundle" | "copy">;

/** The options of the catalog gate. */
export interface CatalogOptions extends UseContext {
  /** The sources of the core. With them, a bundle must name a known source. */
  readonly sources?: readonly Source[];
  /** The copy rules. With them, a bundle must name the level of a rule. */
  readonly rules?: readonly CopyRule[];
}

const SHA256 = /^[0-9a-f]{64}$/;

function isLicense(value: unknown): value is License {
  return typeof value === "string" && (LICENSES as readonly string[]).includes(value);
}

/**
 * This function gives the findings of the bundles of a catalog.
 * A bundle must have a unique id, a title, a whole positive size and a license that permits a bundle.
 * Its hash and its address must be correct when it has them.
 */
export function checkCatalog(bundles: readonly Bundle[], options: CatalogOptions = {}): readonly LibraryFinding[] {
  const out: LibraryFinding[] = [];
  const error = (code: LibraryCode, id: string, message: string): void => {
    out.push({ level: "error", code, record: "bundle", id, message });
  };
  const sources = options.sources === undefined ? undefined : new Set(options.sources.map((source) => source.id));
  const levels = options.rules === undefined ? undefined : new Set(options.rules.map((rule) => rule.level));
  const seen = new Set<string>();
  for (const bundle of bundles) {
    if (seen.has(bundle.id)) error("duplicate-id", bundle.id, `Two bundles have the id "${bundle.id}".`);
    seen.add(bundle.id);
    if (bundle.title.trim() === "") error("empty-title", bundle.id, `The bundle "${bundle.id}" has no title.`);
    if (!Number.isSafeInteger(bundle.bytes) || bundle.bytes <= 0) error("bad-bytes", bundle.id, `The bundle "${bundle.id}" has the size ${bundle.bytes}. It needs a whole number of bytes more than 0.`);
    if (bundle.sha256 !== undefined && !SHA256.test(bundle.sha256)) error("bad-sha256", bundle.id, `The bundle "${bundle.id}" has a SHA-256 that is not 64 lower-case hexadecimal digits.`);
    if (bundle.url !== undefined && !isWebAddress(bundle.url)) error("bad-url", bundle.id, `The bundle "${bundle.id}" has the address "${bundle.url}". It needs an address with https: or http:.`);
    if (!isLicense(bundle.license)) {
      error("unknown-license", bundle.id, `The bundle "${bundle.id}" has the unknown license "${String(bundle.license)}".`);
    } else if (!permits(bundle.license, "bundle", options)) {
      error("use-refused", bundle.id, `The license "${bundle.license}" of the bundle "${bundle.id}" does not permit an offline bundle in this guidebook.`);
    }
    if (sources !== undefined && !sources.has(bundle.source)) error("missing-source", bundle.id, `The bundle "${bundle.id}" names the unknown source "${bundle.source}".`);
    if (levels !== undefined && !levels.has(bundle.level)) error("unknown-level", bundle.id, `The bundle "${bundle.id}" has the level "${bundle.level}", and no copy rule has it.`);
  }
  return out;
}

/** The options of the check of the copies. */
export interface CopiesOptions {
  /** The date of the check. With it, a copy with a later check date is an error. */
  readonly at?: string;
}

/** This function gives the findings of the copies: an unknown bundle or kind, a bad date, and two records of one copy. */
export function checkCopies(copies: readonly Copy[], bundles: readonly Bundle[], options: CopiesOptions = {}): readonly LibraryFinding[] {
  const out: LibraryFinding[] = [];
  const at = options.at === undefined ? undefined : timeOf(options.at);
  if (options.at !== undefined && at === undefined) throw new RangeError(`checkCopies: the date "${options.at}" of the check is not a date YYYY-MM-DD.`);
  const known = new Set(bundles.map((bundle) => bundle.id));
  const seen = new Set<string>();
  for (const copy of copies) {
    const id = `${copy.bundle}@${copy.medium}`;
    const error = (code: LibraryCode, message: string): void => {
      out.push({ level: "error", code, record: "copy", id, message });
    };
    if (seen.has(id)) error("duplicate-copy", `Two records give the copy of "${copy.bundle}" on the medium "${copy.medium}".`);
    seen.add(id);
    if (!known.has(copy.bundle)) error("missing-bundle", `The copy "${id}" names the unknown bundle "${copy.bundle}".`);
    if (!(MEDIUM_KINDS as readonly string[]).includes(copy.kind)) error("bad-kind", `The copy "${id}" has the unknown kind "${String(copy.kind)}".`);
    if (copy.sha256 !== undefined && !SHA256.test(copy.sha256)) error("bad-sha256", `The copy "${id}" has a SHA-256 that is not 64 lower-case hexadecimal digits.`);
    const checked = timeOf(copy.checked);
    if (checked === undefined) error("bad-date", `The copy "${id}" has the check date "${copy.checked}". It needs a date YYYY-MM-DD.`);
    else if (at !== undefined && checked > at) error("checked-in-future", `The copy "${id}" has a check date after the date of the check.`);
    if (copy.written !== undefined) {
      const written = timeOf(copy.written);
      if (written === undefined) error("bad-date", `The copy "${id}" has the date of writing "${copy.written}". It needs a date YYYY-MM-DD.`);
      else if (at !== undefined && written > at) error("checked-in-future", `The copy "${id}" has a date of writing after the date of the check.`);
    }
    const life = copy.life;
    if (life !== undefined && !(life.years > 0 && life.quantile >= 0 && life.quantile <= 1 && life.source.trim() !== "")) {
      error("bad-life", `The copy "${id}" has a life that is not more than 0 years, a quantile out of 0 to 1, or no source.`);
    }
  }
  return out;
}
