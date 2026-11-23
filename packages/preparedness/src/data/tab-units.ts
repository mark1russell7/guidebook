// The cited units of the tabs of the printed binder. Each unit id starts with "tab.", the id of its tab, and a dot.
// The text of each unit is in the words of the tab: a summary or a fact, not a quote.
// A unit keeps only the general rule of its source. The facts of a household stay out of this package.

import type { CitedUnit } from "@mark1russell7/guidebook";

/** The units of the tab go: when to go, what to take, the fuel, and a move with no car. */
const GO: readonly CitedUnit[] = [
  {
    id: "tab.go.when.fallout-fire",
    use: "summary",
    text: "When a fire, a gas leak or damage to the structure makes you go, and fallout is outside, do not wait outside. Go to the center or the basement of the building, away from the fire. If you cannot, go to the nearest building of brick or concrete.",
    source: "ready-radiation",
  },
  {
    id: "tab.go.when.chemical-outside",
    use: "summary",
    text: "When a chemical is outside, do not wait outside. Go inside the nearest building.",
    source: "ready-hazmat",
  },
  {
    id: "tab.go.when.hypothermia-care",
    use: "summary",
    text: "When a person has signs of hypothermia that the home cannot warm, take the person to care.",
    source: "cdc-winter-prevention",
  },
  {
    id: "tab.go.when.older-adults-cold",
    use: "fact",
    text: "Older adults can get hypothermia in a home at 60 to 65 °F.",
    source: "fema-winter-older",
  },
  {
    id: "tab.go.way-out.grab-bag",
    use: "summary",
    text: "A grab bag holds shoes, warm layers, a hat and gloves, a flashlight, spare batteries and a radio on batteries. It also holds food that needs no cooking, cash in small bills, a phone charger and a power bank.",
    source: "ready-kit",
  },
  {
    id: "tab.go.way-out.papers",
    use: "summary",
    text: "Put copies of the papers in a sealed bag in the grab bag: IDs, insurance cards and health insurance cards.",
    source: "ready-financial",
  },
  {
    id: "tab.go.way-out.car-water",
    use: "summary",
    text: "In the car, take water for the trip and for 3 days more.",
    source: "ready-water",
  },
  {
    id: "tab.go.way-out.car-treatment",
    use: "summary",
    text: "In the car, take a pot and fuel to boil cloudy water, and bleach and a dropper for clear water.",
    source: "epa-water-disinfect",
  },
  {
    id: "tab.go.way-out.calories",
    use: "fact",
    text: "For food, 2,000 calories for each person for each day is a general guide.",
    source: "fda-nutrition-label",
  },
  {
    id: "tab.go.fuel.can-place",
    use: "summary",
    text: "Keep an approved can of fuel in a building away from the house. Keep it more than 50 feet from a flame or a spark, and below 80 °F.",
    source: "auburn-gas-pump",
  },
  {
    id: "tab.go.fuel.can-fill",
    use: "fact",
    text: "Fill a can of fuel to approximately 95 percent.",
    source: "auburn-gas-pump",
  },
  {
    id: "tab.go.late-move.march",
    use: "fact",
    text: "Fit soldiers march 20 miles (32 km) in a day of 8 hours on roads.",
    source: "army-fm21-18",
  },
  {
    id: "tab.go.late-move.load",
    use: "fact",
    text: "The Army limits the load of a fit soldier on a long march to 72 pounds.",
    source: "army-fm21-18",
  },
  {
    id: "tab.go.late-move.bicycle",
    use: "fact",
    text: "By bicycle on roads, the speed is approximately 10 mph.",
    source: "fhwa-nonmotorized",
    locator: "Section 2.3",
  },
  {
    id: "tab.go.late-move.sealed-gasoline",
    use: "fact",
    text: "Gasoline in a sealed can stays good for 1 year or more with no stabilizer.",
    source: "fueleconomy-myths",
  },
  {
    id: "tab.go.late-move.stabilizer",
    use: "summary",
    text: "Add a stabilizer when you buy fuel to store for 4 to 6 months or more.",
    source: "auburn-gas-pump",
  },
];

/** The cited units of the tabs of the binder. The units of the other tabs come in later changes. */
export const TAB_UNITS: readonly CitedUnit[] = [...GO];
