// The licenses of the sources, and the rule of each license.
// The rules come from the text of each license. A rule tells what a guidebook can do with the text of a source.

/** The licenses that the gate knows. The license `invented` is for test fixtures only. */
export const LICENSES = [
  "us-public-domain",
  "public-domain",
  "cc0",
  "cc-by-4.0",
  "cc-by-sa-4.0",
  "cc-by-sa-3.0",
  "cc-by-nc-sa-3.0",
  "ogl-uk-3.0",
  "all-rights-reserved",
  "invented",
] as const;

/** A license of a source. The source gate refuses a use that the license does not permit. */
export type License = (typeof LICENSES)[number];

/** The ways to use a source. A unit of text has one use, and an offline copy of the full source is a bundle. */
export const USES = ["quote", "summary", "fact", "bundle"] as const;

/**
 * A use of a source.
 * `quote` is the text word for word. `summary` is the text in the words of the guidebook. `fact` is a value with a citation.
 * `bundle` is an offline copy of the full source.
 */
export type Use = (typeof USES)[number];

/** The layer of a printed quote. A share-alike quote prints in its own layer, with its credit and its license. */
export type Layer = "main" | "share-alike";

/** The rule of one license. */
export interface LicenseRule {
  /** The name of the license that a credit line prints. */
  readonly title: string;
  /** The address of the text of the license, or an empty string when the license has no text. */
  readonly url: string;
  /** This field is true when a guidebook can print the text of the source word for word. */
  readonly quote: boolean;
  /** This field is true when a guidebook can keep an offline copy of the full source. */
  readonly bundle: boolean;
  /** This field is true when the license permits only a use that is not commercial. */
  readonly nonCommercial: boolean;
  /** The layer of a quote. A share-alike license needs its own layer, so the rest of the guidebook keeps its own license. */
  readonly layer: Layer;
  /** This field is true when a quote or a bundle must print the credit line of the source. */
  readonly credit: boolean;
  /** This field is false for the license `invented`. A real guidebook cites only real sources. */
  readonly real: boolean;
}

/**
 * The rule of each license.
 *
 * - A US federal work (17 USC 105), a work in the public domain and a CC0 work permit each use.
 * - A CC BY work permits each use with a credit line. A CC BY-SA quote also needs its own layer.
 * - A CC BY-NC-SA work permits a bundle only while the guidebook is not commercial. The gate refuses a quote of it.
 * - A work with all rights reserved permits only a summary and a fact, with a citation.
 */
export const LICENSE_RULES: Readonly<Record<License, LicenseRule>> = {
  "us-public-domain": {
    title: "US public domain (17 USC 105)",
    url: "https://www.law.cornell.edu/uscode/text/17/105",
    quote: true,
    bundle: true,
    nonCommercial: false,
    layer: "main",
    credit: false,
    real: true,
  },
  "public-domain": { title: "Public domain", url: "", quote: true, bundle: true, nonCommercial: false, layer: "main", credit: false, real: true },
  cc0: {
    title: "CC0 1.0",
    url: "https://creativecommons.org/publicdomain/zero/1.0/",
    quote: true,
    bundle: true,
    nonCommercial: false,
    layer: "main",
    credit: false,
    real: true,
  },
  "cc-by-4.0": {
    title: "CC BY 4.0",
    url: "https://creativecommons.org/licenses/by/4.0/",
    quote: true,
    bundle: true,
    nonCommercial: false,
    layer: "main",
    credit: true,
    real: true,
  },
  "cc-by-sa-4.0": {
    title: "CC BY-SA 4.0",
    url: "https://creativecommons.org/licenses/by-sa/4.0/",
    quote: true,
    bundle: true,
    nonCommercial: false,
    layer: "share-alike",
    credit: true,
    real: true,
  },
  "cc-by-sa-3.0": {
    title: "CC BY-SA 3.0",
    url: "https://creativecommons.org/licenses/by-sa/3.0/",
    quote: true,
    bundle: true,
    nonCommercial: false,
    layer: "share-alike",
    credit: true,
    real: true,
  },
  "cc-by-nc-sa-3.0": {
    title: "CC BY-NC-SA 3.0",
    url: "https://creativecommons.org/licenses/by-nc-sa/3.0/",
    quote: false,
    bundle: true,
    nonCommercial: true,
    layer: "share-alike",
    credit: true,
    real: true,
  },
  "ogl-uk-3.0": {
    title: "Open Government Licence v3.0",
    url: "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/",
    quote: true,
    bundle: true,
    nonCommercial: false,
    layer: "main",
    credit: true,
    real: true,
  },
  "all-rights-reserved": { title: "All rights reserved", url: "", quote: false, bundle: false, nonCommercial: false, layer: "main", credit: false, real: true },
  invented: { title: "Invented for a test", url: "", quote: false, bundle: false, nonCommercial: false, layer: "main", credit: false, real: false },
};

/** The context of a use. A guidebook that is sold, or that shows paid advertisements, is commercial. */
export interface UseContext {
  /** This field is true when the guidebook is commercial. The default is false. */
  readonly commercial?: boolean;
  /** This field is true when the guidebook is a test fixture, so the license `invented` passes. The default is false. */
  readonly fixture?: boolean;
}

/**
 * This function tells if a license permits a use.
 * A summary and a fact are the words of the guidebook, so each real license permits them.
 * A non-commercial license refuses each use of its text in a commercial guidebook. A summary and a fact are not its text, so they stay.
 */
export function permits(license: License, use: Use, context: UseContext = {}): boolean {
  const rule = LICENSE_RULES[license];
  if (!rule.real) return context.fixture === true;
  if (use === "summary" || use === "fact") return true;
  if (rule.nonCommercial && context.commercial === true) return false;
  return use === "quote" ? rule.quote : rule.bundle;
}
