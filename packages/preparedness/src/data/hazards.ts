// The hazard catalog: one row for each case. A row is an index into the master graph, not a plan.
// It names the signals that the hazard gives, the node where the reader joins the graph, and the card of the facts unique to it.

import type { HazardRow, Phase, Step } from "@mark1russell7/guidebook-plans";

/** The node where each signal joins the graph. */
const ENTRY: Readonly<Record<string, string>> = { sense: "life", threat: "place", supply: "society" };

/** Each case: its title and its signals. The first signal gives the entry. */
const TABLE: readonly (readonly [key: string, title: string, signals: readonly string[]])[] = [
  ["met.winter.storm", "Winter storm", ["threat", "supply"]],
  ["met.tropical.hurricane", "Hurricane", ["threat", "sense"]],
  ["met.flood", "Flood", ["sense", "threat"]],
  ["met.heat.extreme", "Extreme heat", ["threat", "supply"]],
  ["met.tornado", "Tornado", ["sense", "threat"]],
  ["geo.earthquake", "Earthquake", ["sense"]],
  ["fire.wildfire", "Wildfire", ["sense", "threat"]],
  ["fire.structure", "Fire in a building", ["sense"]],
  ["infra.power.outage", "Power outage", ["supply"]],
  ["infra.water.outage", "Water outage", ["supply"]],
  ["health.outbreak", "Outbreak of a disease", ["threat"]],
  ["health.medical-emergency", "Medical emergency", ["sense"]],
  ["cbrne.hazardous-materials", "Release of hazardous materials", ["sense", "threat"]],
  ["cbrne.radiological", "Release of radioactive material", ["sense", "threat"]],
  ["civic.ai-collapse", "Collapse driven by AI", ["supply", "threat"]],
  ["health.outbreak.pandemic", "Pandemic", ["threat", "supply"]],
  ["infra.supply-chain.food", "Failure of the food supply", ["supply"]],
  ["infra.power.grid-collapse", "Long collapse of the grid", ["supply"]],
  ["cyber.infrastructure-attack", "Cyberattack on infrastructure", ["supply"]],
  ["civic.economy.collapse", "Financial collapse", ["supply"]],
  ["security.civil-unrest", "Civil unrest", ["sense", "threat"]],
  ["cbrne.nuclear-detonation", "Nuclear detonation", ["sense"]],
  ["security.nuclear-war", "Nuclear war", ["threat", "sense"]],
  ["cbrne.emp", "Electromagnetic pulse", ["supply"]],
  ["geo.space-weather.geomagnetic-storm", "Geomagnetic storm", ["threat", "supply"]],
  ["security.armed-conflict", "Armed conflict", ["threat", "sense"]],
];

/** The phases of the first actions of a card, in the sequence of their use. */
const FIRST: readonly Phase[] = ["P0", "P1", "P2"];

/**
 * This function gives the rows of the hazard catalog.
 * A card holds the steps of the case with a text that no other case has.
 * These are the first actions, and the steps for a society with no service.
 */
export function hazardsOf(steps: readonly Step[]): readonly HazardRow[] {
  const cases = new Map<string, Set<string>>();
  for (const step of steps) cases.set(step.do, (cases.get(step.do) ?? new Set()).add(step.on));
  const unique = (step: Step): boolean => (cases.get(step.do)?.size ?? 0) === 1;
  return TABLE.map(([key, title, signals]) => {
    const own = steps.filter((step) => step.on === key && unique(step));
    const first = FIRST.find((phase) => own.some((step) => step.phase === phase));
    const card = own.filter((step) => step.phase === first || (step.society?.includes("none") === true && !step.society.includes("works")));
    return { key, title, signals, entry: ENTRY[signals[0] ?? ""] ?? "", card: card.map((step) => step.id) };
  });
}
