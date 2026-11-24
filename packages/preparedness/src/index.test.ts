import { fileURLToPath } from "node:url";
import { checkSources, checkUnits, permits } from "@mark1russell7/guidebook";
import { bytesOf, checkCatalog, kiwixKeyOf } from "@mark1russell7/guidebook-library";
import { checkTopics, printOrder } from "@mark1russell7/guidebook-topics";
import { HORIZONS, PHASES, checkCoverage, checkSteps, planMatrix, stepsFor, chartOf, checkMasterGraph, checkRules, masterChartOf, walkAnswer, walkStart } from "@mark1russell7/guidebook-plans";
import { Linter, loadConfig } from "@mark1russell7/ste-lint";
import type { WalkState } from "@mark1russell7/guidebook-plans";
import { describe, expect, it } from "vitest";
import { AREAS, BUNDLES, CATALOG_TAB, GRAPH, HAZARDS, BUNDLE_LEVELS, CASES, CUTS, GAPS, MEDIA_UNITS, MEDIUM_GAPS, MEDIUM_LIVES, MEDIUM_LOSSES, MASTER, MORE_CASES, NEEDS, OPEN_CELLS, RULES, SOCIETY_KEY, SOURCES, START_TAB, STEPS, TAB_UNITS, TABS, TOPICS, TOPIC_UNITS } from "./index.ts";

const ALL_CASES = [...CASES, ...MORE_CASES];
const KEYS = [...ALL_CASES, ...CUTS, SOCIETY_KEY];
const AT = "2026-11-23";
const FULL = ["ready", "warned", "P0", "P1", "P2", "P3"] as const;

describe("the source gate", () => {
  it("finds no error and no warning in the sources", () => {
    expect(checkSources(SOURCES, { at: AT })).toEqual([]);
  });

  it("gives each source of a step a license that permits a summary in a commercial guidebook", () => {
    const ofSteps = new Set(STEPS.flatMap((step) => step.sources));
    expect(SOURCES.filter((source) => ofSteps.has(source.id) && !permits(source.license, "summary", { commercial: true }))).toEqual([]);
  });

  it("uses each source in a step, a bundle or a unit", () => {
    const cited = new Set([...STEPS.flatMap((step) => step.sources), ...BUNDLES.map((bundle) => bundle.source), ...MEDIA_UNITS.map((unit) => unit.source), ...TOPIC_UNITS.map((unit) => unit.source), ...TAB_UNITS.map((unit) => unit.source)]);
    expect(SOURCES.map((source) => source.id).filter((id) => !cited.has(id))).toEqual([]);
  });
});

describe("the rates of the media", () => {
  it("finds no finding in the units of the rates, for a commercial guidebook", () => {
    expect(checkUnits(MEDIA_UNITS, SOURCES, { commercial: true })).toEqual([]);
  });

  it("gives each rate a unit with the same percent, and each kind a rate or a gap", () => {
    for (const [kind, loss] of Object.entries(MEDIUM_LOSSES)) {
      const unit = MEDIA_UNITS.find((u) => u.id === loss.unit);
      expect(unit?.text, kind).toContain(`${(loss.yearlyLoss * 100).toFixed(2)}%`);
    }
    for (const [id, entry] of Object.entries(MEDIUM_LIVES)) {
      const unit = MEDIA_UNITS.find((u) => u.id === entry.unit);
      expect(unit?.text, id).toContain(`more than ${entry.life.years} years`);
      expect(entry.life.quantile, id).toBe(0.05);
    }
    const lives = Object.values(MEDIUM_LIVES).map((entry) => entry.kind);
    expect([...new Set([...Object.keys(MEDIUM_LOSSES), ...lives, ...MEDIUM_GAPS])].sort()).toEqual(["flash", "hdd", "optical", "paper", "ssd"]);
  });
});

describe("the bundle catalog", () => {
  const rules = BUNDLE_LEVELS.map((level) => ({ level, copies: 1, kinds: 1, places: 1, everyDays: 365 }));

  it("finds no finding in a commercial guidebook", () => {
    expect(checkCatalog(BUNDLES, { sources: SOURCES, rules, commercial: true })).toEqual([]);
  });

  it("fits the pocket bundles on one flash drive of 32 GB", () => {
    const pocket = BUNDLES.filter((bundle) => bundle.level === "pocket").map((bundle) => bundle.id);
    expect(bytesOf(BUNDLES, pocket)).toBeLessThan(32e9);
  });

  it("gives each bundle a SHA-256, and a version that agrees with the release of its address", () => {
    expect(BUNDLES.filter((bundle) => !/^[0-9a-f]{64}$/u.test(bundle.sha256 ?? "")).map((bundle) => bundle.id)).toEqual([]);
    expect(BUNDLES.filter((bundle) => kiwixKeyOf(bundle.url ?? "")?.release !== bundle.version).map((bundle) => bundle.id)).toEqual([]);
  });
});

