// The share of the harm of each cause that a step averts, by the id of the step. Each share is a fact of its source, with its interval.
// A step gets a share only when a source gives a count for it. A step with no read gets no share, not a guess.

import type { Averted } from "@mark1russell7/guidebook-plans";

/** The averted shares of each step, by the `id` of the step. A test holds that each key is the id of a step. */
export const STEP_AVERTS: Readonly<Record<string, readonly Averted[]>> = {
  // New Mexico, 1980 to 1995: 136 deaths from unintentional CO poisoning that a fire did not cause, with no detector in use.
  // An alarm with a sound can avert the deaths with no alcohol in the blood (78 of 136). Each detector can avert the deaths of persons with no alcohol that were awake (51 of 136).
  // The authors give approximately half. The interval is 51 to 78 of 136.
  "power.grid.ready.co-alarms": [{ cause: "co-poisoning", value: 0.5, low: 0.375, high: 0.574, source: "yoon-co-detectors" }],
};
