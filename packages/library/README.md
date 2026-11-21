# @mark1russell7/guidebook-library

The library add-on of the guidebook. It holds a catalog of offline bundles and the copies of each bundle on media. It tells which copies are missing or old.

```sh
pnpm add @mark1russell7/guidebook-library
```

The add-on names no topic. The bundles, the levels, the media and the places are input data of the caller.

## The records

| Record | What it holds |
| --- | --- |
| `Bundle` | One offline file, for example a Kiwix ZIM file: its `id`, `title`, `bytes`, `license`, `level` and `source`, and an optional `version`, `sha256` and `url` |
| `Copy` | A copy of a bundle on one medium: the `bundle`, the `medium`, its `kind`, its `place`, the date `checked` of the last read, and an optional `version` and `sha256` |
| `CopyRule` | The copies that a level needs: the count of `copies`, of `kinds` of media and of `places`, and the days `everyDays` between two checks |

The kinds of media are `flash`, `ssd`, `hdd`, `optical` and `paper`.

## The catalog gate

```ts
import { checkCatalog, checkCopies } from "@mark1russell7/guidebook-library";

const findings = checkCatalog(bundles, { sources, rules, commercial: false });
const copyFindings = checkCopies(copies, bundles, { at: "2026-11-21" });
```

`checkCatalog` uses `permits(license, "bundle")` of the core. A bundle with a license that refuses an offline copy gets the error `use-refused`.

| Code | When |
| --- | --- |
| `duplicate-id` | Two bundles have the same `id`. |
| `empty-title` | A bundle has no title. |
| `bad-bytes` | The size is not a whole number of 1 or more. |
| `bad-sha256` | The hash is not 64 lower-case hexadecimal digits. |
| `bad-url` | The address does not start with `https:` or `http:`. |
| `unknown-license` | The core does not know the license. |
| `use-refused` | The license does not permit an offline copy. |
| `missing-source` | The `source` is not in the sources. |
| `unknown-level` | No copy rule has the level of the bundle. |

`checkCopies` gives the codes `duplicate-copy`, `missing-bundle`, `bad-kind`, `bad-sha256`, `bad-date` and `checked-in-future`.

## The state of the copies

```ts
import { checksDue, copyStates } from "@mark1russell7/guidebook-library";

const { states, findings } = copyStates(bundles, copies, rules, { at: "2026-11-21" });
const next = checksDue(bundles, copies, rules, { at: "2026-11-21", withinDays: 30 });
```

Each copy has one status:

| Status | When | Does it count? |
| --- | --- | --- |
| `good` | The last check is within the days of the rule, and the hash agrees. | yes |
| `old` | As `good`, but the copy holds an earlier release. | yes |
| `due` | The last check is older than the days of the rule. | no |
| `bad` | The hash does not agree with the hash of the same release. | no |

A bundle with too few good copies, kinds or places gets an error: `few-copies`, `few-kinds` or `few-places`. A bundle with no rule gets the error `no-rule`. A copy with the status `due`, `bad` or `old` gets a warning: `check-due`, `bad-hash` or `old-version`.

`checksDue` gives the last good date of each copy, the first due first. `bytesOf(bundles, ids)` gives the bytes that one medium needs for a list of bundles.

## Where the copies go

The add-on does not decide where each copy goes. That decision is a query of `@mark1russell7/stack-placement`, over the media, the places, their costs and their failure rates.
