// The master chart: one chart for any disaster. A reader starts at a signal, answers at most 2 questions and goes to a tab.
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
    { id: "start", title: "Start: the master chart", keys: [], phases: [], pages: 2 },
    { id: "first-72h", title: "The first 72 hours", keys: cases, phases: ["P0", "P1", "P2"], pages: 4 },
    { id: "stay", title: "Stay: the home and the building", keys: ["home.dwelling"], phases: ALL, pages: 8 },
    { id: "go", title: "Go: the routes and the other places", keys: ["road.local"], phases: ALL, pages: 4 },
    { id: "water", title: "Water and sanitation", keys: ["water.main", "sewer.main", "hydration.drink"], phases: ALL, pages: 6 },
    { id: "heat", title: "Heat, shelter and power", keys: ["power.grid", "gas.main", "fuel.retail", "power.electric"], phases: ALL, pages: 6 },
    { id: "health", title: "Health and medicine", keys: ["care.local", "health.medicine", "health.medical-emergency"], phases: ALL, pages: 8 },
    { id: "food", title: "Food", keys: ["food.retail", "food.energy"], phases: ALL, pages: 6 },
    { id: "security", title: "The safety of the people", keys: ["security.civil-unrest", "security.armed-conflict"], phases: ALL, pages: 6 },
    { id: "group", title: "Contact, the group and trade", keys: ["phone.network", "network.access", "cash.retail", "society.services"], phases: ALL, pages: 6 },
    { id: "long-term", title: "The long term: 5 weeks to 5 years", keys: cuts, phases: ["P3", "P4", "P5"], pages: 10 },
    { id: "catalog", title: "The hazard catalog", keys: cases, phases: ALL, pages: 8 },
    { id: "appendices", title: "The appendices", keys: [], phases: [], pages: 40 },
  ];
}

/** The tab of the chart itself. It is the entry of the binder, so no path of the chart goes to it. */
export const START_TAB = "start";

/** The tab of the hazard catalog. An end with a card sends the reader to the card of the event in it. */
export const CATALOG_TAB = "catalog";

const NEEDS_FIRST = "Do the needs by their danger. Safety comes in minutes, heat and water in hours and days, food in weeks.";

/** The nodes of the master chart: 3 signals, 4 questions and 11 ends. */
export const MASTER: readonly ChartNode[] = [
  // The signals: what a reader sees, hears, smells, feels or learns.
  { id: "sense", kind: "signal", text: "You see, hear, smell or feel a danger: fire, smoke, gas, shaking, a flash, rising water, a siren or shots.", next: "life" },
  { id: "threat", kind: "signal", text: "You learn of a threat that comes: a storm, a flood, a fire, a disease, unrest, an attack or a war.", next: "place" },
  { id: "supply", kind: "signal", text: "A supply stops, or help does not come: power, water, sewer, gas, phone, internet, fuel, food, cash, care or the law.", next: "society" },

  // The questions. Each one has an answer that a reader can see without help.
  {
    id: "life", kind: "question", text: "Can the danger hurt you in the next minutes?", sources: [],
    reasoning: "A danger of minutes leaves no time to read. Do the reflex first, then come back to the chart.",
    answers: [{ label: "Yes", next: "to-72h" }, { label: "No", next: "place" }],
  },
  {
    id: "place", kind: "question", text: "Is your place safe to stay in: no fire, gas, flood water, damage, bad air, violence or an illness that spreads?", sources: [],
    reasoning: "Your place holds your supplies, so stay when it is safe. Go when the place itself is the danger.",
    answers: [{ label: "Yes", next: "to-stay" }, { label: "No", next: "to-go" }],
  },
  {
    id: "society", kind: "question", text: "Does society work: does help come when you call, and do the shops, the pharmacies and the grid operate?", sources: [],
    reasoning: "With no help and no shops, each need depends on your group and your supplies for weeks or more. Then the long plan comes first.",
    answers: [
      { label: "Yes", next: "need", society: "works" },
      { label: "In part", next: "need", society: "partly" },
      { label: "No: no help comes for 24 hours when you call, and the shops stay closed", next: "to-long", society: "none" },
    ],
  },
  {
    id: "need", kind: "question", text: "Which need is short first? Use the section of the tab for the state of society.", sources: [],
    reasoning: NEEDS_FIRST,
    answers: [
      { label: "Safety of the people", next: "to-security" },
      { label: "Heat, shelter or power", next: "to-heat" },
      { label: "Water or a toilet", next: "to-water" },
      { label: "Health or medicine", next: "to-health" },
      { label: "Food", next: "to-food" },
      { label: "Contact, money or trade", next: "to-group" },
      { label: "A skill or a fact", next: "to-appendices" },
    ],
  },

  // The ends: each one goes to a tab of the binder.
  { id: "to-72h", kind: "goto", text: "Go to the tab: the first 72 hours. Read the card of the event too.", tab: "first-72h", card: true },
  { id: "to-stay", kind: "goto", text: "Go to the tab: stay. Read the card of the event too.", tab: "stay", card: true },
  { id: "to-go", kind: "goto", text: "Go to the tab: go. Read the card of the event too.", tab: "go", card: true },
  { id: "to-long", kind: "goto", text: "Go to the tab: the long term.", tab: "long-term" },
  { id: "to-security", kind: "goto", text: "Go to the tab: the safety of the people.", tab: "security" },
  { id: "to-heat", kind: "goto", text: "Go to the tab: heat, shelter and power.", tab: "heat" },
  { id: "to-water", kind: "goto", text: "Go to the tab: water and sanitation.", tab: "water" },
  { id: "to-health", kind: "goto", text: "Go to the tab: health and medicine.", tab: "health" },
  { id: "to-food", kind: "goto", text: "Go to the tab: food.", tab: "food" },
  { id: "to-group", kind: "goto", text: "Go to the tab: contact, the group and trade.", tab: "group" },
  { id: "to-appendices", kind: "goto", text: "Go to the appendices.", tab: "appendices" },
];
