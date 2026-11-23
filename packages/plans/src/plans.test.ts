import { describe, expect, it } from "vitest";
import type { Source } from "@mark1russell7/guidebook";
import { HORIZONS, LADDER, PHASES, PHASE_BOUNDS, RULE_KINDS, GRAPH_SCHEMA, chartOf, checkMasterChart, checkMasterGraph, masterChartOf, walkAnswer, walkBack, walkEnd, walkStart, checkCoverage, checkRules, checkSteps, coverageOf, phaseIn, phaseOf, phasesOf, planMatrix, stepsFor } from "./index.ts";
import type { ChartNode, Ladder, MasterGraph, Rule, Step, Tab } from "./index.ts";

const MIN = 60;
const HOUR = 3600;
const DAY = 86_400;

const step = (id: string, on: string, phase: Step["phase"], order: number, sources: string[] = ["pd"]): Step => ({
  id,
  on,
  phase,
  needs: [],
  do: `Do the action of ${id}.`,
  order,
  sources,
});

const sources: Source[] = [
  { id: "pd", title: "A federal page", url: "https://example.gov/pd", license: "us-public-domain", checked: "2026-11-21" },
  { id: "fix", title: "An invented page", url: "https://example.invalid/fix", license: "invented", checked: "2026-11-21" },
];

describe("phaseOf", () => {
  it("gives the phase of each bound, and of a time just before it", () => {
    expect(phaseOf(0)).toBe("P0");
    expect(phaseOf(5 * MIN - 1)).toBe("P0");
    expect(phaseOf(5 * MIN)).toBe("P1");
    expect(phaseOf(5 * HOUR)).toBe("P2");
    expect(phaseOf(2 * DAY)).toBe("P2");
    expect(phaseOf(5 * DAY)).toBe("P3");
    expect(phaseOf(35 * DAY)).toBe("P4");
    expect(phaseOf(150 * DAY)).toBe("P5");
    expect(phaseOf(50 * 365 * DAY)).toBe("P5");
  });

  it("gives ready or warned before the start", () => {
    expect(phaseOf(-1)).toBe("ready");
    expect(phaseOf(-1, true)).toBe("warned");
    expect(phaseOf(10, true)).toBe("P0");
  });

  it("refuses a time that is not finite", () => {
    expect(() => phaseOf(Number.NaN)).toThrow(RangeError);
    expect(() => phaseOf(Number.POSITIVE_INFINITY)).toThrow(RangeError);
  });

  it("keeps the phases and the bounds of the default ladder together", () => {
    expect(phasesOf(LADDER)).toEqual(PHASES);
    expect(LADDER.timed.map((t) => t.from)).toEqual(PHASE_BOUNDS.slice(0, 6));
  });

  it("uses a ladder of the caller", () => {
    const ladder: Ladder<"calm" | "alert" | "now" | "later"> = {
      ready: "calm",
      warned: "alert",
      timed: [
        { phase: "now", from: 0 },
        { phase: "later", from: HOUR },
      ],
      titles: { calm: "Calm", alert: "Alert", now: "Now", later: "Later" },
    };
    expect(phaseIn(ladder, -5, true)).toBe("alert");
    expect(phaseIn(ladder, HOUR - 1)).toBe("now");
    expect(phaseIn(ladder, HOUR)).toBe("later");
    expect(() => phaseIn({ ...ladder, timed: [{ phase: "later", from: 10 }] }, 1)).toThrow(/starts at 0/u);
  });
});

describe("stepsFor", () => {
  const library = [step("b2", "b", "P1", 2), step("b1", "b", "P1", 1), step("a0", "a", "P0", 1), step("a1", "a", "P1", 1), step("c1", "c", "P1", 1)];

  it("gives the steps by key, then by phase, then by order", () => {
    expect(stepsFor(library, ["b", "a"], ["P0", "P1"]).map((s) => s.id)).toEqual(["b1", "b2", "a0", "a1"]);
  });

  it("gives a step one time when a key comes two times", () => {
    expect(stepsFor(library, ["b", "b"], ["P1"]).map((s) => s.id)).toEqual(["b1", "b2"]);
  });

  it("gives nothing for a key or a phase with no step", () => {
    expect(stepsFor(library, ["z"], ["P0"])).toEqual([]);
    expect(stepsFor(library, ["a"], [])).toEqual([]);
  });
});

