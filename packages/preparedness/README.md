# @mark1russell7/guidebook-preparedness

The preparedness content of `@mark1russell7/guidebook`. It gives the steps of a household plan for 12 cases and 6 cuts, in each phase of the time ladder.

```sh
pnpm add @mark1russell7/guidebook @mark1russell7/guidebook-plans @mark1russell7/guidebook-preparedness
```

The core and the plans add-on name no topic. This package is the first topic.

## The content

| Name | What it is |
| --- | --- |
| `SOURCES` | The 19 sources: pages of Ready.gov, CDC and FDA. Each page is in the US public domain. |
| `CASE_STEPS` | The steps of the 12 cases |
| `CUT_STEPS` | The steps of the 6 cuts |
| `STEPS` | All the steps |
| `GAPS` | The marked gaps: each key and phase with no step on purpose, with the reason |
| `CASES` | The codes of the cases |
| `CUTS` | The ids of the cuts |
| `NEEDS` | The need codes that the steps protect |

The steps are full from `ready` to `P3`. `P4` and `P5` are an outline. Each cell of the matrix has a step or a marked gap.

```ts
import { stepsFor, phaseOf } from "@mark1russell7/guidebook-plans";
import { STEPS } from "@mark1russell7/guidebook-preparedness";

const steps = stepsFor(STEPS, ["met.winter.storm", "energy.grid", "road.local"], [phaseOf(2 * 86_400)]);
```

## The keys

The 12 cases are the codes of an event taxonomy:

`met.winter.storm`, `met.tropical.hurricane`, `met.flood`, `met.heat.extreme`, `met.tornado`, `geo.earthquake`, `fire.structure`, `fire.wildfire`, `cbrne.hazardous-materials`, `cbrne.radiological`, `health.outbreak`, `safety.evacuation`.

The 6 cuts are the services that an event stops:

`energy.grid`, `water.main`, `road.local`, `telecom.network`, `gas.main`, `store.pharmacy`.

The ids of the cuts are a proposal. A model of the system stack can give other ids. Then this package changes its ids to agree.

## The words

Each step is one instruction in Simplified Technical English, in the words of the guidebook. It is a summary of its sources, not a quote. Each step cites one or more pages that tell the action.

The test of the package applies these gates:

- The source gate of the core, on the sources.
- The step gate of the plans add-on, over all the keys and all the phases, with no unmarked gap.
- The rules of `ste-lint` on the text of each step and the reason of each gap.
- No plan of a case gives the same text two times.

## The limits

- The steps are general advice for a household. They do not replace the instructions of the local authorities.
- The sources are US pages. A user in another country uses the sources of that country.
- A step names no place. The places and the contacts of a household are input data.
