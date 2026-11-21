// The Kiwix catalog: its OPDS feed of ZIM files, the Metalink file (`.meta4`) of each release, and the release gate.
// The functions are pure. The caller fetches the feed and the `.meta4` files, for example with `polite-crawler/api`.

import type { Finding, IsoDate } from "@mark1russell7/guidebook";
import { DAY_MS, timeOf } from "@mark1russell7/guidebook";
import { decodeReferences } from "@mark1russell7/text/references";
import type { Bundle } from "./records.ts";

/** The address of the OPDS catalog of Kiwix. */
export const KIWIX_CATALOG = "https://opds.library.kiwix.org/catalog/v2";

/** One ZIM file of the OPDS feed of Kiwix. */
export interface KiwixEntry {
  /** The key of the file: its name with its flavour, for example `wikipedia_en_medicine_nopic`. */
  readonly key: string;
  readonly name: string;
  /** The flavour of the file, for example `nopic`, or an empty text. */
  readonly flavour: string;
  readonly title: string;
  /** The release of the file, `YYYY-MM`. */
  readonly release: string;
  /** The date of the release. */
  readonly issued: IsoDate;
  /** The address of the `.meta4` file of the release. */
  readonly meta4: string;
  /** The size that the feed gives. The feed rounds it up to whole KiB, so `parseMeta4` gives the exact size. */
  readonly approxBytes: number;
}

/** The facts of one file in a `.meta4` file. */
export interface Meta4 {
  /** The name of the file, for example `wikipedia_en_medicine_nopic_2026-10.zim`. */
  readonly file: string;
  /** The exact size of the file in bytes. */
  readonly bytes: number;
  /** The SHA-256 of the file, as 64 lower-case hexadecimal digits. */
  readonly sha256: string;
}

/** The options of `kiwixFeedUrl`. */
export interface FeedQuery {
  /** The ISO 639-3 code of the language, for example `eng`. */
  readonly lang?: string;
  /** The name of a file, for example `wikipedia_en_medicine`. */
  readonly name?: string;
  /** The largest count of entries. The default is 2000. */
  readonly count?: number;
  /** The address of the catalog. The default is `KIWIX_CATALOG`. */
  readonly catalog?: string;
}

/** This function gives the address of the OPDS feed of the entries that agree with the query. */
export function kiwixFeedUrl(query: FeedQuery = {}): string {
  const params: [string, string][] = [];
  if (query.lang !== undefined) params.push(["lang", query.lang]);
  if (query.name !== undefined) params.push(["name", query.name]);
  params.push(["count", String(query.count ?? 2000)]);
  const search = params.map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join("&");
  return `${query.catalog ?? KIWIX_CATALOG}/entries?${search}`;
}

const FILE = /^([a-z0-9._-]+?)_(\d{4}-\d{2})\.zim$/u;

/** This function gives the key and the release of a ZIM file from its name or its address, or `undefined` for another file. */
export function kiwixKeyOf(fileOrUrl: string): { readonly key: string; readonly release: string } | undefined {
  const file = fileOrUrl.split(/[?#]/u)[0]?.split("/").at(-1)?.replace(/\.meta4$/u, "") ?? "";
  const match = FILE.exec(file);
  return match === null ? undefined : { key: match[1] ?? "", release: match[2] ?? "" };
}

function textOf(xml: string, tag: string): string | undefined {
  const match = new RegExp(`<${tag}(?:\\s[^>]*)?>([^<]*)</${tag}>`, "u").exec(xml);
  return match === null ? undefined : decodeReferences(match[1] ?? "").trim();
}

function attributeOf(tag: string, name: string): string | undefined {
  const match = new RegExp(`\\s${name}="([^"]*)"`, "u").exec(tag);
  return match === null ? undefined : decodeReferences(match[1] ?? "");
}

/**
 * This function gives the entries of an OPDS feed of Kiwix.
 * An entry with no open-access link to a `.meta4` file of a ZIM release is not in the result.
 */
export function parseKiwixFeed(xml: string): readonly KiwixEntry[] {
  const out: KiwixEntry[] = [];
  for (const part of xml.split("<entry>").slice(1)) {
    const entry = part.split("</entry>")[0] ?? "";
    const link = /<link\s[^>]*rel="http:\/\/opds-spec\.org\/acquisition\/open-access"[^>]*>/u.exec(entry)?.[0];
    const meta4 = link === undefined ? undefined : attributeOf(link, "href");
    const file = meta4 === undefined ? undefined : kiwixKeyOf(meta4);
    if (link === undefined || meta4 === undefined || file === undefined) continue;
    const issued = (textOf(entry, "dc:issued") ?? textOf(entry, "updated") ?? "").slice(0, 10);
    out.push({
      key: file.key,
      name: textOf(entry, "name") ?? "",
      flavour: textOf(entry, "flavour") ?? "",
      title: textOf(entry, "title") ?? "",
      release: file.release,
      issued,
      meta4,
      approxBytes: Number(attributeOf(link, "length") ?? "0"),
    });
  }
  return out;
}

/** This function gives the file, the exact size and the SHA-256 of the first file of a `.meta4` file. It throws a `RangeError` when one is missing. */
export function parseMeta4(xml: string): Meta4 {
  const block = /<file\s+name="([^"]+)"\s*>([\s\S]*?)<\/file>/u.exec(xml);
  const file = block?.[1];
  const bytes = Number(textOf(block?.[2] ?? "", "size") ?? Number.NaN);
  const sha256 = /<hash\s+type="sha-256"\s*>([0-9a-fA-F]{64})<\/hash>/u.exec(block?.[2] ?? "")?.[1]?.toLowerCase();
  if (file === undefined || !Number.isSafeInteger(bytes) || bytes < 1 || sha256 === undefined) {
    throw new RangeError("parseMeta4: the file has no file name, no size or no SHA-256.");
  }
  return { file: decodeReferences(file), bytes, sha256 };
}

