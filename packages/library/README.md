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
| `Copy` | A copy of a bundle on one medium: the `bundle`, the `medium`, its `kind`, its `place`, the date `checked` of the last read, and an optional `version`, `sha256`, `life` and `written` date |
| `MediumLife` | The life of a medium at a quantile: the `years` to the failure of the fraction `quantile`, and its `source` |
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
| `aged` | The copy has a `life`, and it is older than the life. Or it has a `life` and no `written` date. | no |

A bundle with too few good copies, kinds or places gets an error: `few-copies`, `few-kinds` or `few-places`. A bundle with no rule gets the error `no-rule`. A copy with the status `due`, `bad` or `old` gets a warning: `check-due`, `bad-hash` or `old-version`. A copy with the status `aged` gets the warning `past-life` or `no-written-date`.

`checksDue` gives the last good date of each copy, the first due first. `bytesOf(bundles, ids)` gives the bytes that one medium needs for a list of bundles.

## The Kiwix catalog

Kiwix gives offline copies of open sites as ZIM files. Its OPDS feed lists each release, and the `.meta4` file of a release gives its exact size and its SHA-256. The functions are pure: the caller fetches the files, for example with `polite-crawler/api`.

```ts
import { checkReleases, kiwixFeedUrl, parseKiwixFeed, parseMeta4, withRelease } from "@mark1russell7/guidebook-library";

const entries = parseKiwixFeed(await read(kiwixFeedUrl({ lang: "eng" })));
const findings = checkReleases(bundles, entries, { at: "2026-11-21" });
const next = withRelease(bundle, entry, parseMeta4(await read(entry.meta4)));
```

The feed rounds each size up to whole KiB. Thus a bundle takes its `bytes` from `parseMeta4`, not from the feed.

| Code | Level | When |
| --- | --- | --- |
| `not-in-feed` | error | The feed has no file of the bundle. |
| `old-release` | error | The feed has a newer release, and the bundle is older than `maxAgeDays` (365 by default). |
| `newer-release` | warning | The feed has a newer release. |
| `no-hash` | warning | The bundle has no SHA-256. |
| `not-kiwix` | warning | The address of the bundle is not a ZIM release. |

The decoder of character references comes from `@mark1russell7/text`.

## Where the copies go

The plan of the copies of a level is a query of `@mark1russell7/stack-placement`. Nobody picks a place or a medium by hand.

```ts
import { bytesOf, copiesLayer, planCopies } from "@mark1russell7/guidebook-library";

const query = copiesLayer({ rule, bytes: bytesOf(bundles, ids), offers, places, currency: "USD" });
const plan = planCopies(query, rule, { today: "2026-11-21" });
plan.front.map((row) => [row.choice, row.cost, row.chance]);
```

- Each slot is one copy. The rule gives `rule.copies` slots, and `extra` gives the optional slots after them (1 by default).
- Each candidate is one medium offer at one place. An offer with less capacity than `bytes` is not a candidate.
- Each place and each kind of medium is a shared fragment. Thus two copies at one place share the loss of that place.
- The chance is the chance that one copy or more can be read at the end of one period `rule.everyDays`. `keepChance` scales each yearly loss to that period.
- An offer with a `life` gets the smaller of two chances: the yearly rate, and `lifeChance`. A medium fails more frequently when it is old, so a yearly rate alone is not a safe bound.
- `lifeChance` gives `1 - quantile` when the medium is replaced by the age `life.years`. Each period then ends by the life, so its chance is that bound or more. When `lifeYears` is more than `life.years`, the chance is 0.
- The cost is the cost of a month: `price / (lifeYears × 12)` for each copy, plus the `monthly` cost of each place.
- A plan with fewer places or fewer kinds than the rule gets the break `measure`. Thus it is not on the front.

The offers, the places and their rates of loss are input data of the caller. Each rate has its source.