describe("planMatrix", () => {
  it("gives one cell for each key and phase, with its steps or its gap", () => {
    const matrix = planMatrix([step("a1", "a", "P1", 1)], [{ on: "a", phase: "P0", why: "No action is necessary." }], ["a"], ["P0", "P1"]);
    expect(matrix).toHaveLength(1);
    expect(matrix[0]?.map((cell) => [cell.phase, cell.steps.length, cell.gap?.why])).toEqual([
      ["P0", 0, "No action is necessary."],
      ["P1", 1, undefined],
    ]);
  });
});

describe("checkSteps", () => {
  const phases = PHASES;

  it("passes a good library with its gaps", () => {
    const steps = [step("a1", "a", "P0", 1), step("a2", "a", "P0", 2)];
    const result = checkSteps(steps, sources, { phases: ["P0", "P1"], on: ["a"], gaps: [{ on: "a", phase: "P1", why: "The event ends in minutes." }] });
    expect(result).toEqual({ ok: true, findings: [] });
  });

  it("finds the errors of the steps", () => {
    const steps = [
      step("a1", "a", "P0", 1),
      step("a1", "a", "P1", 1),
      { ...step("e", "a", "P2", 1), do: " " },
      step("n", "a", "P3", 1, []),
      step("m", "a", "P4", 1, ["none"]),
      step("f", "a", "P5", 1, ["fix"]),
      { ...step("x", "a", "P5", 2), phase: "P9" as Step["phase"] },
      step("o", "b", "P0", 0),
      step("d1", "c", "P0", 1),
      step("d2", "c", "P0", 1),
    ];
    const codes = checkSteps(steps, sources, { phases }).findings.map((f) => `${f.id}:${f.code}`);
    expect(codes).toEqual([
      "a1:duplicate-id",
      "e:empty-text",
      "n:no-source",
      "x:unknown-phase",
      "o:bad-order",
      "d2:duplicate-order",
      "m:missing-source",
      "f:use-refused",
    ]);
  });

  it("permits an invented source in a fixture", () => {
    expect(checkSteps([step("f", "a", "P0", 1, ["fix"])], sources, { phases, fixture: true }).ok).toBe(true);
  });

  it("names the step, not the unit, in a finding of the source gate", () => {
    const [finding] = checkSteps([step("m", "a", "P0", 1, ["none"])], sources, { phases }).findings;
    expect(finding?.message).toContain(`step "m"`);
  });

  it("finds an unmarked gap, a gap with steps, a duplicate gap, an empty reason and a gap with an unknown phase", () => {
    const gaps = [
      { on: "a", phase: "P0" as const, why: "No reason." },
      { on: "a", phase: "P1" as const, why: " " },
      { on: "a", phase: "P1" as const, why: "Again." },
      { on: "a", phase: "P9" as Step["phase"], why: "Off the ladder." },
    ];
    const result = checkSteps([step("a0", "a", "P0", 1)], sources, { phases: ["P0", "P1", "P2"], on: ["a"], gaps });
    expect(result.ok).toBe(false);
    expect(result.findings.map((f) => `${f.id}:${f.code}`)).toEqual([
      "a/P0:gap-with-steps",
      "a/P1:empty-reason",
      "a/P1:duplicate-gap",
      "a/P9:unknown-phase",
      "a/P2:unmarked-gap",
    ]);
  });
});

