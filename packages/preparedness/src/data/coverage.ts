// The open cells of the coverage gate: each key and horizon from 5 minutes to 5 years that has no step yet.
// The coverage gate fails each of them. A test holds this list, so it can only get shorter.

/**
 * The cells with no step, as `<key>/<phase>`, in the sequence of the matrix.
 * Each cell is open until a cited step fills it. The items G8, G9 and G10 of the roadmap fill them.
 */
export const OPEN_CELLS: readonly string[] = [
  "met.winter.storm/P3",
  "met.heat.extreme/P3",
  "met.tornado/P3",
  "infra.power.outage/P0",
  "infra.power.outage/P1",
  "infra.power.outage/P2",
  "infra.power.outage/P3",
  "infra.water.outage/P0",
  "infra.water.outage/P1",
  "infra.water.outage/P2",
  "infra.water.outage/P3",
  "health.outbreak/P0",
  "health.outbreak/P1",
  "health.medical-emergency/P1",
  "health.medical-emergency/P2",
  "health.medical-emergency/P3",
  "cbrne.hazardous-materials/P3",
  "infra.supply-chain.food/P0",
  "infra.supply-chain.food/P1",
  "infra.power.grid-collapse/P0",
  "civic.economy.collapse/P0",
  "civic.economy.collapse/P1",
  "cbrne.emp/P2",
  "cbrne.emp/P3",
  "geo.space-weather.geomagnetic-storm/P0",
  "road.local/P0",
  "phone.network/P0",
  "network.access/P0",
  "network.access/P2",
  "care.local/P0",
  "care.local/P1",
  "sewer.main/P0",
  "fuel.retail/P0",
  "food.retail/P0",
  "cash.retail/P0",
];
