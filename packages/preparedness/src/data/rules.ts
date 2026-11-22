// The trigger rules of the decision chart. Each rule cites the pages that tell its trigger and its action.
// The places of a household are input data, so the rule of the kind `place` names no place.

import type { Rule } from "@mark1russell7/guidebook-plans";

const NOW = ["P0"] as const;
const FIRST_DAYS = ["P0", "P1", "P2", "P3"] as const;

/** The trigger rules of the decision chart, by kind and rank. */
export const RULES: readonly Rule[] = [
  // Where am I?
  { id: "place.where", kind: "place", rank: 1, on: [], sources: ["ready-shelter", "uk-ready"], when: "You can be at home, at work or at another place of your plan.", then: "Use the plan of the place where you are: its contacts, its shelter room and its meeting place." },

  // Is there an immediate danger? Each rule goes to the first steps of a case.
  { id: "reflex.fire", kind: "reflex", rank: 1, on: ["fire.structure"], target: { on: "fire.structure", phases: NOW }, sources: ["ready-fire"], when: "There is smoke or fire in the building.", then: "Get out, stay out and call 911." },
  { id: "reflex.gas", kind: "reflex", rank: 2, on: ["gas.main"], target: { on: "gas.main", phases: NOW }, sources: ["ready-safety"], when: "You smell gas or hear a hiss.", then: "Open a window, and get all persons out quickly." },
  { id: "reflex.medical", kind: "reflex", rank: 3, on: ["health.medical-emergency"], target: { on: "health.medical-emergency", phases: NOW }, sources: ["cdc-heart", "cdc-stroke"], when: "A person has the signs of a heart attack or a stroke.", then: "Call 911 immediately." },
  { id: "reflex.attack", kind: "reflex", rank: 4, on: ["civic.ai-collapse"], target: { on: "civic.ai-collapse", phases: NOW }, sources: ["fi-72h-shelter"], when: "Officials warn of a drone threat or an attack, or a general warning sounds.", then: "Go into the nearest building, and obey the instructions of the officials." },
  { id: "reflex.radiation", kind: "reflex", rank: 5, on: ["cbrne.radiological"], target: { on: "cbrne.radiological", phases: ["warned", "P0"] }, sources: ["ready-radiation"], when: "Officials warn of a radiation emergency or a nuclear detonation.", then: "Get inside, stay inside and stay tuned." },
  { id: "reflex.flash", kind: "reflex", rank: 5, on: ["cbrne.nuclear-detonation"], target: { on: "cbrne.nuclear-detonation", phases: NOW }, sources: ["fema-nd-guide", "ready-radiation"], when: "You see a sudden, very bright flash of light.", then: "Take cover at once, away from windows. If you are outside, lie face down." },
  { id: "reflex.air-raid", kind: "reflex", rank: 5, on: ["security.nuclear-war"], target: { on: "security.nuclear-war", phases: ["warned", "P0"] }, sources: ["se-brochure-en"], when: "An air raid warning sounds.", then: "Take cover at once in the nearest shelter, cellar or room without windows." },
  { id: "reflex.chemical", kind: "reflex", rank: 6, on: ["cbrne.hazardous-materials"], target: { on: "cbrne.hazardous-materials", phases: NOW }, sources: ["ready-hazmat"], when: "Officials warn of a chemical release near you.", then: "Obey the officials: shelter in place, or leave." },
  { id: "reflex.tornado", kind: "reflex", rank: 7, on: ["met.tornado"], target: { on: "met.tornado", phases: ["warned", "P0"] }, sources: ["ready-tornadoes"], when: "A tornado warning comes.", then: "Go to your safe shelter immediately, away from windows, doors and outside walls." },
  { id: "reflex.earthquake", kind: "reflex", rank: 8, on: ["geo.earthquake"], target: { on: "geo.earthquake", phases: NOW }, sources: ["ready-earthquakes"], when: "The ground shakes.", then: "Drop to your hands and knees, cover your head and neck, and hold on." },
  { id: "reflex.flood", kind: "reflex", rank: 9, on: ["met.flood"], target: { on: "met.flood", phases: NOW }, sources: ["ready-floods"], when: "Flood water rises near you.", then: "Go to a safe shelter. Do not walk, swim or drive through flood water." },
  { id: "reflex.wildfire", kind: "reflex", rank: 10, on: ["fire.wildfire"], target: { on: "fire.wildfire", phases: NOW }, sources: ["ready-wildfires"], when: "Officials tell of a wildfire near you.", then: "Obey the evacuation orders immediately." },
  { id: "reflex.call", kind: "reflex", rank: 11, on: ["civic.ai-collapse"], target: { on: "civic.ai-collapse", phases: NOW }, sources: ["ftc-voice", "ic3-genai"], when: "A call or a message from family asks for money now.", then: "Hang up. Call the person back at a number that you know." },

  // What is cut? Each rule goes to the module of a cut.
  { id: "module.power", kind: "module", rank: 1, on: ["energy.grid"], target: { on: "energy.grid", phases: FIRST_DAYS }, sources: ["ready-power"], when: "There is no power from the grid.", then: "Use the module: no power from the grid." },
  { id: "module.water", kind: "module", rank: 2, on: ["water.main"], target: { on: "water.main", phases: FIRST_DAYS }, sources: ["ready-water"], when: "There is no safe water from the main.", then: "Use the module: no water from the main." },
  { id: "module.phone", kind: "module", rank: 3, on: ["telecom.network"], target: { on: "telecom.network", phases: FIRST_DAYS }, sources: ["ready-alerts"], when: "The phone or the internet does not operate.", then: "Use the module: no phone or internet." },
  { id: "module.gas", kind: "module", rank: 4, on: ["gas.main"], target: { on: "gas.main", phases: FIRST_DAYS }, sources: ["ready-safety"], when: "There is no gas from the main.", then: "Use the module: no gas from the main." },
  { id: "module.roads", kind: "module", rank: 5, on: ["road.local"], target: { on: "road.local", phases: FIRST_DAYS }, sources: ["ready-evacuation"], when: "The local roads are closed.", then: "Use the module: closed local roads." },
  { id: "module.pharmacy", kind: "module", rank: 6, on: ["store.pharmacy"], target: { on: "store.pharmacy", phases: ["ready", "warned", "P2", "P3"] }, sources: ["fda-drugs"], when: "The pharmacy is closed.", then: "Use the module: closed pharmacy." },
  { id: "module.food", kind: "module", rank: 7, on: ["infra.supply-chain.food"], target: { on: "infra.supply-chain.food", phases: FIRST_DAYS }, sources: ["ready-food", "ready-power"], when: "The shops have no food.", then: "Use your stored food, and the plan of a food supply failure." },
  { id: "module.money", kind: "module", rank: 8, on: ["civic.economy.collapse"], target: { on: "civic.economy.collapse", phases: FIRST_DAYS }, sources: ["ready-financial", "dol-ui"], when: "Cards, banks or your income stop.", then: "Use your cash, and the plan of a financial collapse." },

  // When do I stay?
  { id: "stay.order", kind: "stay", rank: 1, on: [], target: { on: "cbrne.radiological", phases: ["warned", "P0"] }, sources: ["ready-shelter", "uk-hazards"], when: "Officials tell you to shelter in place, or to go in, stay in and tune in.", then: "Stay inside. Close the doors, the windows and the vents, and listen to the radio." },
  { id: "stay.air", kind: "stay", rank: 2, on: [], target: { on: "cbrne.hazardous-materials", phases: ["P1"] }, sources: ["ready-shelter"], when: "The air outside has much debris, or officials say that it is badly contaminated.", then: "Go to an inner room with few windows, and seal it." },
  { id: "stay.safe", kind: "stay", rank: 3, on: [], target: { on: "energy.grid", phases: FIRST_DAYS }, sources: ["uk-hazards", "ready-shelter"], when: "The officials give no order to leave, and the building has no obvious risk.", then: "Stay where you are, and use your supplies." },

  // When do I go?
  { id: "go.order", kind: "go", rank: 1, on: [], target: { on: "met.tropical.hurricane", phases: NOW }, sources: ["uk-hazards", "ready-evacuation"], when: "Officials tell you to leave.", then: "Leave immediately. A delay can put your life at risk." },
  { id: "go.risk", kind: "go", rank: 2, on: [], target: { on: "fire.structure", phases: NOW }, sources: ["uk-hazards"], when: "The building has an obvious risk: fire, gas or damage.", then: "Get out, and go to a safe place." },
  { id: "go.early", kind: "go", rank: 3, on: [], target: { on: "met.tropical.hurricane", phases: ["warned"] }, sources: ["ready-evacuation"], when: "A storm comes, and an evacuation seems likely.", then: "Leave early, so that the weather does not trap you." },

  // When do I go to a fallback place?
  { id: "fallback.heat-cold", kind: "fallback", rank: 1, on: ["energy.grid"], target: { on: "energy.grid", phases: ["P2"] }, sources: ["ready-power"], when: "There is no power, and the heat or the cold is extreme.", then: "Go to a community place with power. Ask the officials which places are open." },
  { id: "fallback.home", kind: "fallback", rank: 2, on: [], target: { on: "met.tropical.hurricane", phases: ["ready"] }, sources: ["ready-evacuation", "ready-shelter"], when: "You cannot stay at home or go back to it.", then: "Go to a fallback place of your plan. To find an open shelter, text SHELTER and your ZIP code to 43362." },

  // When do I change to the long plan?
  { id: "long.fridge", kind: "long-plan", rank: 1, on: ["energy.grid", "food.energy"], target: { on: "energy.grid", phases: ["P2"] }, sources: ["ready-power", "ready-food"], when: "The power is off for more than 4 hours.", then: "Use the steps of P2. Discard food that was above 40 °F for 2 hours." },
  { id: "long.medicine", kind: "long-plan", rank: 2, on: ["energy.grid", "health.medicine"], target: { on: "energy.grid", phases: ["P2", "P3"] }, sources: ["ready-power"], when: "The power is off for more than 1 day, and a medicine needs a refrigerator.", then: "Speak to your doctor or pharmacist immediately to get a new supply." },
  { id: "long.days", kind: "long-plan", rank: 3, on: [], target: { on: "energy.grid", phases: ["P3"] }, sources: ["uk-ready"], when: "A cut continues past 3 days.", then: "Use the steps of P3 of each cut, and of the case." },
  { id: "long.income", kind: "long-plan", rank: 4, on: ["civic.economy.collapse"], target: { on: "civic.economy.collapse", phases: ["P2", "P3"] }, sources: ["dol-ui"], when: "You lose your job or your income.", then: "File an unemployment claim immediately, and use the plan of a financial collapse." },
  { id: "long.pandemic", kind: "long-plan", rank: 5, on: ["health.outbreak.pandemic"], target: { on: "health.outbreak.pandemic", phases: ["warned", "P1", "P2"] }, sources: ["ready-pandemic"], when: "Officials say that a pandemic spreads in your community.", then: "Stay at home as much as possible, and use the plan of a pandemic." },
];
