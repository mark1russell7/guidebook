// The records of the core: a source and a cited unit of text.

import { LICENSE_RULES } from "./license.ts";
import type { License, Use } from "./license.ts";

/** A date as `YYYY-MM-DD`. */
export type IsoDate = string;

/** The `id` of a source. */
export type SourceId = string;

/** A page or a document, with its license and the date of the last check. The license `invented` is for test fixtures only. */
export interface Source {
  readonly id: SourceId;
  readonly title: string;
  /** The address of the source, with `https:` or `http:`. */
  readonly url: string;
  readonly license: License;
  /** The date when a person or a job last read the source and compared it with the units that cite it. */
  readonly checked: IsoDate;
  /** The name that a credit line gives, for example the agency or the authors. The default is the title. */
  readonly by?: string;
  /** A term of the publisher in addition to the license, with its date, for example "No AI ingestion (publisher, 2026-11-23)". */
  readonly note?: string;
  /** The page of the publisher that tells the terms of the reuse, with `https:` or `http:`. */
  readonly terms?: string | undefined;
  /** The date that the source shows as its last change. It is not after the date `checked`. */
  readonly updated?: IsoDate | undefined;
  /** The SHA-256 hash of the file of the source at the date `checked`, as 64 lowercase hexadecimal digits. */
  readonly sha256?: string | undefined;
}

/** The use of a cited unit. A bundle is a copy of a full source, so a unit cannot have the use `bundle`. */
export type UnitUse = Exclude<Use, "bundle">;

/**
 * A cited unit: a quote (the text word for word), a summary (the words of the guidebook) or a fact (a value with a citation).
 */
export interface CitedUnit {
  readonly id: string;
  readonly use: UnitUse;
  readonly text: string;
  readonly source: SourceId;
  /** The place of the text in the source, for example a section or a page. */
  readonly locator?: string;
}

/**
 * This function gives the credit line of a source: its name, its title, its address, its license and the date of the check.
 * A guidebook prints it under each quote and each bundle whose license needs a credit.
 */
export function creditOf(source: Source): string {
  const rule = LICENSE_RULES[source.license];
  const name = source.by === undefined || source.by === source.title ? source.title : `${source.by}: ${source.title}`;
  const license = rule.url === "" ? rule.title : `${rule.title} (${rule.url})`;
  return `${name}. ${source.url}. ${license}. Checked ${source.checked}.`;
}
