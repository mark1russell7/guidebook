// The model of the demo: pure functions over the content of the guidebook. The page draws what they give.

import { LICENSE_RULES, checkSources, creditOf, type Finding, type Source } from "@mark1russell7/guidebook";
import {
  HORIZONS,
  PHASES,
  PHASE_TITLES,
  checkCoverage,
  checkSteps,
  planMatrix,
  stepsFor,
  type Cell,
  type CoverageFinding,
  type Gap,
  type Phase,
  type Step,
  type StepFinding,
} from "@mark1russell7/guidebook-plans";
import { CASES, CHECKED, CUTS, GAPS, MORE_CASES, SOURCES, STEPS } from "@mark1russell7/guidebook-preparedness";

/** The words of each case and each cut, for the page. */
export const KEY_TITLES: Readonly<Record<string, string>> = {
  "met.winter.storm": "Winter storm",
  "met.tropical.hurricane": "Hurricane",
  "met.flood": "Flood",
  "met.heat.extreme": "Extreme heat",
  "met.tornado": "Tornado",
  "geo.earthquake": "Earthquake",
  "fire.wildfire": "Wildfire",
  "fire.structure": "House fire",
  "infra.power.outage": "Power outage",
  "infra.water.outage": "Water outage",
  "health.outbreak": "Outbreak of a disease",
  "health.medical-emergency": "Medical emergency at home",
  "cbrne.hazardous-materials": "Hazardous materials",
  "cbrne.radiological": "Radiological emergency",
  "energy.grid": "No power from the grid",
  "water.main": "No water from the main",
  "road.local": "Closed local roads",
  "telecom.network": "No phone or internet",
  "gas.main": "No gas from the main",
  "store.pharmacy": "Closed pharmacy",
};

/** The words of a key. A key with no title shows its code. */
export function titleOf(key: string): string {
  return KEY_TITLES[key] ?? key;
}

/** All the cases of the demo: the 12 cases of v1, then the 2 more cases. */
export const ALL_CASES: readonly string[] = [...CASES, ...MORE_CASES];

/** All the keys of the matrix: the cases, then the cuts. */
export const KEYS: readonly string[] = [...ALL_CASES, ...CUTS];

/** The cut that each outage case is, so that the demo ticks it with the case. */
export const CUT_OF_CASE: Readonly<Record<string, string>> = {
  "infra.power.outage": "energy.grid",
  "infra.water.outage": "water.main",
};

const SOURCE_BY_ID: ReadonlyMap<string, Source> = new Map(SOURCES.map((source) => [source.id, source]));

/** A source of a step, as the page shows it. */
export interface Citation {
  readonly id: string;
  readonly name: string;
  readonly url: string;
  readonly license: string;
  readonly credit: string;
}

/** This function gives the citation of a source id, or undefined for an id with no source. */
export function citationOf(id: string): Citation | undefined {
  const source = SOURCE_BY_ID.get(id);
  if (source === undefined) return undefined;
  const name = source.by === undefined || source.by === source.title ? source.title : `${source.by}: ${source.title}`;
  return { id, name, url: source.url, license: LICENSE_RULES[source.license].title, credit: creditOf(source) };
}

/** The part of a plan in one phase: the steps of the chosen keys, and the marked gaps of the keys with no step. */
export interface PlanPhase {
  readonly phase: Phase;
  readonly title: string;
  readonly steps: readonly Step[];
  readonly gaps: readonly Gap[];
}

/** This function gives the plan of a case and its cuts, in each chosen phase, in the sequence of the ladder. */
export function planOf(keys: readonly string[], phases: readonly Phase[]): readonly PlanPhase[] {
  const chosen = PHASES.filter((phase) => phases.includes(phase));
  return chosen.map((phase) => {
    const steps = stepsFor(STEPS, keys, [phase]);
    const withSteps = new Set(steps.map((step) => step.on));
    const gaps = GAPS.filter((gap) => gap.phase === phase && keys.includes(gap.on) && !withSteps.has(gap.on));
    return { phase, title: PHASE_TITLES[phase], steps, gaps };
  });
}

/** The state of a cell of the matrix. */
export type CellState = "steps" | "gap" | "empty";

/** This function gives the state of a cell: it has steps, it is a marked gap, or it is empty. */
export function stateOf(cell: Cell): CellState {
  if (cell.steps.length > 0) return "steps";
  return cell.gap === undefined ? "empty" : "gap";
}

/** This function gives the matrix of the library over the chosen keys, one row for each key. */
export function matrixOf(keys: readonly string[] = KEYS): readonly (readonly Cell[])[] {
  return planMatrix(STEPS, GAPS, keys, PHASES);
}

/** The result of the gates on the content, as the page shows it. */
export interface GateReport {
  readonly checked: string;
  readonly sources: number;
  readonly steps: number;
  readonly gaps: number;
  readonly cells: number;
  readonly filled: number;
  readonly findings: readonly (Finding | StepFinding)[];
  /** The cells of the horizons from 5 minutes to 5 years. */
  readonly horizonCells: number;
  /** The cells of the horizons that have one or more steps. */
  readonly covered: number;
  /** The findings of the coverage gate: one for each cell of the horizons with no step. */
  readonly open: readonly CoverageFinding[];
}

/** This function applies the source gate, the step gate and the coverage gate to the content, at the date `at`. */
export function gateReport(at: string): GateReport {
  const cells = matrixOf().flat();
  const findings = [...checkSources(SOURCES, { at }), ...checkSteps(STEPS, SOURCES, { phases: PHASES, on: KEYS, gaps: GAPS, commercial: true }).findings];
  const open = checkCoverage(STEPS, { on: KEYS, phases: HORIZONS, gaps: GAPS }).findings;
  const horizonCells = KEYS.length * HORIZONS.length;
  return {
    checked: CHECKED,
    sources: SOURCES.length,
    steps: STEPS.length,
    gaps: GAPS.length,
    cells: cells.length,
    filled: cells.filter((cell) => stateOf(cell) !== "empty").length,
    findings,
    horizonCells,
    covered: horizonCells - open.length,
    open,
  };
}

export { CASES, CUTS, MORE_CASES, PHASES, PHASE_TITLES };
export type { Cell, Gap, Phase, Step };
