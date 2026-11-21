# @mark1russell7/guidebook-preparedness

The preparedness content of `@mark1russell7/guidebook`. It gives the steps of a household plan for 12 cases and 6 cuts, in each phase of the time ladder. It also gives 40 topics to learn and a catalog of offline bundles.

```sh
pnpm add @mark1russell7/guidebook @mark1russell7/guidebook-plans @mark1russell7/guidebook-preparedness
```

The core and the plans add-on name no topic. This package is the first topic.

## The content

| Name | What it is |
| --- | --- |
| `SOURCES` | The 23 sources. The 19 sources of the steps are pages of Ready.gov, CDC and FDA in the US public domain. The 4 sources of the bundles are open wikis under CC BY-SA 4.0. |
| `CASE_STEPS` | The steps of the 12 cases |
| `CUT_STEPS` | The steps of the 6 cuts |
| `STEPS` | All the steps |
| `GAPS` | The marked gaps: each key and phase with no step on purpose, with the reason |
| `CASES` | The codes of the cases |
| `CUTS` | The ids of the cuts |
| `NEEDS` | The need codes that the steps protect |
| `TOPICS` | The 40 topics, as a graph of prerequisites |
| `AREAS` | The 12 areas of the topics |
| `BUNDLES` | The 6 offline bundles: Kiwix files of Wikipedia, Wikibooks, Appropedia and energypedia |
| `BUNDLE_LEVELS` | The levels of the bundles: `pocket` fits on one flash drive of 32 GB, and `shelf` needs a larger drive |
| `BUNDLES_CHECKED` | The date of the last read of the Kiwix catalog |

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

## The topics and the bundles

```ts
import { printOrder } from "@mark1russell7/guidebook-topics";
import { TOPICS } from "@mark1russell7/guidebook-preparedness";

const book = printOrder(TOPICS); // each topic comes after its prerequisites
```

Each topic names the bundles that hold it. The cited units of the topics are not written yet.

The size, the release and the address of each bundle come from the Kiwix catalog. A share-alike bundle keeps its license and its credit line.

## The limits

- The steps are general advice for a household. They do not replace the instructions of the local authorities.
- The sources are US pages. A user in another country uses the sources of that country.
- A step names no place. The places and the contacts of a household are input data.
