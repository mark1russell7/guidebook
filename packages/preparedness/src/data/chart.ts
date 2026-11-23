// The master chart: one chart for any disaster. A reader starts at a signal, answers at most 3 questions and goes to a tab.
// A goto with a card also sends the reader to the card of the event in the hazard catalog.
// The chart asks for needs, not for kinds of event, so an event that nobody foresaw still has a route.
// A broadcast is one source of information. No answer of the chart waits for officials.

import type { ChartNode, Phase, Tab } from "@mark1russell7/guidebook-plans";

const ALL: readonly Phase[] = ["ready", "warned", "P0", "P1", "P2", "P3", "P4", "P5"];

/**
 * The tabs of the printed plan, in the sequence of the binder. Each tab is for one need or one subject.
 * Each state of society is a section in each tab. The page budgets come from the print.
 * The long-term tab has the steps of the cuts by need, not the steps of each case.
 */
export function tabsOf(cases: readonly string[], cuts: readonly string[]): readonly Tab[] {
  return [
    { id: "start", title: "Start: the master chart", keys: [], phases: [], pages: 4 },
    { id: "first-72h", title: "The first 72 hours", keys: [...cases, "gas.main"], phases: ["warned", "P0", "P1", "P2"], pages: 4 },
    { id: "stay", title: "Stay: the home and the building", keys: ["home.dwelling"], phases: ALL, pages: 8 },
    { id: "go", title: "Go: the routes and the other places", keys: ["road.local"], phases: ALL, pages: 4 },
    { id: "water", title: "Water and sanitation", keys: ["water.main", "sewer.main", "hydration.drink"], phases: ALL, pages: 6 },
    { id: "heat", title: "Heat, shelter and power", keys: ["power.grid", "gas.main", "fuel.retail", "power.electric"], phases: ALL, pages: 6 },
    { id: "health", title: "Health and medicine", keys: ["care.local", "health.medicine", "health.medical-emergency"], phases: ALL, pages: 8 },
    { id: "food", title: "Food", keys: ["food.retail", "food.energy"], phases: ALL, pages: 6 },
    { id: "security", title: "The safety of the people", keys: ["security.civil-unrest", "security.armed-conflict"], phases: ALL, pages: 6 },
    { id: "group", title: "Contact, the group and trade", keys: ["phone.network", "network.access", "cash.retail", "society.services"], phases: ALL, pages: 6 },
    { id: "long-term", title: "The long term: 5 weeks to 5 years", keys: cuts, phases: ["P3", "P4", "P5"], pages: 10 },
    { id: "catalog", title: "The hazard catalog", keys: cases, phases: ALL, pages: 15 },
    { id: "appendices", title: "The appendices", keys: [], phases: [], pages: 40 },
  ];
}

/** The tab of the chart itself. It is the entry of the binder, so no path of the chart goes to it. */
export const START_TAB = "start";

/** The tab of the hazard catalog. An end with a card sends the reader to the card of the event in it. */
export const CATALOG_TAB = "catalog";

const NEEDS_FIRST = "Do the needs by their danger. Safety comes in minutes, heat and water in hours and days, food in weeks.";

/**
 * The nodes of the master chart: 4 signals, 5 questions and 13 ends.
 * The ends of the first questions lead on, so each walk also reaches the question of society and the needs.
 */
