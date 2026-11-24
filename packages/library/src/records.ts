// The records of the library add-on: an offline bundle, a copy of a bundle on one medium, and the copy rule of a level.

import type { IsoDate, License, SourceId } from "@mark1russell7/guidebook";

/** The kinds of media that hold a copy. */
export const MEDIUM_KINDS = ["flash", "ssd", "hdd", "optical", "paper"] as const;

/** A kind of medium. */
export type MediumKind = (typeof MEDIUM_KINDS)[number];

/**
 * An offline bundle: one file that holds a full source, for example a Kiwix ZIM file.
 * The `level` names a rule of the caller, so the add-on names no topic.
 */
export interface Bundle {
  readonly id: string;
  readonly title: string;
  /** The size of the file in bytes. */
  readonly bytes: number;
  readonly license: License;
  /** The level of the most important content of the bundle. A copy rule of the caller gives the copies of each level. */
  readonly level: string;
  /** The `id` of the source of the bundle in the sources of the core. */
  readonly source: SourceId;
  /** The release of the file, for example `2026-10`. */
  readonly version?: string;
  /** The SHA-256 of the file, as 64 lower-case hexadecimal digits. */
  readonly sha256?: string;
  /** The address of the file, with `https:` or `http:`. */
  readonly url?: string;
}

/**
 * A link of the catalog: a source with no file in the catalog, for example a source whose license permits only a link.
 * A household gets its own copy from the address, for example a book that it buys from the publisher.
 */
export interface Link {
  readonly id: string;
  readonly title: string;
  /** The `id` of the source of the link in the sources of the core. */
  readonly source: SourceId;
  /** The address of the page, with `https:` or `http:`. */
  readonly url: string;
}

/**
 * The life of a medium at a quantile, for example the time to 5% failure of a disc.
 * A medium younger than `years` fails with a chance of `quantile` or less. Past `years`, the life gives no bound.
 */
export interface MediumLife {
  /** The age in years at which the fraction `quantile` of the media fails. */
  readonly years: number;
  /** The fraction from 0 to 1 of the media that fails by the age `years`, for example 0.05. */
  readonly quantile: number;
  /** The source of the life, with its conditions, for example a temperature and a humidity. */
  readonly source: string;
}

/** A copy of a bundle on one medium. Where each copy goes is a query of the caller, for example of `stack-placement`. */
export interface Copy {
  /** The `id` of the bundle. */
  readonly bundle: string;
  /** The `id` of the medium, for example the label on a drive. */
  readonly medium: string;
  readonly kind: MediumKind;
  /** The `id` of the place of the medium. The places are input data of the caller. */
  readonly place: string;
  /** The date of the last read of the full copy against its hash. */
  readonly checked: IsoDate;
  /** The release of the bundle on the medium. */
  readonly version?: string;
  /** The SHA-256 that the last check read from the copy. */
  readonly sha256?: string;
  /** The life of the medium. A copy older than the life does not count. */
  readonly life?: MediumLife;
  /** The date on which the medium was written. A copy with a `life` needs it, because its age comes from it. */
  readonly written?: IsoDate;
}

/** The copies that a level needs. */
export interface CopyRule {
  readonly level: string;
  /** The smallest count of good copies. */
  readonly copies: number;
  /** The smallest count of different kinds of media among the good copies. */
  readonly kinds: number;
  /** The smallest count of different places among the good copies. */
  readonly places: number;
  /** A copy is good for this number of days after its last check. */
  readonly everyDays: number;
}