describe("checkCoverage", () => {
  const full = HORIZONS.map((phase) => step(`a.${phase}`, "a", phase, 1));

  it("passes a key with steps in each horizon", () => {
    expect(checkCoverage(full, { on: ["a"], phases: HORIZONS })).toEqual({ ok: true, findings: [] });
  });

  it("fails a cell with no step, and a marked gap does not pass it", () => {
    const steps = full.filter((item) => item.phase !== "P4" && item.phase !== "P5");
    const result = checkCoverage(steps, { on: ["a"], phases: HORIZONS, gaps: [{ on: "a", phase: "P5", why: "No source gives a step." }] });
    expect(result.ok).toBe(false);
    expect(result.findings.map((finding) => [finding.code, finding.id])).toEqual([
      ["no-step", "a/P4"],
      ["marked-gap", "a/P5"],
    ]);
    expect(result.findings[1]?.message).toContain("No source gives a step.");
  });

  it("shows each horizon of a key with no step as a finding, never as a pass", () => {
    const result = checkCoverage(full, { on: ["a", "b"], phases: HORIZONS });
    expect(result.findings.map((finding) => finding.id)).toEqual(HORIZONS.map((phase) => `b/${phase}`));
  });

  it("gives the covered and the missing phases of each key", () => {
    expect(coverageOf(full.slice(0, 2), ["a", "b"], HORIZONS)).toEqual([
      { on: "a", covered: ["P0", "P1"], missing: ["P2", "P3", "P4", "P5"] },
      { on: "b", covered: [], missing: [...HORIZONS] },
    ]);
  });
});

describe("checkRules", () => {
  const source: Source = { id: "page", title: "A page", url: "https://example.org/page", license: "us-public-domain", checked: "2026-11-22" };
  const steps: Step[] = [{ id: "fire.P0.out", on: "fire", phase: "P0", needs: [], do: "Get out.", order: 1, sources: ["page"] }];
  const rule = (over: Partial<Rule>): Rule => ({ id: "r", kind: "reflex", when: "There is smoke.", then: "Get out.", on: ["fire"], target: { on: "fire", phases: ["P0"] }, rank: 1, sources: ["page"], ...over });
  const bare = (base: Rule): Rule => {
    const { target: _target, ...rest } = base;
    return rest;
  };

  it("passes a rule with known keys, a target with steps and a known source", () => {
    expect(checkRules([rule({})], steps, [source], { on: ["fire"] }).findings).toEqual([]);
    expect(checkRules([bare(rule({ kind: "place", on: [] }))], steps, [source], { on: ["fire"] }).ok).toBe(true);
  });

  it("finds each break of a rule", () => {
    const rules = [
      rule({ id: "a", on: ["flood"] }),
      rule({ id: "a", target: { on: "fire", phases: ["P3"] } }),
      bare(rule({ id: "b", kind: "go" })),
      rule({ id: "c", sources: [] }),
      rule({ id: "d", sources: ["no-page"], target: { on: "smoke", phases: ["P0"] } }),
    ];
    expect(checkRules(rules, steps, [source], { on: ["fire"] }).findings.map((finding) => `${finding.code}:${finding.id}`)).toEqual([
      "unknown-key:a",
      "duplicate-id:a",
      "target-without-steps:a",
      "no-target:b",
      "no-source:c",
      "unknown-key:d",
      "unknown-source:d",
    ]);
  });

  it("gives the chart in the sequence of the kinds, and each kind in the sequence of the rank", () => {
    const chart = chartOf([rule({ id: "go", kind: "go" }), rule({ id: "r2", rank: 2 }), rule({ id: "r1", rank: 1 }), bare(rule({ id: "where", kind: "place" }))]);
    expect(chart.map((question) => question.kind)).toEqual(["place", "reflex", "go"]);
    expect(chart[1]?.rules.map((r) => r.id)).toEqual(["r1", "r2"]);
    expect(RULE_KINDS[0]).toBe("place");
  });
});

