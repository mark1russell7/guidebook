// The preparedness content of the guidebook: the sources, the steps and the marked gaps of 12 cases and 12 cuts,
// the topics of 12 areas, and the catalog of offline bundles.

import { GRAPH_SCHEMA, SOCIETY_STATES } from "@mark1russell7/guidebook-plans";
import type { HazardRow, MasterGraph, Tab } from "@mark1russell7/guidebook-plans";
import { CATALOG_TAB, MASTER, START_TAB, tabsOf } from "./data/chart.ts";
import { hazardsOf } from "./data/hazards.ts";
import { CASE_STEPS } from "./data/steps.ts";
export { CHECKED, SOURCES } from "./data/sources.ts";
export { CASE_STEPS, CUT_STEPS, STEPS } from "./data/steps.ts";
export { GAPS } from "./data/gaps.ts";
export { OPEN_CELLS } from "./data/coverage.ts";
export { RULES } from "./data/rules.ts";
export { CATALOG_TAB, MASTER, START_TAB } from "./data/chart.ts";
export { AREAS, TOPICS } from "./data/topics.ts";
export { BUNDLES, BUNDLES_CHECKED, BUNDLE_LEVELS } from "./data/bundles.ts";
export { MEDIA_UNITS, MEDIUM_GAPS, MEDIUM_LIVES, MEDIUM_LOSSES } from "./data/media.ts";

/**
 * The 12 cases of v1. A case is a kind of event. The codes come from the event taxonomy of the alerts project.
 * The code `health.medical-emergency` is new in that taxonomy.
 */
export const CASES = [
  "met.winter.storm",
  "met.tropical.hurricane",
  "met.flood",
  "met.heat.extreme",
  "met.tornado",
  "geo.earthquake",
  "fire.wildfire",
  "fire.structure",
  "infra.power.outage",
  "infra.water.outage",
  "health.outbreak",
  "health.medical-emergency",
] as const;

/**
 * The cases past v1. Their steps have the same gates as the steps of `CASES`.
 * The code `civic.ai-collapse` is new. The hazard catalog of `stack-hazards` gives its cuts.
 */
export const MORE_CASES = ["cbrne.hazardous-materials", "cbrne.radiological", "civic.ai-collapse", "health.outbreak.pandemic", "infra.supply-chain.food", "infra.power.grid-collapse", "cyber.infrastructure-attack", "civic.economy.collapse", "security.civil-unrest", "cbrne.nuclear-detonation", "security.nuclear-war", "cbrne.emp", "geo.space-weather.geomagnetic-storm", "security.armed-conflict"] as const;

/** The cuts of the content. A cut is a service that an event stops. The ids are the ids of `SUPPLY_PARTS` in `stack-hazards`. */
export const CUTS = ["power.grid", "water.main", "road.local", "phone.network", "network.access", "gas.main", "care.local", "sewer.main", "fuel.retail", "food.retail", "cash.retail", "home.dwelling"] as const;

/** The need codes that the steps protect. */
export const NEEDS = ["hydration.drink", "food.energy", "health.medicine", "power.electric"] as const;

/** The tabs of the printed plan, in the sequence of the binder. The master chart sends the reader to them. */
/** The key of the cut of all the services of society: help, shops, care and the law. Its steps are for a society with no service. */
export const SOCIETY_KEY = "society.services";

export const TABS: readonly Tab[] = tabsOf([...CASES, ...MORE_CASES], [...CUTS, SOCIETY_KEY]);

/** The rows of the hazard catalog: for each case, its signals, its entry node and its card. */
export const HAZARDS: readonly HazardRow[] = hazardsOf(CASE_STEPS);

/** The master graph: the one value that the printed binder and the app read. */
export const GRAPH: MasterGraph = {
  schema: GRAPH_SCHEMA,
  start: START_TAB,
  catalog: CATALOG_TAB,
  societies: SOCIETY_STATES,
  nodes: MASTER,
  tabs: TABS,
  hazards: HAZARDS,
  index: [
    { title: "Carbon monoxide", tab: "first-72h", about: "the steps at a carbon monoxide alarm or its signs" },
    { title: "A death in the household", tab: "health", about: "the record of the death, gloves, and the place and depth of a grave" },
    { title: "Pregnancy and birth", tab: "health", about: "the danger signs, contraception, and a course for a birth with no doctor" },
  ],
};