describe("the topics", () => {
  it("finds no finding in the graph of the topics", () => {
    expect(checkTopics(TOPICS, { areas: AREAS, units: TOPIC_UNITS.map((unit) => unit.id), bundles: BUNDLES.map((bundle) => bundle.id), serves: NEEDS })).toEqual([]);
  });

  it("finds no finding in the units of the topics, for a commercial guidebook", () => {
    expect(checkUnits(TOPIC_UNITS, SOURCES, { commercial: true })).toEqual([]);
  });

  it("gives each unit of a topic to exactly one topic", () => {
    expect(TOPIC_UNITS.filter((unit) => TOPICS.filter((topic) => topic.units.includes(unit.id)).length !== 1).map((unit) => unit.id)).toEqual([]);
  });

  it("gives each topic at least 3 units", () => {
    expect(TOPICS.filter((topic) => topic.units.length < 3).map((topic) => topic.id)).toEqual([]);
  });

  it("has 40 topics in 12 areas, each area with a topic", () => {
    expect(TOPICS).toHaveLength(40);
    expect(AREAS.filter((area) => !TOPICS.some((topic) => topic.area === area))).toEqual([]);
  });

  it("puts each topic after its prerequisites in the print order", () => {
    const order = printOrder(TOPICS).map((topic) => topic.id);
    expect(order).toHaveLength(TOPICS.length);
    for (const topic of TOPICS) for (const need of topic.requires) expect(order.indexOf(need), `${need} before ${topic.id}`).toBeLessThan(order.indexOf(topic.id));
  });
});

describe("the tab units", () => {
  it("finds no finding in the units of the tabs, for a commercial guidebook", () => {
    expect(checkUnits(TAB_UNITS, SOURCES, { commercial: true })).toEqual([]);
  });

  it("starts each id with tab, the id of a tab of the binder, and a dot", () => {
    const tabs = GRAPH.tabs.map((tab) => tab.id);
    expect(TAB_UNITS.filter((unit) => !tabs.some((id) => unit.id.startsWith(`tab.${id}.`))).map((unit) => unit.id)).toEqual([]);
  });

  it("gives no unit the text of a step", () => {
    const steps = new Set(STEPS.map((step) => step.do));
    expect(TAB_UNITS.filter((unit) => steps.has(unit.text)).map((unit) => unit.id)).toEqual([]);
  });
});

