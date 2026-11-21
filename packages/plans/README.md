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

```ts
import { PHASES, checkSteps, phaseOf, stepsFor } from "@mark1russell7/guidebook-plans";

const phase = phaseOf(2 * 86_400); // "P2"
const steps = stepsFor(library, ["met.winter.storm", "energy.grid"], [phase]);
const result = checkSteps(library, sources, { phases: PHASES, on: keys, gaps });
```

## The step gate

`checkSteps` gives each finding as data, with the `Finding` type of the core. The text of a step is a summary of each of its sources, so the gate also applies the source gate of the core.

| Code | When |
| --- | --- |
| `duplicate-id` | Two steps have the same `id`. |
| `empty-text` | A step has no text `do`. |
| `no-source` | A step cites no source. |
| `missing-source` | A step cites a source that is not in the list. |
| `use-refused` | The license of a source refuses the use. An example is an invented source outside a fixture. |
| `unknown-phase` | A step or a gap has a phase that is not in `phases`. |
| `bad-order`, `duplicate-order` | The order is not an integer from 1, or two steps of a cell have the same order. |
| `unmarked-gap` | With `on`: a cell has no step and no gap marks it. |
| `gap-with-steps`, `duplicate-gap`, `empty-reason` | A gap marks a cell with steps, two gaps mark one cell, or a gap gives no reason. |

## Limits

- The gate does not evaluate `when`. The planner of an app evaluates it over the live state.
- A print cannot evaluate `when`. So the text `do` of a step with a `when` names its condition in words.
