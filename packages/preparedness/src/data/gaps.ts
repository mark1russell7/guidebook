// The marked gaps of the content: each key and phase that has no step on purpose, with the reason.

import type { Gap } from "@mark1russell7/guidebook-plans";

const OF_GRID = "This case is the power cut itself. The steps of the cut `energy.grid` apply.";
const OF_WATER = "This case is the water cut itself. The steps of the cut `water.main` apply.";
const NO_HOME_STEP = "The emergency team and the hospital give the care after the first minutes. The sources give no household step.";

const NO_LONG_STEP = "The sources give no step for a cut of this length. The steps of the earlier phases continue.";

/** The marked gaps of the cases and the cuts. */
export const GAPS: readonly Gap[] = [
  { on: "met.winter.storm", phase: "P3", why: "The source gives no step past the first days of the storm. The steps of the cuts apply." },
  { on: "met.heat.extreme", phase: "warned", why: "The source gives no separate step for a heat warning. The steps of P0 and P1 apply." },
  { on: "met.heat.extreme", phase: "P3", why: "The source gives no step past the first days of the heat. The steps of P2 continue." },
  { on: "met.tornado", phase: "P3", why: "The source gives no step past the cleanup. The steps of the cuts apply." },
  { on: "geo.earthquake", phase: "warned", why: "An earthquake alert comes only seconds before the shaking. Do the steps of P0 immediately." },
  { on: "fire.structure", phase: "warned", why: "A house fire gives no warning before the smoke alarm. The steps of P0 apply." },
  { on: "cbrne.hazardous-materials", phase: "P3", why: "The source gives no step past the decontamination and the medical check." },
  { on: "health.outbreak", phase: "P0", why: "An outbreak grows over days, not minutes. The steps of the warning continue." },
  { on: "health.outbreak", phase: "P1", why: "An outbreak grows over days, not hours. The steps of the warning continue." },
  { on: "infra.supply-chain.food", phase: "P0", why: "A food shortage grows over days, not minutes. The steps of the ready phase are the protection." },
  { on: "infra.supply-chain.food", phase: "P1", why: "A food shortage grows over days, not hours. The steps of the ready phase are the protection." },
  { on: "infra.power.grid-collapse", phase: "warned", why: OF_GRID },
  { on: "infra.power.grid-collapse", phase: "P0", why: OF_GRID },
  { on: "cyber.infrastructure-attack", phase: "warned", why: "A cyberattack comes with no public warning. The steps of the ready phase are the protection." },
  { on: "civic.economy.collapse", phase: "warned", why: "The sources give no separate step for a warning. The steps of the ready phase apply." },
  { on: "civic.economy.collapse", phase: "P0", why: "A financial collapse grows over days, not minutes. The steps of the ready phase are the protection." },
  { on: "civic.economy.collapse", phase: "P1", why: "A financial collapse grows over days, not hours. The steps of the ready phase are the protection." },
  { on: "security.civil-unrest", phase: "warned", why: "No official household page read gives a step for a warning of unrest." },
  { on: "security.civil-unrest", phase: "P3", why: "No official household page read gives a step for unrest that continues for weeks." },
  { on: "energy.grid", phase: "warned", why: "A power cut often comes with no warning. The warning steps of the case and of the network apply." },
  { on: "energy.grid", phase: "P4", why: NO_LONG_STEP },
  { on: "energy.grid", phase: "P5", why: NO_LONG_STEP },
  { on: "water.main", phase: "warned", why: "A break of a water main comes with no warning. The stored water of the ready phase is the protection." },
  { on: "water.main", phase: "P4", why: NO_LONG_STEP },
  { on: "water.main", phase: "P5", why: NO_LONG_STEP },
  { on: "road.local", phase: "P0", why: "A closed road does not change the first minutes at home. The steps of the case apply." },
  { on: "road.local", phase: "P4", why: NO_LONG_STEP },
  { on: "road.local", phase: "P5", why: NO_LONG_STEP },
  { on: "telecom.network", phase: "P0", why: "A cut of the network does not change the first minutes. The steps of the case apply." },
  { on: "telecom.network", phase: "P3", why: NO_LONG_STEP },
  { on: "telecom.network", phase: "P4", why: NO_LONG_STEP },
  { on: "telecom.network", phase: "P5", why: NO_LONG_STEP },
  { on: "gas.main", phase: "warned", why: "A gas leak gives no warning before you smell it or hear it." },
  { on: "gas.main", phase: "P3", why: NO_LONG_STEP },
  { on: "gas.main", phase: "P4", why: NO_LONG_STEP },
  { on: "gas.main", phase: "P5", why: NO_LONG_STEP },
  { on: "store.pharmacy", phase: "P0", why: "A closed pharmacy does not change the first minutes. The steps of the case apply." },
  { on: "store.pharmacy", phase: "P1", why: "A closed pharmacy does not change the first hours. The medicines of the ready phase are the protection." },
  { on: "store.pharmacy", phase: "P5", why: NO_LONG_STEP },
  { on: "infra.power.outage", phase: "ready", why: OF_GRID },
  { on: "infra.power.outage", phase: "warned", why: OF_GRID },
  { on: "infra.power.outage", phase: "P0", why: OF_GRID },
  { on: "infra.power.outage", phase: "P1", why: OF_GRID },
  { on: "infra.power.outage", phase: "P2", why: OF_GRID },
  { on: "infra.power.outage", phase: "P3", why: OF_GRID },
  { on: "infra.water.outage", phase: "ready", why: OF_WATER },
  { on: "infra.water.outage", phase: "warned", why: OF_WATER },
  { on: "infra.water.outage", phase: "P0", why: OF_WATER },
  { on: "infra.water.outage", phase: "P1", why: OF_WATER },
  { on: "infra.water.outage", phase: "P2", why: OF_WATER },
  { on: "infra.water.outage", phase: "P3", why: OF_WATER },
  { on: "health.medical-emergency", phase: "warned", why: "A medical emergency comes with no warning. The steps of P0 apply." },
  { on: "health.medical-emergency", phase: "P1", why: NO_HOME_STEP },
  { on: "health.medical-emergency", phase: "P2", why: NO_HOME_STEP },
  { on: "health.medical-emergency", phase: "P3", why: NO_HOME_STEP },
];
