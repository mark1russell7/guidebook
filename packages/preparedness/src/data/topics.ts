// The topics of the preparedness content: 40 topics in 12 areas, as a graph of prerequisites.
// Each topic names the bundles that hold it, and its cited units: the units whose id starts with the topic id and a dot.

import type { Topic } from "@mark1russell7/guidebook-topics";
import { TOPIC_UNITS } from "./units.ts";

/** The areas of the topics. */
export const AREAS = [
  "water",
  "food",
  "farming",
  "medicine",
  "sanitation",
  "shelter",
  "energy",
  "electronics",
  "metals",
  "tools",
  "chemistry",
  "communication",
] as const;

type Area = (typeof AREAS)[number];

/** The bundles of the topics of each area, after the two Wikipedia bundles that each topic has. */
const AREA_BUNDLES: Readonly<Record<Area, readonly string[]>> = {
  water: ["appropedia", "stackexchange-outdoors", "stackexchange-sustainability"],
  food: ["appropedia", "stackexchange-cooking"],
  farming: ["appropedia", "stackexchange-gardening"],
  medicine: ["wikipedia-medicine", "stackexchange-medicalsciences"],
  sanitation: ["appropedia", "stackexchange-diy"],
  shelter: ["appropedia", "stackexchange-diy", "stackexchange-outdoors"],
  energy: ["energypedia", "appropedia", "stackexchange-sustainability"],
  electronics: ["stackexchange-electronics"],
  metals: [],
  tools: ["stackexchange-diy", "stackexchange-woodworking"],
  chemistry: ["stackexchange-chemistry"],
  communication: ["stackexchange-ham"],
};

/** The need code that the topics of each area help to keep. */
const AREA_SERVES: Readonly<Partial<Record<Area, string>>> = {
  water: "hydration.drink",
  food: "food.energy",
  medicine: "health.medicine",
};

const topic = (id: string, title: string, requires: readonly string[] = [], extra: { readonly bundles?: readonly string[]; readonly serves?: readonly string[] } = {}): Topic => {
  const area = id.split(".")[0] as Area;
  const serve = AREA_SERVES[area];
  return {
    id,
    title,
    area,
    requires,
    units: TOPIC_UNITS.filter((unit) => unit.id.startsWith(`${id}.`)).map((unit) => unit.id),
    bundles: ["wikipedia-mini", "wikipedia-all", ...AREA_BUNDLES[area], ...(extra.bundles ?? [])],
    serves: extra.serves ?? (serve === undefined ? [] : [serve]),
  };
};

const POWER = { serves: ["power.electric"] } as const;

/** The topics of the content. `printOrder` of the topics add-on gives the sequence of the book. */
export const TOPICS: readonly Topic[] = [
  topic("water.sources", "Where to find water"),
  topic("water.boil", "Boil water to make it safe", ["energy.fire"]),
  topic("water.disinfect", "Disinfect water with chlorine", ["chemistry.measure"]),
  topic("water.filter", "Filter water", ["water.sources"]),
  topic("water.store", "Store water", ["water.disinfect"]),
  topic("food.store", "Store food"),
  topic("food.cook.offgrid", "Cook with no grid power", ["energy.fire"], { bundles: ["energypedia"] }),
  topic("food.preserve.dry", "Dry food", ["food.store"]),
  topic("food.preserve.can", "Can food at home", ["food.store", "food.cook.offgrid", "chemistry.measure"]),
  topic("farming.soil", "Make good soil"),
  topic("farming.garden", "Grow a kitchen garden", ["farming.soil"]),
  topic("farming.seed", "Save seeds", ["farming.garden"]),
  topic("medicine.first-aid", "First aid"),
  topic("medicine.wounds", "Clean and close a wound", ["medicine.first-aid", "sanitation.hygiene"]),
  topic("medicine.dehydration", "Treat dehydration", ["medicine.first-aid", "water.boil"]),
  topic("medicine.medicines", "Essential medicines", ["medicine.first-aid"]),
  topic("medicine.childbirth", "Help at a childbirth", ["medicine.first-aid", "sanitation.hygiene"]),
  topic("sanitation.hygiene", "Wash hands and keep clean"),
  topic("sanitation.toilet", "Make a toilet", ["sanitation.hygiene", "tools.hand"]),
  topic("sanitation.waste", "Manage waste and pests", ["sanitation.toilet"]),
  topic("shelter.warmth", "Keep warm"),
  topic("shelter.repair", "Repair a roof and a wall", ["tools.hand"]),
  topic("shelter.build.basic", "Build a basic shelter", ["tools.hand", "tools.rope"]),
  topic("energy.fire", "Make and control a fire"),
  topic("energy.electric.basic", "Electric power: volts, amps and watts", [], POWER),
  topic("energy.battery", "Use and charge a battery", ["energy.electric.basic"], POWER),
  topic("energy.solar", "Solar power", ["energy.battery"], POWER),
  topic("energy.generator", "Use a generator safely", ["energy.electric.basic"], POWER),
  topic("electronics.basic", "Electronic components", ["energy.electric.basic"]),
  topic("electronics.solder", "Solder", ["electronics.basic", "tools.hand"]),
  topic("electronics.radio", "Build a simple radio", ["electronics.solder"]),
  topic("metals.forge", "Forge metal", ["energy.fire", "tools.hand"]),
  topic("metals.sharpen", "Sharpen and harden a blade", ["metals.forge"]),
  topic("tools.hand", "Hand tools"),
  topic("tools.rope", "Knots and rope"),
  topic("chemistry.measure", "Measure and dilute"),
  topic("chemistry.soap", "Make soap", ["chemistry.measure", "energy.fire"]),
  topic("communication.radio.receive", "Receive weather and emergency radio"),
  topic("communication.radio.amateur", "Amateur radio", ["electronics.basic"]),
  topic("communication.signals", "Signal for help"),
];
