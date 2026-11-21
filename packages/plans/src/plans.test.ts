import { describe, expect, it } from "vitest";
import type { Source } from "@mark1russell7/guidebook";
import { LADDER, PHASES, PHASE_BOUNDS, checkSteps, phaseIn, phaseOf, phasesOf, planMatrix, stepsFor } from "./index.ts";
import type { Ladder, Step } from "./index.ts";

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
