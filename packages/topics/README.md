# @mark1russell7/guidebook-topics

The topics add-on of the guidebook. A topic is a subject that a reader can learn. The topics make a graph of prerequisites, and the print order comes from that graph.

```sh
pnpm add @mark1russell7/guidebook-topics
```

The add-on names no topic. The topics, their areas and the codes of `serves` are input data of the caller.

## The record

| Field | What it holds |
| --- | --- |
| `id` | A stable id, with the area first, for example `water.boil` |
| `title` | The title of the topic |
| `area` | The area of the topic |
| `requires` | The `id` of each topic that a reader must know first |
| `units` | The `id` of each cited unit of the core, in the sequence of the text |
| `bundles` | The `id` of each offline bundle of the library add-on that holds more of the topic |
| `serves` | Optional: the needs or functions that the topic helps to keep |
| `pages` | Optional: the count of printed pages |

## The topic gate

```ts
import { checkTopics, printOrder, prerequisitesOf } from "@mark1russell7/guidebook-topics";

const findings = checkTopics(topics, { areas, units: unitIds, bundles: bundleIds });
const book = printOrder(topics); // each topic comes after each topic that it requires
const before = prerequisitesOf(topics, "water.store");
```

The gate examines only the lists that the caller gives.

| Code | When |
| --- | --- |
| `duplicate-id` | Two topics have the same `id`. |
| `empty-title` | A topic has no title. |
| `unknown-area` | The area is not in `areas`. |
| `missing-topic` | A prerequisite is not a topic of the list. |
| `self-require` | A topic is a prerequisite of itself. |
| `cycle` | Some topics are prerequisites of each other in a cycle. One finding names all the topics of the cycle. |
| `missing-unit`, `missing-bundle` | A unit or a bundle is not in the list of the caller. |
| `unknown-serve` | A code of `serves` is not in `serves`. |
| `no-content` | A topic has no unit and no bundle. |
| `bad-pages` | The count of pages is not a whole number of 1 or more. |

`printOrder` keeps the input order of the topics of one level. It throws a `RangeError` on a cycle, so start `checkTopics` first. `cyclesOf` gives each cycle as a list of its topics.

The graph functions come from `@mark1russell7/collections`.