/** This function gives the newest release of each key of the entries. */
export function latestReleases(entries: readonly KiwixEntry[]): ReadonlyMap<string, KiwixEntry> {
  const out = new Map<string, KiwixEntry>();
  for (const entry of entries) {
    const known = out.get(entry.key);
    if (known === undefined || entry.release > known.release) out.set(entry.key, entry);
  }
  return out;
}

/** The address of the ZIM file of a `.meta4` address: the same address with no `.meta4`. */
export function zimUrlOf(meta4: string): string {
  return meta4.replace(/\.meta4$/u, "");
}

/**
 * This function gives the bundle with the release of the entry: its version, its exact size, its SHA-256 and its address.
 * It throws a `RangeError` when the `.meta4` file is for a different file.
 */
export function withRelease(bundle: Bundle, entry: KiwixEntry, meta4: Meta4): Bundle {
  const file = kiwixKeyOf(meta4.file);
  if (file?.key !== entry.key || file.release !== entry.release) {
    throw new RangeError(`withRelease: the .meta4 file is for "${meta4.file}", not for ${entry.key} ${entry.release}.`);
  }
  return { ...bundle, version: entry.release, bytes: meta4.bytes, sha256: meta4.sha256, url: zimUrlOf(entry.meta4) };
}

/** The codes of the release gate. */
export const RELEASE_CODES = ["not-kiwix", "not-in-feed", "newer-release", "old-release", "no-hash"] as const;

/** A code of the release gate. */
export type ReleaseCode = (typeof RELEASE_CODES)[number];

/** A finding of the release gate. */
export type ReleaseFinding = Finding<ReleaseCode, "bundle">;

/** The options of `checkReleases`. */
export interface ReleaseOptions {
  /** The date of the read of the feed. */
  readonly at: IsoDate;
  /** A newer release is an error when the release of the bundle is older than this count of days. The default is 365. */
  readonly maxAgeDays?: number;
}

/**
 * This function compares each bundle with a Kiwix address to the newest release of the feed.
 * - The feed has no file of the key: the error `not-in-feed`.
 * - The feed has a newer release: the warning `newer-release`, or the error `old-release` when the bundle is older than `maxAgeDays`.
 * - The bundle has no SHA-256: the warning `no-hash`.
 * - A bundle with an address that is not a ZIM release gets the warning `not-kiwix`.
 */
export function checkReleases(bundles: readonly Bundle[], entries: readonly KiwixEntry[], options: ReleaseOptions): readonly ReleaseFinding[] {
  const at = timeOf(options.at);
  if (at === undefined) throw new RangeError(`checkReleases: the date "${options.at}" is not a date YYYY-MM-DD.`);
  const maxAgeDays = options.maxAgeDays ?? 365;
  const latest = latestReleases(entries);
  const out: ReleaseFinding[] = [];
  const add = (level: "error" | "warning", code: ReleaseCode, id: string, message: string): void => {
    out.push({ level, code, record: "bundle", id, message });
  };
  for (const bundle of bundles) {
    if (bundle.url === undefined) continue;
    const file = kiwixKeyOf(bundle.url);
    if (file === undefined) {
      add("warning", "not-kiwix", bundle.id, `The bundle "${bundle.id}" has the address "${bundle.url}". It is not a ZIM release of Kiwix.`);
      continue;
    }
    const entry = latest.get(file.key);
    if (entry === undefined) {
      add("error", "not-in-feed", bundle.id, `The Kiwix feed has no file "${file.key}" of the bundle "${bundle.id}".`);
    } else if (entry.release > file.release) {
      const released = timeOf(`${file.release}-01`);
      const old = released !== undefined && (at - released) / DAY_MS > maxAgeDays;
      add(old ? "error" : "warning", old ? "old-release" : "newer-release", bundle.id, `The bundle "${bundle.id}" has the release ${file.release}. The Kiwix feed has ${entry.release}.`);
    }
    if (bundle.sha256 === undefined) add("warning", "no-hash", bundle.id, `The bundle "${bundle.id}" has no SHA-256. Read it from the .meta4 file of its release.`);
  }
  return out;
}
