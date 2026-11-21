// The preparedness content of the guidebook: the sources, the steps and the marked gaps of 12 cases and 6 cuts,
// the topics of 12 areas, and the catalog of offline bundles.

export { CHECKED, SOURCES } from "./data/sources.ts";
export { CASE_STEPS, CUT_STEPS, STEPS } from "./data/steps.ts";
export { GAPS } from "./data/gaps.ts";
export { AREAS, TOPICS } from "./data/topics.ts";
export { BUNDLES, BUNDLES_CHECKED, BUNDLE_LEVELS } from "./data/bundles.ts";
export { MEDIA_UNITS, MEDIUM_GAPS, MEDIUM_LOSSES } from "./data/media.ts";

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

/** The cases past v1. Their steps have the same gates as the steps of `CASES`. */
export const MORE_CASES = ["cbrne.hazardous-materials", "cbrne.radiological"] as const;

/** The cuts of the content. A cut is a service that an event stops. These ids are a proposal until the stack model names them. */
export const CUTS = ["energy.grid", "water.main", "road.local", "telecom.network", "gas.main", "store.pharmacy"] as const;

/** The need codes that the steps protect. */
export const NEEDS = ["hydration.drink", "food.energy", "health.medicine", "power.electric"] as const;