describe("checkMasterChart", () => {
  const library = [step("a", "case.a", "P0", 1), step("b", "cut.b", "P3", 1)];
  const tabs: Tab[] = [
    { id: "now", title: "Immediate danger", keys: ["case.a"], phases: ["P0"] },
    { id: "long", title: "No society", keys: ["cut.b"], phases: ["P3"], pages: 2 },
  ];
  const nodes: ChartNode[] = [
    { id: "smoke", kind: "signal", text: "You see smoke.", next: "danger" },
    { id: "danger", kind: "question", text: "Is there an immediate danger?", sources: ["pd"], answers: [{ label: "Yes", next: "go-now" }, { label: "No", next: "society" }] },
    { id: "society", kind: "question", text: "Does 911 answer?", sources: ["pd"], answers: [{ label: "Yes", next: "go-now", society: "works" }, { label: "No", next: "go-long", society: "none" }] },
    { id: "go-now", kind: "goto", text: "Go to the tab Immediate danger.", tab: "now" },
    { id: "go-long", kind: "goto", text: "Go to the tab No society.", tab: "long" },
  ];
  const codes = (list: ChartNode[], more: { cover?: string[]; maxQuestions?: number; maxNodes?: number; maxEnds?: number; tabs?: Tab[] } = {}) =>
    checkMasterChart(list, more.tabs ?? tabs, library, sources, { on: ["case.a", "cut.b"], ...more }).findings.map((finding) => `${finding.code}:${finding.id}`);

  it("finds no finding in a good chart", () => {
    expect(codes(nodes, { cover: ["case.a", "cut.b"] })).toEqual([]);
  });

  it("finds an unknown node, an unknown tab and an answer list that is too short", () => {
    const bad: ChartNode[] = [
      ...nodes.slice(0, 4),
      { id: "go-long", kind: "goto", text: "Go.", tab: "nowhere" },
      { id: "lonely", kind: "question", text: "Why?", sources: ["pd"], answers: [{ label: "Yes", next: "ghost" }] },
    ];
    expect(codes(bad)).toEqual(expect.arrayContaining(["unknown-tab:go-long", "unknown-node:lonely", "few-answers:lonely", "unreachable:lonely", "unused-tab:long"]));
  });

  it("finds a cycle and a path with too many questions", () => {
    const loop: ChartNode[] = nodes.map((node) => (node.id === "society" ? { ...node, answers: [{ label: "Yes", next: "danger" }, { label: "No", next: "go-long" }] } : node));
    expect(codes(loop)).toEqual(expect.arrayContaining(["cycle:danger", "cycle:society"]));
    expect(codes(nodes, { maxQuestions: 1 })).toEqual(["too-deep:smoke"]);
  });

  it("finds a tab with no steps, a key that no tab holds and a question with no source", () => {
    const empty: Tab[] = [tabs[0] as Tab, { ...(tabs[1] as Tab), phases: ["P5"] }];
    expect(codes(nodes, { tabs: empty, cover: ["case.a", "case.z"] })).toEqual(["tab-without-steps:long", "uncovered-key:case.z"]);
    const unsourced: ChartNode[] = nodes.map((node) => (node.kind === "question" ? { ...node, sources: [] } : node));
    expect(codes(unsourced)).toEqual(["no-source:danger", "no-source:society"]);
    const reasoned: ChartNode[] = unsourced.map((node) => (node.kind === "question" ? { ...node, reasoning: "A reader can answer it from what the reader sees." } : node));
    expect(codes(reasoned)).toEqual([]);
  });

  it("finds a chart with too many nodes or ends for its page", () => {
    expect(codes(nodes, { maxNodes: 4, maxEnds: 1 })).toEqual(["too-many-nodes:chart", "too-many-ends:chart"]);
  });

  it("finds a chart with no signal", () => {
    expect(codes(nodes.slice(1))).toEqual(expect.arrayContaining(["no-signal:chart"]));
  });
});

