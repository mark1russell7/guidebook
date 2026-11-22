# @mark1russell7/guidebook-preparedness

The preparedness content of `@mark1russell7/guidebook`. It gives the steps of a household plan for 12 cases and 7 cuts, in each phase of the time ladder. It also gives 40 topics to learn and a catalog of offline bundles.

```sh
pnpm add @mark1russell7/guidebook @mark1russell7/guidebook-plans @mark1russell7/guidebook-preparedness
```

The core and the plans add-on name no topic. This package is the first topic.

## The content

| Name | What it is |
| --- | --- |
| `SOURCES` | The 70 sources. The 63 sources of the steps are 55 pages of US federal agencies in the US public domain, 3 pages of the UK Government under the Open Government Licence v3.0, 3 pages of the Finnish 72 hours guidance and 2 pages of the Swedish civil defence agency. A step is a summary of its sources, not a quote. The 5 sources of the bundles are 4 open wikis and the Stack Exchange network, under CC BY-SA 4.0. The 2 sources of the media rates are reports of Backblaze. |
| `CASE_STEPS` | The steps of the 12 cases and of the 14 more cases |
| `CUT_STEPS` | The steps of the 7 cuts |
| `STEPS` | All the steps |
| `GAPS` | The marked gaps: each key and phase with no step on purpose, with the reason |
| `RULES` | The 37 trigger rules of the decision chart. Each rule cites its sources and sends the reader to the steps of a key. |
| `CASES` | The codes of the 12 cases |
| `MORE_CASES` | The codes of 14 more cases, with the same gates |
| `CUTS` | The ids of the cuts |
| `NEEDS` | The need codes that the steps protect |
| `TOPICS` | The 40 topics, as a graph of prerequisites |
| `AREAS` | The 12 areas of the topics |
| `BUNDLES` | The 16 offline bundles: Kiwix files of Wikipedia, Wikibooks, Appropedia, energypedia and 10 sites of Stack Exchange |
| `BUNDLE_LEVELS` | The levels of the bundles: `pocket` fits on one flash drive of 32 GB, and `shelf` needs a larger drive |
| `BUNDLES_CHECKED` | The date of the last read of the Kiwix catalog |
| `MEDIA_UNITS` | The cited fact units of the loss rates of the media |
| `MEDIUM_LOSSES` | The yearly loss of each kind of medium with a cited rate: hard drives and SSDs |
| `MEDIUM_GAPS` | The kinds of medium with no cited rate: flash, optical and paper |

The steps are full from `ready` to `P3`. `P4` and `P5` are an outline. Each cell of the matrix has a step or a marked gap.

```ts
import { stepsFor, phaseOf } from "@mark1russell7/guidebook-plans";
import { STEPS } from "@mark1russell7/guidebook-preparedness";

const steps = stepsFor(STEPS, ["met.winter.storm", "power.grid", "road.local"], [phaseOf(2 * 86_400)]);
```

## The keys

The 12 cases are the codes of an event taxonomy:

`met.winter.storm`, `met.tropical.hurricane`, `met.flood`, `met.heat.extreme`, `met.tornado`, `geo.earthquake`, `fire.wildfire`, `fire.structure`, `infra.power.outage`, `infra.water.outage`, `health.outbreak`, `health.medical-emergency`.

The code `health.medical-emergency` is new in the taxonomy. A household starts this case, because no feed gives it.

An evacuation is a set of steps of the hurricane, the flood and the wildfire, not a case. The power outage and the water outage use the steps of their cuts.

The 14 more cases are `cbrne.hazardous-materials`, `cbrne.radiological`, `civic.ai-collapse`, `health.outbreak.pandemic`, `infra.supply-chain.food`, `infra.power.grid-collapse`, `cyber.infrastructure-attack`, `civic.economy.collapse`, `security.civil-unrest`, `cbrne.nuclear-detonation`, `security.nuclear-war`, `cbrne.emp`, `geo.space-weather.geomagnetic-storm` and `security.armed-conflict`. The case `civic.ai-collapse` is a collapse that AI causes. It includes a loss of jobs and income, fraud with cloned voices and false images, and attacks on accounts and homes. Its steps go from `ready` to `P5`.

The 7 cuts are the services that an event stops. Their ids are the ids of `SUPPLY_PARTS` in `@mark1russell7/stack-hazards`:

`power.grid`, `water.main`, `road.local`, `phone.network`, `network.access`, `gas.main`, `care.local`.

The other parts of `SUPPLY_PARTS` have no steps yet.

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

The size, the release and the address of each bundle come from the Kiwix catalog. A share-alike bundle keeps its license and its credit line. A use of a Stack Exchange bundle shows the network as the source, links each question, and shows and links the name of each author.

## The limits

- The steps are general advice for a household. They do not replace the instructions of the local authorities.
- Most sources are US pages. A user in another country uses the sources of that country.
- A step names no place. The places and the contacts of a household are input data.