export const MASTER: readonly ChartNode[] = [
  // The signals: what a reader sees, hears, smells, feels or learns.
  { id: "sense", kind: "signal", text: "You see, hear, smell or feel a danger: fire, smoke, gas, shaking, a flash, rising water, a siren or shots.", next: "life" },
  { id: "threat", kind: "signal", text: "You learn of a threat that comes: a storm, a flood, a fire, a disease, unrest, an attack or a war.", next: "to-window" },
  { id: "supply", kind: "signal", text: "A supply stops, or help does not come: power, water, sewer, gas, phone, internet, fuel, food, cash, care or the law.", next: "society" },
  { id: "missing", kind: "signal", text: "A person of the household is missing, or does not come back at the agreed time.", next: "society" },

  // The questions. Each one has an answer that a reader can see without help.
  {
    id: "life", kind: "question", text: "Can the danger hurt you in the next minutes? A siren with no known cause counts as Yes.", sources: [],
    reasoning: "A danger of minutes leaves no time to read. Do the reflex first, then continue with the chart.",
    answers: [{ label: "Yes", next: "to-72h" }, { label: "No", next: "inside" }],
  },
  {
    id: "inside", kind: "question", text: "Is the danger inside the place where you are: fire, gas, flood water or damage to the building?", sources: [],
    reasoning: "Your place holds your supplies, so leave it only when the place itself is the danger.",
    answers: [{ label: "Yes", next: "to-go" }, { label: "No", next: "outside" }],
  },
  {
    id: "outside", kind: "question", text: "Is the danger in the air or the street outside: fallout, a chemical, smoke, unrest or a disease that spreads?", sources: ["cdc-stay-inside", "ready-hazmat"],
    reasoning: "Closed walls cut the dose of fallout, chemicals and smoke, and keep you away from crowds and illness. A trip through the danger gives the highest dose.",
    answers: [{ label: "Yes", next: "to-seal" }, { label: "No", next: "to-stay" }],
  },
  {
    id: "society", kind: "question", text: "Does society work: does help come when you call, and do the shops, the pharmacies and the grid operate?", sources: [],
    reasoning: "With no help and no shops, each need depends on your group and your supplies. Each tab has a part for each state of society.",
    answers: [
      { label: "Yes", next: "need", society: "works" },
      { label: "In part", next: "need", society: "partly" },
      { label: "No: no help comes for 24 hours when you call, and the shops stay closed", next: "need", society: "none" },
    ],
  },
  {
    id: "need", kind: "question", text: "Which need is short first? When the tab of the need says go, go to the tab go.", sources: [],
    reasoning: NEEDS_FIRST,
    answers: [
      { label: "Safety of the people, or a person who is missing", next: "to-security" },
      { label: "Heat, shelter, power or fuel", next: "to-heat" },
      { label: "Water or a toilet", next: "to-water" },
      { label: "Health, medicine or a crisis of the mind", next: "to-health" },
      { label: "Food", next: "to-food" },
      { label: "Contact, money or trade", next: "to-group" },
      { label: "A plan from week 5, or a life on your land", next: "to-long" },
      { label: "A skill or a fact", next: "to-appendices" },
    ],
  },

  // The ends: each one goes to a tab of the binder. An end with `next` then leads on to the next question.
  { id: "to-window", kind: "goto", text: "Before the event comes, do the part \"When a warning comes\" of the tab the first 72 hours. Read the card of the event too.", tab: "first-72h", card: true, next: "inside" },
  { id: "to-72h", kind: "goto", text: "Do the reflex of the tab the first 72 hours and of the card of the event. For a siren with no known cause, go inside, close the windows, and get news from two inputs.", tab: "first-72h", card: true, next: "inside" },
  { id: "to-seal", kind: "goto", text: "Stay inside, close the windows, and seal one room. Go out only when the card of the event says so.", tab: "stay", card: true, next: "society" },
  { id: "to-stay", kind: "goto", text: "Go to the tab: stay. Read the card of the event too.", tab: "stay", card: true, next: "society" },
  { id: "to-go", kind: "goto", text: "Go to the tab: go. Read the card of the event too. Is fallout or a chemical outside too? Then go to the center or the basement of this building, away from the fire. Or go to the nearest strong building. Do not wait in the open. At the other place, start the chart again.", sources: ["ready-radiation", "ready-hazmat"], tab: "go", card: true, next: "society" },
  { id: "to-long", kind: "goto", text: "Go to the tab: the long term.", tab: "long-term" },
  { id: "to-security", kind: "goto", text: "Go to the tab: the safety of the people.", tab: "security" },
  { id: "to-heat", kind: "goto", text: "Go to the tab: heat, shelter and power.", tab: "heat" },
  { id: "to-water", kind: "goto", text: "Go to the tab: water and sanitation.", tab: "water" },
  { id: "to-health", kind: "goto", text: "Go to the tab: health and medicine.", tab: "health" },
  { id: "to-food", kind: "goto", text: "Go to the tab: food.", tab: "food" },
  { id: "to-group", kind: "goto", text: "Go to the tab: contact, the group and trade.", tab: "group" },
  { id: "to-appendices", kind: "goto", text: "Go to the appendices.", tab: "appendices" },
];