describe("checkMasterGraph", () => {
  const library = [step("a", "case.a", "P0", 1), step("b", "cut.b", "P3", 1)];
  const graph: MasterGraph = {
    schema: GRAPH_SCHEMA,
    start: "chart",
    catalog: "catalog",
    societies: ["works", "partly", "none"],
    nodes: [
      { id: "smoke", kind: "signal", text: "You see smoke.", next: "danger" },
      { id: "danger", kind: "question", text: "Is there an immediate danger?", sources: ["pd"], answers: [{ label: "Yes", next: "go-now" }, { label: "No", next: "go-help" }] },
      { id: "go-now", kind: "goto", text: "Go to the tab Immediate danger.", tab: "now", card: true },
      { id: "go-help", kind: "goto", text: "Go to the appendices.", tab: "help" },
    ],
    tabs: [
      { id: "chart", title: "The chart", keys: [], phases: [] },
      { id: "now", title: "Immediate danger", keys: ["cut.b"], phases: ["P3"] },
      { id: "catalog", title: "The hazard catalog", keys: ["case.a"], phases: ["P0"] },
      { id: "help", title: "The appendices", keys: [], phases: [] },
    ],
    hazards: [{ key: "case.a", title: "Case A", signals: ["smoke"], entry: "danger", card: ["a"] }],
  };
  const codes = (value: MasterGraph, cases = ["case.a"]) =>
    checkMasterGraph(value, library, sources, { on: ["case.a", "cut.b"], cover: ["case.a", "cut.b"], cases }).findings.map((finding) => `${finding.code}:${finding.id}`);

  it("finds no finding in a good graph, and the cards use the catalog tab", () => {
    expect(codes(graph)).toEqual([]);
    const noCard = { ...graph, nodes: graph.nodes.map((node) => (node.kind === "goto" ? { id: node.id, kind: node.kind, text: node.text, tab: node.tab } : node)) };
    expect(codes(noCard)).toEqual(["unused-tab:catalog", "uncovered-key:case.a"]);
  });

  it("finds a wrong schema, an unknown start and an unknown catalog", () => {
    expect(codes({ ...graph, schema: "guidebook-graph/1" as typeof GRAPH_SCHEMA, start: "nowhere", catalog: "none" })).toEqual(
      expect.arrayContaining(["bad-schema:graph", "unknown-start:nowhere", "unknown-catalog:none"]),
    );
  });

  it("finds bad hazard rows and a case with no row", () => {
    const rows = [
      { key: "case.a", title: "A", signals: ["danger"], entry: "ghost", card: ["b"] },
      { key: "case.a", title: "A", signals: [], entry: "go-help", card: [] },
      { key: "case.z", title: "Z", signals: ["smoke"], entry: "danger", card: [] },
    ];
    expect(codes({ ...graph, hazards: rows }, ["case.a", "case.y"])).toEqual([
      "unknown-signal:case.a",
      "unknown-entry:case.a",
      "unknown-card-step:case.a",
      "duplicate-hazard:case.a",
      "unknown-signal:case.a",
      "no-route:case.a",
      "unknown-hazard:case.z",
      "missing-hazard:case.y",
    ]);
  });

  it("finds an index entry with an unknown tab or the title of another entry", () => {
    const index = [
      { title: "A death in the household", tab: "chart", about: "the record" },
      { title: "A death in the household", tab: "chart", about: "the record" },
      { title: "Birth", tab: "ghost", about: "the signs" },
    ];
    expect(codes({ ...graph, index })).toEqual(["duplicate-index:A death in the household", "unknown-index-tab:Birth"]);
  });
});

