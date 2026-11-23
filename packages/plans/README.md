# @mark1russell7/guidebook-plans

The plans add-on of `@mark1russell7/guidebook`. A plan is a set of steps. Each step belongs to a key and to a phase of a time ladder.

```sh
pnpm add @mark1russell7/guidebook @mark1russell7/guidebook-plans
```

The add-on names no topic. A content package gives the steps of its topic. A runbook of a service outage and a household plan for a storm use the same records.

## The keys

A key names a case or a cut:

- A case is a kind of event, for example a storm.
- A cut is a service that an event stops, for example the power grid.

Many cases stop the same service. So most steps belong to a cut, and each case that stops the cut uses its steps. The plan of a case is its own steps and the steps of its cuts.

## The time ladder

`LADDER` is the default ladder. Each phase after the start is approximately 60 times longer than the phase before it.

| Phase | Time | Words of `PHASE_TITLES` |
| --- | --- | --- |
| `ready` | before the start, with no warning | Before an event |
| `warned` | before the start, with a warning | When a warning comes |
| `P0` | 0 to 5 minutes | In the first 5 minutes |
| `P1` | 5 minutes to 5 hours | From 5 minutes to 5 hours |
| `P2` | 5 hours to 5 days | From 5 hours to 5 days |
| `P3` | 5 days to 5 weeks | From 5 days to 5 weeks |
| `P4` | 5 weeks to 5 months | From 5 weeks to 5 months |
| `P5` | 5 months to 5 years | From 5 months to 5 years |

`phaseOf(seconds, warned)` gives the phase of a time on the default ladder. A time at a bound is in the later phase: 5 minutes gives `P1`. `phaseIn(ladder, seconds, warned)` does the same on a `Ladder` of the caller.

## The records and the queries

| Name | What it is |
| --- | --- |
| `Step` | One action: `id`, the key `on`, `phase`, `needs`, an optional condition `when`, the text `do`, `uses`, `order` and `sources` |
| `Gap` | A key and a phase that have no step on purpose, with the reason `why` |
| `stepsFor(library, on, phases)` | The steps of the keys in the phases, by key, then by phase, then by order. A step comes one time. |
| `planMatrix(library, gaps, on, phases)` | One row for each key, with one cell for each phase: its steps, or its marked gap |
| `checkSteps(steps, sources, options)` | The step gate |
| `checkCoverage(steps, options)` | The coverage gate: each key has steps in each phase |
| `coverageOf(steps, on, phases)` | The phases with steps and the phases with no step, for each key |

```ts
import { PHASES, checkSteps, phaseOf, stepsFor } from "@mark1russell7/guidebook-plans";

const phase = phaseOf(2 * 86_400); // "P2"
const steps = stepsFor(library, ["met.winter.storm", "power.grid"], [phase]);
const result = checkSteps(library, sources, { phases: PHASES, on: keys, gaps });
```

## The step gate

`checkSteps` gives each finding as data, with the `Finding` type of the core. The text of a step is a summary of each of its sources, so the gate also applies the source gate of the core.

| Code | When |
| --- | --- |
| `duplicate-id` | Two steps have the same `id`. |
| `empty-text` | A step has no text `do`. |
| `no-source` | A step cites no source and gives no `reasoning`. |
| `number-without-source` | A step with a `reasoning` and no source has a number in its text. A dose, a time or a safety limit needs a source. |
| `empty-reasoning` | A step has an empty `reasoning`. |
| `missing-source` | A step cites a source that is not in the list. |
| `use-refused` | The license of a source refuses the use. An example is an invented source outside a fixture. |
| `unknown-phase` | A step or a gap has a phase that is not in `phases`. |
| `bad-order`, `duplicate-order` | The order is not an integer from 1, or two steps of a cell have the same order. |
| `unmarked-gap` | With `on`: a cell has no step and no gap marks it. |
| `gap-with-steps`, `duplicate-gap`, `empty-reason` | A gap marks a cell with steps, two gaps mark one cell, or a gap gives no reason. |

