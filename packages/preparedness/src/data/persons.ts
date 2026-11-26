// The groups of persons that each step protects, by the id of the step. Each group is in `PERSON_GROUPS` of `@mark1russell7/guidebook-plans`.
// A step gets a group only when its action names the persons of the group: infants and baby formula, children, older adults or pregnancy.
// A step that names a child under 2 gets the groups `infant` and `child`.

import type { PersonGroup } from "@mark1russell7/guidebook-plans";

/** The groups of persons that each step protects, by the `id` of the step. A test holds that each key is the id of a step. */
export const STEP_PERSONS: Readonly<Record<string, readonly PersonGroup[]>> = {
  "met.tropical.hurricane.warned.neighbors": ["older-adult"],
  "met.tropical.hurricane.P3.mold": ["child"],
  "met.heat.extreme.P1.check": ["older-adult"],
  "fire.structure.ready.children": ["child"],
  "fire.wildfire.P1.n95": ["infant", "child"],
  "infra.supply-chain.food.ready.household": ["infant"],
  "infra.supply-chain.food.P2.formula": ["infant"],
  "cbrne.nuclear-detonation.P2.pregnant-care": ["pregnant"],
  "security.armed-conflict.P3.children": ["child"],
  "water.main.P1.unsafe": ["infant"],
  "network.access.P5.teach-children": ["child"],
  "food.retail.P3.share-by-need": ["child"],
};