describe("the walk of the master graph", () => {
  const library: Step[] = [
    step("a", "case.a", "P0", 1),
    { ...step("w", "cut.b", "P3", 1), society: ["works"] },
    { ...step("n", "cut.b", "P3", 2), society: ["none"] },
    step("all", "cut.b", "P4", 1),
  ];
  const graph: MasterGraph = {
    schema: GRAPH_SCHEMA,
    start: "chart",
    catalog: "catalog",
    societies: ["works", "partly", "none"],
    nodes: [
      { id: "smoke", kind: "signal", text: "You see smoke.", next: "society" },
      { id: "society", kind: "question", text: "Does help come?", sources: ["pd"], answers: [{ label: "Yes", next: "go-long", society: "works" }, { label: "No", next: "go-long", society: "none" }] },
      { id: "go-long", kind: "goto", text: "Go to the long term.", tab: "long", card: true },
    ],
    tabs: [
      { id: "chart", title: "The chart", keys: [], phases: [] },
      { id: "long", title: "The long term", keys: ["cut.b"], phases: ["P3", "P4", "P5"] },
      { id: "catalog", title: "The hazard catalog", keys: ["case.a"], phases: ["P0"] },
    ],
    hazards: [{ key: "case.a", title: "Case A", signals: ["smoke"], entry: "society", card: ["a"] }],
  };

  it("walks from a signal to an end, with the steps of the state of society", () => {
    const start = walkStart(graph);
    expect(start).toEqual({ at: "smoke", trail: [] });
    const asked = walkAnswer(graph, start!);
    const none = walkAnswer(graph, asked!, "No");
    expect(none).toEqual({ at: "go-long", society: "none", trail: [{ at: "smoke" }, { at: "society" }] });
    const end = walkEnd(graph, none!, library);
    expect(end?.tab.id).toBe("long");
    expect(end?.phases.map((item) => [item.phase, item.steps.map((s) => s.id)])).toEqual([["P3", ["n"]], ["P4", ["all"]]]);
    expect(end?.card).toEqual([]);
  });

  it("starts at the entry of a hazard and gives its card at an end with a card", () => {
    const start = walkStart(graph, "case.a");
    expect(start).toEqual({ at: "society", hazard: "case.a", trail: [] });
    const end = walkEnd(graph, walkAnswer(graph, start!, "Yes")!, library);
    expect(end?.society).toBe("works");
    expect(end?.phases.map((item) => item.steps.map((s) => s.id))).toEqual([["w"], ["all"]]);
    expect(end?.card.map((s) => s.id)).toEqual(["a"]);
  });

  it("leads on from an end with next, and counts no question after the first end", () => {
    const nodes = [
      { id: "smoke", kind: "signal", text: "You see smoke.", next: "inside" },
      { id: "inside", kind: "question", text: "Is it inside?", sources: ["pd"], answers: [{ label: "Yes", next: "go-out" }, { label: "No", next: "go-long" }] },
      { id: "go-out", kind: "goto", text: "Go out, then go on.", tab: "long", next: "society" },
      { id: "society", kind: "question", text: "Does help come?", sources: ["pd"], answers: [{ label: "Yes", next: "go-long" }, { label: "No", next: "go-more" }] },
      { id: "go-more", kind: "goto", text: "More.", tab: "long", next: "again" },
      { id: "again", kind: "question", text: "Again?", sources: ["pd"], answers: [{ label: "Yes", next: "go-long" }, { label: "No", next: "go-long" }] },
      { id: "go-long", kind: "goto", text: "Go to the long term.", tab: "long" },
    ] as const satisfies readonly ChartNode[];
    const on = { ...graph, nodes };
    const result = checkMasterChart(nodes, on.tabs.filter((tab) => tab.id === "long"), library, sources, { on: ["cut.b"], cover: ["cut.b"], maxQuestions: 1 });
    expect(result.findings.map((f) => f.code)).toEqual([]);
    const out = walkAnswer(on, walkAnswer(on, walkStart(on)!, undefined)!, "Yes")!;
    expect(out.at).toBe("go-out");
    expect(walkEnd(on, out, library)?.tab.id).toBe("long");
    expect(walkAnswer(on, out)?.at).toBe("society");
    expect(walkAnswer(on, { at: "go-long", trail: [] })).toBeUndefined();
    const loop = nodes.map((node) => (node.id === "go-long" ? { ...node, next: "smoke" } : node));
    expect(checkMasterChart(loop, on.tabs, library, sources, { on: ["cut.b"], cover: ["cut.b"] }).findings.some((f) => f.code === "cycle")).toBe(true);
  });

  it("goes back one node with the state of society at that node, and refuses unknown values", () => {
    const at = walkAnswer(graph, walkStart(graph, "case.a")!, "No")!;
    expect(walkBack(at)).toEqual({ at: "society", hazard: "case.a", trail: [] });
    expect(walkBack(walkBack(at))).toEqual(walkBack(at));
    expect(walkStart(graph, "case.z")).toBeUndefined();
    expect(walkStart(graph, undefined, "ghost")).toBeUndefined();
    expect(walkAnswer(graph, walkStart(graph, "case.a")!, "Maybe")).toBeUndefined();
    expect(walkAnswer(graph, at, "Yes")).toBeUndefined();
    expect(walkEnd(graph, walkStart(graph)!, library)).toBeUndefined();
  });
});