describe("the step gate", () => {
  it("has the 12 cases of v1 and the 12 cuts", () => {
    expect(new Set(CASES).size).toBe(12);
    expect(new Set(CUTS).size).toBe(12);
    expect(CASES.filter((key) => (MORE_CASES as readonly string[]).includes(key))).toEqual([]);
  });

  const result = checkSteps(STEPS, SOURCES, { phases: PHASES, on: KEYS, gaps: GAPS, commercial: true });

  it("finds no finding over all the keys and the phases", () => {
    expect(result.findings).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it("gives each cell a step or a marked gap", () => {
    const cells = planMatrix(STEPS, GAPS, KEYS, PHASES).flat();
    expect(cells).toHaveLength(KEYS.length * PHASES.length);
    expect(cells.filter((cell) => cell.steps.length === 0 && cell.gap === undefined)).toEqual([]);
  });

  it("gives each case a step in each phase from ready to P3, or a marked gap", () => {
    for (const key of ALL_CASES) {
      for (const phase of FULL) {
        const steps = stepsFor(STEPS, [key], [phase]);
        const gap = GAPS.find((entry) => entry.on === key && entry.phase === phase);
        expect(steps.length > 0 || gap !== undefined, `${key} ${phase}`).toBe(true);
      }
    }
  });

  it("uses only the known keys and the known needs", () => {
    expect(STEPS.filter((step) => !(KEYS as readonly string[]).includes(step.on))).toEqual([]);
    expect(STEPS.flatMap((step) => step.needs).filter((need) => !(NEEDS as readonly string[]).includes(need))).toEqual([]);
  });

  it("gives no text two times in a phase at the end of a walk, also in a tab of all the cases", () => {
    const repeats = GRAPH.tabs.flatMap((tab) =>
      tab.phases.flatMap((phase) => {
        const texts = stepsFor(STEPS, tab.keys, [phase]).map((step) => step.do);
        return texts.filter((text, index) => texts.indexOf(text) !== index).map((text) => `${tab.id} ${phase}: ${text}`);
      }),
    );
    expect(repeats).toEqual([]);
  });

  it("gives no step of a plan two times when a case and its cuts share a text", () => {
    for (const key of ALL_CASES) {
      const texts = stepsFor(STEPS, [key, ...CUTS], PHASES).map((step) => step.do);
      expect(texts.filter((text, index) => texts.indexOf(text) !== index), key).toEqual([]);
    }
  });
});

describe("the coverage gate", () => {
  const result = checkCoverage(STEPS, { on: KEYS, phases: HORIZONS, gaps: GAPS });

  it("fails each open cell, and the list of open cells only gets shorter", () => {
    expect(result.findings.map((finding) => finding.id)).toEqual(OPEN_CELLS);
    expect(result.ok).toBe(OPEN_CELLS.length === 0);
  });

  it("gives each open cell a finding with the code no-step or marked-gap", () => {
    expect(result.findings.filter((finding) => finding.level !== "error" || !["no-step", "marked-gap"].includes(finding.code))).toEqual([]);
  });
});

describe("the words of the steps", () => {
  const root = fileURLToPath(new URL("../../..", import.meta.url));
  const linter = new Linter(loadConfig({ cwd: root }));
  const texts = [
    ...STEPS.map((step) => [step.id, step.do] as const),
    ...GAPS.map((gap) => [`${gap.on}.${gap.phase}`, gap.why] as const),
    ...STEPS.flatMap((step) => (step.reasoning === undefined ? [] : [[`${step.id}.reasoning`, step.reasoning] as const])),
    ...RULES.flatMap((rule) => [[`${rule.id}.when`, rule.when] as const, [`${rule.id}.then`, rule.then] as const]),
    ...MASTER.map((node) => [`chart.${node.id}`, node.text] as const),
    ...MASTER.flatMap((node) => (node.kind === "question" && node.reasoning !== undefined ? [[`chart.${node.id}.reasoning`, node.reasoning] as const] : [])),
    ...TAB_UNITS.map((unit) => [unit.id, unit.text] as const),
  ];

  it("obey the rules of Simplified Technical English", () => {
    const errors = texts.flatMap(([id, text]) =>
      linter
        .lintText(`${text}\n`, `${id}.md`)
        .filter((finding) => finding.severity === "error")
        .map((finding) => `${id}: ${finding.ruleId}: ${finding.message}`),
    );
    expect(errors).toEqual([]);
  });
});

describe("the decision chart", () => {
  it("passes the rule gate: each key is known, each target has steps, each rule cites a source", () => {
    expect(checkRules(RULES, STEPS, SOURCES, { on: [...KEYS, ...NEEDS] }).findings).toEqual([]);
  });

  it("asks first where you are, then for a danger now, then for what is cut", () => {
    expect(chartOf(RULES).map((question) => question.kind)).toEqual(["place", "reflex", "module", "stay", "go", "fallback", "long-plan"]);
  });

  it("gives a module for each cut", () => {
    const modules = new Set(RULES.filter((rule) => rule.kind === "module").map((rule) => rule.target?.on));
    expect(CUTS.filter((cut) => !modules.has(cut))).toEqual([]);
  });
});

// The words of a step that waits for officials. A broadcast is one input of information, never the trigger of a step.
const DEFERENCE =
  /\b(obey|officials?|authorit(?:y|ies)|instructions?|guidance|stay tuned|tune in|mandatory|evacuation orders?|order(?:s|ed)? an evacuation|when told|if told|(?:after|until) (?:you hear )?the all clear|wait for (?:an? )?(?:order|signal|word))\b/i;

describe("the no-officials gate", () => {
  const texts: (readonly [string, string])[] = [
    ...STEPS.flatMap((step) => [[step.id, step.do] as const, ...(step.reasoning === undefined ? [] : [[`${step.id}.reasoning`, step.reasoning] as const])]),
    ...RULES.flatMap((rule) => [[`${rule.id}.when`, rule.when] as const, [`${rule.id}.then`, rule.then] as const]),
    ...MASTER.flatMap((node) => [
      [node.id, node.text] as const,
      ...(node.kind === "question" ? [[`${node.id}.reasoning`, node.reasoning ?? ""] as const, ...node.answers.map((answer) => [`${node.id}.answer`, answer.label] as const)] : []),
    ]),
  ];

  it("finds no step, rule or chart text that waits for officials or obeys them", () => {
    expect(texts.filter(([, text]) => DEFERENCE.test(text)).map(([id, text]) => `${id}: ${text}`)).toEqual([]);
  });

  it("refuses the texts of deference that it is for, and lets a broadcast be an input", () => {
    for (const text of ["Obey the officials.", "Go back when the authorities say it is safe.", "Stay tuned.", "Follow the instructions on the radio.", "Stay until the all clear."]) {
      expect(DEFERENCE.test(text), text).toBe(true);
    }
    expect(DEFERENCE.test("Listen to a battery radio for news.")).toBe(false);
  });
});

// The words of a service of a society that works. A step after the start that names one gives the states of society that it is for.
const SERVICE =
  /\b(buy|purchase|shops?|pharmac(?:y|ies|ist)|hospitals?|doctors?|911|9-1-1|ambulances?|emergency team|fire department|banks?|insurers?|insurance|apply|FEMA|landlord|(?:power|gas|water|utility) company|emergency services|reception center|public shelter|charit(?:y|ies)|volunteer groups?|employer|credit cards?|debit cards?|ATM|SNAP|unemployment|professional|plumber|electrician|contractors?|poison center|ambulance|fire department)\b/i;
const LONG = ["P3", "P4", "P5"] as const;

describe("the no-society gate", () => {
  it("gives the states of society of each step after the start that names a service of society", () => {
    const open = STEPS.filter((step) => !["ready", "warned"].includes(step.phase) && step.society === undefined && SERVICE.test(step.do));
    expect(open.map((step) => `${step.id}: ${step.do}`)).toEqual([]);
  });

  it("gives each key of the long-term tab steps for a society with no service, from 5 days to 5 years", () => {
    const long = TABS.find((tab) => tab.id === "long-term")?.keys ?? [];
    expect(long).toEqual([...CUTS, SOCIETY_KEY]);
    const missing = long.flatMap((key) =>
      LONG.filter((phase) => !STEPS.some((step) => step.on === key && step.phase === phase && step.society?.includes("none"))).map((phase) => `${key}/${phase}`),
    );
    expect(missing).toEqual([]);
  });

  it("gives each step for a society with no service its reasoning or its sources", () => {
    const bare = STEPS.filter((step) => step.society?.includes("none") && step.reasoning === undefined && step.sources.length === 0);
    expect(bare.map((step) => step.id)).toEqual([]);
  });

  it("gives a plan with no service no step that names a service only a working society has", () => {
    const plan = stepsFor(STEPS, KEYS, [...LONG], { society: "none" });
    expect(plan.filter((step) => step.society === undefined && SERVICE.test(step.do)).map((step) => step.id)).toEqual([]);
  });
});

describe("the master chart", () => {
  // The catalog of hazards in the stack model has the same 26 cases, and its cuts are the ids of CUTS.
  const cover = [...ALL_CASES, ...CUTS, ...NEEDS];
  const tabs = TABS.filter((tab) => tab.id !== START_TAB);

  it("finds no finding: each hazard and each part has a route, in 3 questions or fewer, on one page", () => {
    const result = checkMasterGraph(GRAPH, STEPS, SOURCES, { on: [...KEYS, ...NEEDS], cover, cases: ALL_CASES, maxQuestions: 3, maxNodes: 22, maxEnds: 13 });
    expect(result.findings).toEqual([]);
  });

  // Each walk of the chart, from each signal and each catalog row, with each answer. A walk ends at an end with no next.
  const walks = (): WalkState[] => {
    const done: WalkState[] = [];
    const starts = [...MASTER.filter((node) => node.kind === "signal").map((node) => walkStart(GRAPH, undefined, node.id)), ...HAZARDS.map((row) => walkStart(GRAPH, row.key))];
    const open = starts.filter((state) => state !== undefined);
    for (let state = open.pop(); state !== undefined; state = open.pop()) {
      const node = MASTER.find((item) => item.id === state.at);
      const labels = node?.kind === "question" ? node.answers.map((answer) => answer.label) : [undefined];
      const next = labels.map((label) => walkAnswer(GRAPH, state, label)).filter((item) => item !== undefined);
      if (next.length === 0) done.push(state);
      open.push(...next);
    }
    return done;
  };

  it("leads each walk to the question of society and to a need, so no walk ends at stay or go", () => {
    const short = walks().filter((state) => !state.trail.some((step) => step.at === "society"));
    expect(short.map((state) => [...state.trail.map((step) => step.at), state.at].join(" > "))).toEqual([]);
  });

  it("sends a reader out only for a danger inside the place, never for a danger in the air or the street", () => {
    const out = walks().filter((state) => {
      const path = [...state.trail.map((step) => step.at), state.at];
      const seal = path.indexOf("to-seal");
      return seal >= 0 && path.indexOf("to-go", seal) >= 0 && path.indexOf("to-go", seal) < path.indexOf("society");
    });
    expect(out).toEqual([]);
    const inside = MASTER.find((node) => node.id === "outside");
    expect(inside?.kind === "question" && inside.answers.find((answer) => answer.label === "Yes")?.next).toBe("to-seal");
  });

  it("keeps the household out of the open at the end go when fallout or a chemical is outside too", () => {
    const go = MASTER.find((node) => node.id === "to-go");
    expect(go?.text).toMatch(/Is fallout or a chemical outside too?/);
    expect(go?.text).toMatch(/Do not wait in the open/);
    expect(go?.sources).toEqual(["ready-radiation", "ready-hazmat"]);
  });

  it("gives CPR with no team the stop rule of the health tab, with its sources", () => {
    const step = STEPS.find((row) => row.id.endsWith("cpr-none"));
    expect(step?.do).toMatch(/breathes or moves.*exhausted or in danger.*30 minutes/);
    expect(step?.sources).toEqual(["mra-cpr", "naemsp-wilderness"]);
  });

  it("indexes carbon monoxide, a death and a birth, and sends each to the tab of its steps", () => {
    expect((GRAPH.index ?? []).map((entry) => `${entry.title}>${entry.tab}`)).toEqual(["Carbon monoxide>first-72h", "A death in the household>health", "Pregnancy and birth>health"]);
  });

  it("gives each card of a release of radiation the time to stay inside", () => {
    const byId = new Map(STEPS.map((step) => [step.id, step] as const));
    for (const key of ["cbrne.radiological", "cbrne.nuclear-detonation"]) {
      const card = HAZARDS.find((row) => row.key === key)?.card ?? [];
      expect(card.some((id) => /at least 24 hours/.test(byId.get(id)?.do ?? "")), key).toBe(true);
    }
  });

  it("gives each hazard a card of its own facts, and the cards fit the pages of the catalog", () => {
    const empty = HAZARDS.filter((row) => row.card.length === 0).map((row) => row.key);
    expect(empty).toEqual(["infra.power.outage", "infra.water.outage"]);
    const cards = HAZARDS.reduce((sum, row) => sum + row.card.length, 0);
    const pages = TABS.find((tab) => tab.id === CATALOG_TAB)?.pages ?? 0;
    // A page of the catalog holds approximately 15 short steps.
    expect(cards).toBeLessThanOrEqual(pages * 15);
  });

  it("gives each end that leads on an edge to its next node, so the layers follow the reading order", () => {
    const chart = masterChartOf(MASTER, TABS);
    const ends = MASTER.flatMap((node) => (node.kind === "goto" && node.next !== undefined ? [`${node.id}>${node.next}`] : []));
    expect(ends.filter((end) => !chart.edges.some((edge) => `${edge.from}>${edge.to}` === end))).toEqual([]);
    const layer = new Map(chart.nodes.map((placed) => [placed.node.id, placed.layer] as const));
    const order = ["life", "inside", "outside", "society", "need"].map((id) => layer.get(id) ?? -1);
    expect(order).toEqual([...order].sort((a, b) => a - b));
    expect(new Set(order).size).toBe(order.length);
  });

  it("asks for the state of society, with an answer for each state", () => {
    const states = MASTER.flatMap((node) => (node.kind === "question" ? node.answers.flatMap((answer) => answer.society ?? []) : []));
    expect([...new Set(states)].sort()).toEqual(["none", "partly", "works"]);
  });

  it("gives each tab of the binder a page budget, and sends the reader to each tab but the start", () => {
    expect(TABS.filter((tab) => tab.pages === undefined)).toEqual([]);
    // The catalog has no end of its own: the ends with a card send the reader to it.
    expect(masterChartOf(MASTER, TABS).tabs.map((tab) => tab.id)).toEqual(tabs.filter((tab) => tab.id !== CATALOG_TAB).map((tab) => tab.id));
    expect(MASTER.some((node) => node.kind === "goto" && node.card === true)).toBe(true);
  });
});
