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

/** The units of the tab first-72h: the signs of a danger to a life, the first day, and the hold to hour 72. */
const FIRST_72H: readonly CitedUnit[] = [
  {
    id: "tab.first-72h.first-hour.co-sleep",
    use: "fact",
    text: "A person who sleeps can die from carbon monoxide poisoning before any sign.",
    source: "cdc-co",
  },
  {
    id: "tab.first-72h.first-hour.choke-adult",
    use: "summary",
    text: "When an adult chokes and cannot speak or breathe, give 5 blows between the shoulder blades. Then give 5 thrusts with the fist just above the navel. Repeat until the object comes out.",
    source: "mlp-choking-adult",
  },
  {
    id: "tab.first-72h.first-hour.choke-pregnant",
    use: "summary",
    text: "For a pregnant or large person who chokes, give the thrusts on the middle of the breastbone.",
    source: "mlp-choking-adult",
  },
  {
    id: "tab.first-72h.first-hour.choke-baby-back",
    use: "summary",
    text: "When a baby younger than 1 year chokes, lay the baby face down on your forearm, with the head low. Give up to 5 blows between the shoulder blades.",
    source: "mlp-choking-infant",
  },
  {
    id: "tab.first-72h.first-hour.choke-baby-chest",
    use: "summary",
    text: "Then turn the baby face up. Give up to 5 thrusts on the middle of the breastbone with the heel of one hand. Repeat the blows and the thrusts until the object comes out.",
    source: "mlp-choking-infant",
  },
  {
    id: "tab.first-72h.first-hour.seizure",
    use: "summary",
    text: "At a seizure, move away the objects that can cause an injury. Turn the person on the side. Put nothing in the mouth. Call 9-1-1 when the seizure continues for more than 5 minutes.",
    source: "cdc-seizure",
  },
  {
    id: "tab.first-72h.first-hour.text-911",
    use: "summary",
    text: "A voice call to 9-1-1 is the first choice. A text to 9-1-1 is an alternative when the network coverage is limited. In the US, where 9-1-1 takes no text, the phone gets a message back.",
    source: "wikipedia-en",
    locator: "Emergency text messaging services, sections Description and United States (revision 1369849589)",
  },
  {
    id: "tab.first-72h.first-hour.cpr",
    use: "summary",
    text: "When an adult does not respond and does not breathe, or only gasps, push on the center of the chest. Push at least 2 inches deep, 100 to 120 times each minute. Give 30 pushes, then 2 breaths, and continue.",
    source: "redcross-cpr",
  },
  {
    id: "tab.first-72h.first-hour.poison-help",
    use: "fact",
    text: "For a poison, call Poison Help at 1-800-222-1222. The call is free, at all hours.",
    source: "hrsa-poison-help",
  },
  {
    id: "tab.first-72h.first-hour.smoke-door-cool",
    use: "summary",
    text: "When there is smoke in an apartment building, touch the door of the home first. When the door is cool, open it slowly. Stay low, and go out by the stairs.",
    source: "usfa-apartment",
  },
  {
    id: "tab.first-72h.window.generator",
    use: "summary",
    text: "Do not use a generator in the home, the garage or a carport. Keep it outside, at least 20 feet from doors, windows and vents.",
    source: "cdc-co-psa",
  },
  {
    id: "tab.first-72h.hold.hypothermia-signs",
    use: "fact",
    text: "Shivering, confusion or slurred speech can be signs of hypothermia.",
    source: "ready-winter",
    locator: "Hypothermia",
  },
];

/** The cited units of the tabs of the binder. The units of the other tabs come in later changes. */
export const TAB_UNITS: readonly CitedUnit[] = [...GO, ...FIRST_72H];