describe("masterChartOf", () => {
  it("gives the nodes by layer, the edges with their labels and the tabs that the chart reaches", () => {
    const nodes: ChartNode[] = [
      { id: "s", kind: "signal", text: "A signal.", next: "q" },
      { id: "q", kind: "question", text: "A question?", sources: ["pd"], answers: [{ label: "Yes", next: "g" }, { label: "No", next: "g" }] },
      { id: "g", kind: "goto", text: "Go.", tab: "t" },
    ];
    const tabs: Tab[] = [{ id: "t", title: "A tab", keys: ["k"], phases: ["P0"] }, { id: "u", title: "Unused", keys: ["k"], phases: ["P1"] }];
    const chart = masterChartOf(nodes, tabs);
    expect(chart.nodes.map((placed) => [placed.node.id, placed.layer])).toEqual([["s", 0], ["q", 1], ["g", 2]]);
    expect(chart.edges).toEqual([{ from: "s", to: "q" }, { from: "q", to: "g", label: "Yes" }, { from: "q", to: "g", label: "No" }]);
    expect(chart.tabs.map((tab) => tab.id)).toEqual(["t"]);
  });
});

describe("strategy steps and the state of society", () => {
  const options = { phases: PHASES, on: ["k"], gaps: [] };
  const strategy = (id: string, text: string, reasoning?: string): Step => ({ ...step(id, "k", "P3", 1, []), do: text, ...(reasoning === undefined ? {} : { reasoning }) });

  it("accepts a step with no source when it gives its reasoning and has no number", () => {
    const codes = (list: Step[]) => checkSteps(list, sources, { ...options, phases: ["P3"] }).findings.map((finding) => finding.code);
    expect(codes([strategy("a", "Store seeds that you can grow again.", "Seeds give food again each year with no shop.")])).toEqual([]);
    expect(codes([strategy("a", "Boil water for 1 minute.", "Heat kills germs.")])).toEqual(["number-without-source"]);
    expect(codes([strategy("a", "Keep calm.", " ")])).toEqual(["empty-reasoning"]);
    expect(codes([strategy("a", "Keep calm.")])).toEqual(["no-source"]);
  });

  it("gives the steps of one state of society, and the steps for each state", () => {
    const all = step("all", "k", "P3", 1);
    const none: Step = { ...step("none", "k", "P3", 2), society: ["none"] };
    const works: Step = { ...step("works", "k", "P3", 3), society: ["works", "partly"] };
    const ids = (society?: "works" | "partly" | "none") => stepsFor([all, none, works], ["k"], ["P3"], society === undefined ? {} : { society }).map((s) => s.id);
    expect(ids()).toEqual(["all", "none", "works"]);
    expect(ids("none")).toEqual(["all", "none"]);
    expect(ids("partly")).toEqual(["all", "works"]);
  });
});