## The coverage gate

The step gate passes a cell with a marked gap. The coverage gate does not. It examines if each key of `on` has steps in each phase of `phases`. `HORIZONS` is the set of the phases from 5 minutes to 5 years: `P0` to `P5`.

| Code | When |
| --- | --- |
| `no-step` | A cell has no step, and no gap marks it. |
| `marked-gap` | A cell has no step, and a gap marks it. The message gives the reason of the gap. |

```ts
import { HORIZONS, checkCoverage } from "@mark1russell7/guidebook-plans";

const coverage = checkCoverage(library, { on: keys, phases: HORIZONS, gaps });
// A key with no step gives one finding for each horizon. It does not pass.
```

## The decision chart

A rule of the chart has a trigger `when`, an action `then`, the keys of the trigger and a target. The target is the steps of a key in some phases. `chartOf` gives one question for each kind of rule, in this sequence:

| Kind | Question |
| --- | --- |
| `place` | Where am I? |
| `reflex` | Is there an immediate danger? |
| `module` | What is cut? |
| `stay` | When do I stay? |
| `go` | When do I go? |
| `fallback` | When do I go to a fallback place? |
| `long-plan` | When do I change to the long plan? |

A rule of the kind `place` has no target, because the places of a household are input data. The rule gate `checkRules` gives these codes:

| Code | When |
| --- | --- |
| `duplicate-id` | Two rules have the same `id`. |
| `unknown-key` | A key of the trigger or of the target is not in `on`. |
| `no-target` | A rule other than `place` has no target. |
| `target-without-steps` | The target has no step in its phases. |
| `no-source` | A rule cites no source. |
| `unknown-source` | A rule cites an id with no source. |

```ts
import { chartOf, checkRules } from "@mark1russell7/guidebook-plans";

const gate = checkRules(rules, library, sources, { on: keys });
const chart = chartOf(rules); // The questions, each with its rules in the sequence of their rank.
```

## Strategy steps and the state of society

A step that no source tells can give its `reasoning` from first principles instead of a source. The reasoning goes with the step into the print. A step with a number in its text still cites a source.

A step can name the states of society that it is for: `works`, `partly` or `none`. A step with no `society` is for each state. `stepsFor(library, keys, phases, { society: "none" })` gives the steps of one state.

## The master chart

The master chart is one chart for any disaster. A reader starts at a signal, answers a few questions and goes to a tab. A tab is a section of a printed plan: the steps of its keys in its phases, with an optional page budget `pages`. Each tab is for one need or one subject. The state of society is a section in each tab.

| Kind of node | Fields |
| --- | --- |
| `signal` | A thing that a reader sees or hears, and the `next` node. |
| `question` | A question, two or more `answers` (each with a label, the next node and an optional state of society), and its sources. |
| `goto` | An instruction that sends the reader to a `tab`. With `card: true`, it also sends the reader to the card of the event. With `next`, the reader goes on to that node after the tab. |

The chart gate `checkMasterChart` gives these codes:

| Code | When |
| --- | --- |
| `duplicate-id` | Two nodes or two tabs have the same `id`. |
| `unknown-node`, `unknown-tab`, `unknown-key` | A node goes to an unknown node or tab, or a tab names an unknown key. |
| `few-answers` | A question has fewer than 2 answers. |
| `no-signal`, `unreachable` | The chart has no signal, or no signal reaches a node. |
| `cycle` | A node is in a cycle, so its path has no end. |
| `too-deep` | A path from a signal has more questions than `maxQuestions` (default 3). |
| `too-many-nodes`, `too-many-ends` | The chart has more nodes than `maxNodes`, or more ends than `maxEnds`. |
| `tab-without-steps` | A tab with keys has no step in its keys and phases. |
| `unused-tab` | No path goes to a tab, and the tab is not in `used`. |
| `uncovered-key` | No tab that the chart reaches holds a key of `cover`. Give the hazard codes of a catalog as `cover`, so each hazard has a route. |
| `no-source`, `unknown-source` | A question cites no source and gives no `reasoning`, or a node cites an unknown source. |

