import { describe, expect, it } from "vitest";
import { copiesLayer, keepChance, planCopies } from "./index.ts";
import type { CopiesInput, CopyRule } from "./index.ts";

const rule: CopyRule = { level: "pocket", copies: 2, kinds: 2, places: 2, everyDays: 365 };

const input: CopiesInput = {
  rule,
  bytes: 20e9,
  currency: "USD",
  offers: [
    { id: "flash-64", kind: "flash", bytes: 64e9, price: 12, lifeYears: 2, yearlyLoss: 0.1, source: "An invented rate for the test" },
    { id: "hdd-1t", kind: "hdd", bytes: 1e12, price: 60, lifeYears: 5, yearlyLoss: 0.02, source: "An invented rate for the test" },
    { id: "flash-16", kind: "flash", bytes: 16e9, price: 5, lifeYears: 2, yearlyLoss: 0.1, source: "Too small for the level" },
  ],
  places: [
    { id: "home", yearlyLoss: 0.01, source: "An invented rate for the test" },
    { id: "box", yearlyLoss: 0.001, source: "An invented rate for the test", monthly: 3 },
  ],
};

describe("keepChance", () => {
  it("scales a yearly loss to a period of days", () => {
    expect(keepChance(0.1, 365)).toBeCloseTo(0.9, 12);
    expect(keepChance(0.19, 730 / 2)).toBeCloseTo(0.81, 12);
    expect(() => keepChance(1.5, 1)).toThrow(RangeError);
  });
});

describe("copiesLayer", () => {
  const { layer, base } = copiesLayer(input);

  it("gives the required slots of the rule and one optional slot, with each offer that holds the bytes at each place", () => {
    expect(layer.slots.map((slot) => [slot.id, slot.optional])).toEqual([["copy-1", false], ["copy-2", false], ["copy-3", true]]);
    expect(layer.slots[0]?.candidates.map((candidate) => candidate.key)).toEqual(["flash-64@home", "flash-64@box", "hdd-1t@home", "hdd-1t@box"]);
    expect(base.parts[0]?.id).toBe("library:pocket");
  });

  it("throws a RangeError when no offer holds the bytes", () => {
    expect(() => copiesLayer({ ...input, bytes: 2e12 })).toThrow(RangeError);
  });
});

describe("planCopies", () => {
  const plan = planCopies(copiesLayer(input), rule, { today: "2026-11-21" });

  it("keeps only the plans with two places and two kinds", () => {
    expect(plan.front.length).toBeGreaterThan(0);
    for (const row of plan.front) {
      expect(row.shared.filter((id) => id.startsWith("place:")).length).toBeGreaterThanOrEqual(2);
      expect(row.shared.filter((id) => id.startsWith("medium:")).length).toBeGreaterThanOrEqual(2);
    }
    expect(plan.breaks.measure).toBeGreaterThan(0);
  });

  it("gives the exact chance that one copy or more can be read after one period", () => {
    const row = plan.front.find((r) => r.choice["copy-1"] === "flash-64@home" && r.choice["copy-2"] === "hdd-1t@box" && r.choice["copy-3"] === null);
    expect(row?.chance).toBeCloseTo(1 - (1 - 0.9 * 0.99) * (1 - 0.98 * 0.999), 12);
    expect(row?.cost).toBeCloseTo(12 / 24 + 60 / 60 + 3, 9);
  });
});
