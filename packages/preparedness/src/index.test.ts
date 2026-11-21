import { fileURLToPath } from "node:url";
import { checkSources } from "@mark1russell7/guidebook";
import { PHASES, checkSteps, planMatrix, stepsFor } from "@mark1russell7/guidebook-plans";
import { Linter, loadConfig } from "@mark1russell7/ste-lint";
import { describe, expect, it } from "vitest";
import { CASES, CUTS, GAPS, NEEDS, SOURCES, STEPS } from "./index.ts";

const KEYS = [...CASES, ...CUTS];
const AT = "2026-11-21";
const FULL = ["ready", "warned", "P0", "P1", "P2", "P3"] as const;

describe("the source gate", () => {
  it("finds no error and no warning in the sources", () => {
    expect(checkSources(SOURCES, { at: AT })).toEqual([]);
  });

  it("gives each source a public-domain license and uses each source", () => {
    expect(SOURCES.every((source) => source.license === "us-public-domain")).toBe(true);
    const cited = new Set(STEPS.flatMap((step) => step.sources));
    expect(SOURCES.map((source) => source.id).filter((id) => !cited.has(id))).toEqual([]);
  });
});

describe("the step gate", () => {
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
    for (const key of CASES) {
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
    for (const key of CASES) {
      const texts = stepsFor(STEPS, [key, ...CUTS], PHASES).map((step) => step.do);
      expect(texts.filter((text, index) => texts.indexOf(text) !== index), key).toEqual([]);
    }
  });
});

describe("the words of the steps", () => {
  const root = fileURLToPath(new URL("../../..", import.meta.url));
  const linter = new Linter(loadConfig({ cwd: root }));
  const texts = [...STEPS.map((step) => [step.id, step.do] as const), ...GAPS.map((gap) => [`${gap.on}.${gap.phase}`, gap.why] as const)];

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