```ts
import { checkMasterChart, masterChartOf } from "@mark1russell7/guidebook-plans";

const gate = checkMasterChart(nodes, tabs, library, sources, { on: keys, cover: hazards, maxNodes: 20, maxEnds: 13 });
const chart = masterChartOf(nodes, tabs); // The nodes by layer, the edges with their labels and the tabs that the chart reaches.
```

## The master graph

The master graph `MasterGraph` is the one value that a printed binder and an app read. Its schema is `GRAPH_SCHEMA`, `"guidebook-graph/2"`. A reader refuses a graph with another value. In version 2, an end can lead on to a next node.

| Field | Value |
| --- | --- |
| `schema` | The name and the major version of the schema. |
| `start`, `catalog` | The id of the tab of the chart, and the id of the tab of the hazard catalog. |
| `societies` | The states of society, in the sequence of the sections of each tab. |
| `nodes`, `tabs` | The nodes and the tabs of the chart. The edges come from `masterChartOf`, so no second list can disagree. |
| `hazards` | The rows of the hazard catalog. Each row has a case `key`, a `title`, its `signals`, its `entry` node and its `card`: the ids of the steps unique to the case. |
| `index` | The subjects of the catalog that are not hazards. Each entry has a `title`, the `tab` of its steps, and `about`: the parts of the tab. |

The graph holds ids. A reader gets the steps and the sources from their own exports. The ids of the nodes, the tabs and the steps are stable. A change of an id is a new major version of the schema.

The graph gate `checkMasterGraph` applies the chart gate. It also gives these codes:

| Code | When |
| --- | --- |
| `bad-schema` | The schema is not `GRAPH_SCHEMA`. |
| `unknown-start`, `unknown-catalog` | The start tab or the catalog tab is not a tab. |
| `unknown-hazard`, `duplicate-hazard`, `missing-hazard` | A row names an unknown case, two rows have one case, or a case of `cases` has no row. |
| `unknown-signal`, `unknown-entry` | A row names no signal, a node that is not a signal, or an unknown entry. |
| `unknown-card-step` | A card names a step that is not a step of its case. |
| `no-route` | No path from the entry of a row goes to a tab with keys. |
| `unknown-index-tab`, `duplicate-index` | An index entry names an unknown tab, or two entries of the catalog have one title. |

```ts
import { checkMasterGraph } from "@mark1russell7/guidebook-plans";

const gate = checkMasterGraph(graph, library, sources, { on: keys, cover: hazards, cases, maxNodes: 20, maxEnds: 13 });
```

### The walk of the graph

The walk functions give one query over the graph for each reader: the app and the converter of the binder. The state of a walk `WalkState` is plain data: the node `at`, the `hazard`, the state of `society` and the `trail`.

| Function | Result |
| --- | --- |
| `walkStart(graph, hazard?, signal?)` | The start: the entry of the row of the hazard, or a signal. |
| `walkAnswer(graph, state, label?)` | The state after an answer. An answer with a state of society sets it. |
| `walkBack(state)` | The state one node back, with the state of society at that node. |
| `walkEnd(graph, state, steps)` | At a goto: the tab, the steps of its keys by phase for the state of society, and the card of the hazard. |

```ts
import { walkAnswer, walkEnd, walkStart } from "@mark1russell7/guidebook-plans";

const start = walkStart(graph, "met.flood"); // At the entry of the row of the flood.
const next = start && walkAnswer(graph, start, "No");
const end = next && walkEnd(graph, next, steps); // The tab, its steps by phase and the card of the flood.
```

## Limits

- The gate does not evaluate `when`. The planner of an app evaluates it over the live state.
- A print cannot evaluate `when`. So the text `do` of a step with a `when` names its condition in words.
