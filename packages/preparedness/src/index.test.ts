import { fileURLToPath } from "node:url";
import { checkSources, checkUnits, permits } from "@mark1russell7/guidebook";
import { bytesOf, checkCatalog, kiwixKeyOf } from "@mark1russell7/guidebook-library";
import { checkTopics, printOrder } from "@mark1russell7/guidebook-topics";
import { HORIZONS, PHASES, checkCoverage, checkSteps, planMatrix, stepsFor, chartOf, checkMasterChart, checkRules, masterChartOf } from "@mark1russell7/guidebook-plans";
import { Linter, loadConfig } from "@mark1russell7/ste-lint";
import { describe, expect, it } from "vitest";
import { AREAS, BUNDLES, BUNDLE_LEVELS, CASES, CUTS, GAPS, MEDIA_UNITS, MEDIUM_GAPS, MEDIUM_LOSSES, MASTER, MORE_CASES, NEEDS, OPEN_CELLS, RULES, SOURCES, START_TAB, STEPS, TABS, TOPICS } from "./index.ts";

const ALL_CASES = [...CASES, ...MORE_CASES];
const KEYS = [...ALL_CASES, ...CUTS];
const AT = "2026-11-22";
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
    const cited = new Set([...STEPS.flatMap((step) => step.sources), ...BUNDLES.map((bundle) => bundle.source), ...MEDIA_UNITS.map((unit) => unit.source)]);
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
    expect([...Object.keys(MEDIUM_LOSSES), ...MEDIUM_GAPS].sort()).toEqual(["flash", "hdd", "optical", "paper", "ssd"]);
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
    expect(checkTopics(TOPICS, { areas: AREAS, bundles: BUNDLES.map((bundle) => bundle.id), serves: NEEDS })).toEqual([]);
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
    ...MASTER.map((node) => [`chart.${node.id}`, node.text] as const),
    ...MASTER.flatMap((node) => (node.kind === "question" && node.reasoning !== undefined ? [[`chart.${node.id}.reasoning`, node.reasoning] as const] : [])),
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

describe("the master chart", () => {
  // The catalog of hazards in the stack model has the same 26 cases, and its cuts are the ids of CUTS.
  const cover = [...ALL_CASES, ...CUTS, ...NEEDS];
  const tabs = TABS.filter((tab) => tab.id !== START_TAB);

  it("finds no finding: each hazard and each part has a route, in 3 questions or fewer, on one page", () => {
    const result = checkMasterChart(MASTER, tabs, STEPS, SOURCES, { on: [...KEYS, ...NEEDS], cover, maxQuestions: 3, maxNodes: 20, maxEnds: 13 });
    expect(result.findings).toEqual([]);
  });

  it("asks for the state of society, with an answer for each state", () => {
    const states = MASTER.flatMap((node) => (node.kind === "question" ? node.answers.flatMap((answer) => answer.society ?? []) : []));
    expect([...new Set(states)].sort()).toEqual(["none", "partly", "works"]);
  });

  it("gives no answer that waits for officials", () => {
    const words = MASTER.flatMap((node) => [node.text, ...(node.kind === "question" ? [node.reasoning ?? "", ...node.answers.map((answer) => answer.label)] : [])]);
    expect(words.filter((text) => /(obey|wait for|listen to|follow).*(officials?|authorit|instructions)/i.test(text))).toEqual([]);
  });

  it("gives each tab of the binder a page budget, and sends the reader to each tab but the start", () => {
    expect(TABS.filter((tab) => tab.pages === undefined)).toEqual([]);
    expect(masterChartOf(MASTER, TABS).tabs.map((tab) => tab.id)).toEqual(tabs.map((tab) => tab.id));
  });
});
