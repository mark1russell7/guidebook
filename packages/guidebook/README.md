# @mark1russell7/guidebook

The core of a guidebook of cited knowledge. Each unit of text has its source, and each source has its license. The source gate examines the two.

```sh
pnpm add @mark1russell7/guidebook
```

The core names no topic. Each topic is an add-on package with its own records. Examples are steps of a plan and topics of a library.

## The records

| Record | What it holds |
| --- | --- |
| `Source` | A page or a document: its `id`, `title`, `url`, `license`, the date `checked` of the last read, and the optional name `by`. The optional `terms` is the page of the reuse terms, `updated` is the date of the last change that the source shows, and `sha256` is the hash of the file at the check. |
| `CitedUnit` | A unit of text: its `id`, its `use`, its `text`, the `id` of its `source`, and an optional `locator` in the source |

A unit has one of three uses:

- `quote`: the text of the source, word for word.
- `summary`: the text in the words of the guidebook.
- `fact`: a value with a citation.

## The licenses

`LICENSE_RULES` gives the rule of each license. `permits(license, use, context)` tells if a license permits a use. The use `bundle` is an offline copy of the full source.

| License | `quote` | `bundle` | `summary` and `fact` | Credit line | Layer of a quote |
| --- | --- | --- | --- | --- | --- |
| `us-public-domain`, `public-domain`, `cc0` | yes | yes | yes | no | `main` |
| `cc-by-4.0`, `ogl-uk-3.0`, `gutenberg` | yes | yes | yes | yes | `main` |
| `cc-by-sa-4.0`, `cc-by-sa-3.0` | yes | yes | yes | yes | `share-alike` |
| `cc-by-nc-sa-3.0` | no | only when not commercial | yes | yes | `share-alike` |
| `all-rights-reserved` | no | no | yes | no | `main` |
| `link-only` | no | no | no | no | `main` |
| `invented` | only in a fixture | only in a fixture | only in a fixture | no | `main` |

A US federal work is in the public domain under 17 USC 105. The Project Gutenberg License covers works in the US public domain. A copy for a fee pays the royalty of its trademark license, or removes the name. A summary and a fact are the words of the guidebook, so each real license permits them, but `link-only` does not. Use `link-only` when the publisher permits only a link, for example when it refuses each AI use of its text. Put the word of the publisher and its date in the field `note` of the source.

## The source gate

```ts
import { assertGate, creditOf, gate } from "@mark1russell7/guidebook";

const sources = [{ id: "water", title: "Water", url: "https://www.ready.gov/water", license: "us-public-domain", checked: "2026-11-21" }] as const;
const units = [{ id: "water-gallon", use: "fact", text: "Store 1 gallon of water for each person for each day.", source: "water" }] as const;

const result = gate(units, sources, { at: "2026-11-21" });
result.ok; // true
assertGate(units, sources); // throws an error that names each finding of the level "error"
creditOf(sources[0]); // "Water. https://www.ready.gov/water. US public domain (17 USC 105) (...). Checked 2026-11-21."
```

The gate gives each finding as data, with a level, a code, the record and a message:

| Code | Level | When |
| --- | --- | --- |
| `duplicate-id` | `error` | Two sources or two units have the same `id`. |
| `empty-title`, `empty-text` | `error` | A source has no title, or a unit has no text. |
| `bad-url` | `error` | The address or the terms address of a source does not start with `https:` or `http:`. With the option `https`, it does not start with `https:`. |
| `bad-date` | `error` | The check date is not a real date `YYYY-MM-DD`. |
| `unknown-license` | `error` | The license is not in `LICENSES`. |
| `checked-in-future` | `error` | The check date is after the date `at` of the gate. |
| `updated-after-check` | `error` | The change date `updated` is after the check date. |
| `bad-sha256` | `error` | The hash `sha256` is not 64 lowercase hexadecimal digits. |
| `missing-field` | `error` | A source has no text in a field of the option `require`. |
| `stale` | `warning` | The check is older than `maxAgeDays` (365 by default) before `at`. |
| `missing-source` | `error` | A unit cites a source that is not in the list. |
| `use-refused` | `error` | The license of the source refuses the use of the unit, or the use is not in `USES`. |

Since 0.5.1, the gate does not throw for a source or a unit from JSON with a bad shape. A field of a wrong type gives the finding of that field. For example, a title that is not a text gives `empty-title`. An item that is not a record has no fields, so it gives the finding of each necessary field.

A dataset adds its own rules with two options of `checkSources` and `gate`:

- `require` is a list of optional fields that each source must have, from `SOURCE_FIELDS`: `by`, `note`, `terms`, `updated` and `sha256`.
- `https: true` accepts only addresses with `https:`, for the address and the terms address.

```ts
checkSources(sources, { require: ["by", "terms"], https: true });
```

`layerOf(unit, source)` gives the layer of a printed unit. A share-alike quote prints in its own layer, so the rest of the guidebook keeps its own license.

## Limits

- The gate does not compare a quote with the text of its source. A job that reads the source does that, and then sets `checked`.
- The table holds the licenses of the first sources. A new license goes into `LICENSES` and `LICENSE_RULES` in a pull request.
- The rules are a reading of the license texts. They are not legal advice.
