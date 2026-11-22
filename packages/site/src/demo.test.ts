import { describe, expect, it } from "vitest";
import { ALL_CASES, CUTS, CUT_OF_CASE, KEYS, KEY_TITLES, PHASES, citationOf, gateReport, matrixOf, planOf, stateOf } from "./demo.ts";

describe("the model of the demo", () => {
  it("gives a title to each key", () => {
    expect(KEYS.filter((key) => KEY_TITLES[key] === undefined)).toEqual([]);
    expect(Object.values(CUT_OF_CASE).filter((cut) => !(CUTS as readonly string[]).includes(cut))).toEqual([]);
  });

  it("gives a cell with a step or a mark for each key and phase", () => {
    const cells = matrixOf().flat();
    expect(cells).toHaveLength(KEYS.length * PHASES.length);
    expect(cells.filter((cell) => stateOf(cell) === "empty")).toEqual([]);
  });

  it("gives a plan in the sequence of the ladder, with no step two times", () => {
    const plan = planOf(["met.winter.storm", ...CUTS], ["P2", "ready", "P0"]);
    expect(plan.map((part) => part.phase)).toEqual(["ready", "P0", "P2"]);
    const ids = plan.flatMap((part) => part.steps.map((step) => step.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("shows the marked gap of a key only when the key has no step in the phase", () => {
    const [part] = planOf(["infra.power.outage", "energy.grid"], ["P0"]);
    expect(part?.gaps.map((gap) => gap.on)).toEqual(["infra.power.outage"]);
    expect(part?.steps.every((step) => step.on === "energy.grid")).toBe(true);
    expect(planOf(ALL_CASES, [])).toEqual([]);
  });

  it("gives a citation with a name, an address and a license for each source of a step", () => {
    const ids = new Set(matrixOf().flat().flatMap((cell) => cell.steps.flatMap((step) => step.sources)));
    for (const id of ids) {
      const citation = citationOf(id);
      expect(citation?.url, id).toMatch(/^https:\/\//u);
      expect(citation?.license, id).not.toBe("");
    }
    expect(citationOf("no-such-source")).toBeUndefined();
  });

  it("passes the gates at the date of the last read", () => {
    const report = gateReport(gateReport("2026-11-22").checked);
    expect(report.findings.filter((finding) => finding.level === "error")).toEqual([]);
    expect(report.filled).toBe(report.cells);
  });

  it("counts each cell of the horizons with no step as open, never as covered", () => {
    const report = gateReport("2026-11-22");
    expect(report.covered + report.open.length).toBe(report.horizonCells);
    expect(report.open.every((finding) => finding.level === "error")).toBe(true);
  });
});
