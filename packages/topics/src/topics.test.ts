import { describe, expect, it } from "vitest";
import { checkTopics, cyclesOf, prerequisitesOf, printOrder } from "./index.ts";
import type { Topic } from "./index.ts";

const topic = (id: string, requires: string[] = [], area = id.split(".")[0] ?? ""): Topic => ({ id, title: `Title of ${id}`, area, requires, units: [`${id}.u1`], bundles: [] });

const topics: Topic[] = [
  topic("b.second", ["a.first"]),
  topic("c.third", ["b.second", "a.first"]),
  topic("a.first"),
  topic("a.other"),
];

describe("checkTopics", () => {
  it("gives no finding for a correct graph", () => {
    expect(checkTopics(topics, { areas: ["a", "b", "c"], units: topics.flatMap((item) => item.units) })).toEqual([]);
  });

  it("finds each bad field", () => {
    const bad: Topic[] = [
      { id: "x", title: "", area: "z", requires: ["x", "gone"], units: ["u-gone"], bundles: ["b-gone"], serves: ["s-gone"], pages: 0 },
      { id: "x", title: "Second", area: "a", requires: [], units: [], bundles: [] },
    ];
    const codes = checkTopics(bad, { areas: ["a"], units: [], bundles: [], serves: [] }).map((finding) => finding.code);
    expect(codes).toEqual(["duplicate-id", "empty-title", "unknown-area", "self-require", "missing-topic", "missing-unit", "missing-bundle", "unknown-serve", "bad-pages", "no-content"]);
  });

  it("gives one finding for each cycle, with its topics", () => {
    const cyclic = [topic("a.one", ["a.two"]), topic("a.two", ["a.three"]), topic("a.three", ["a.one"]), topic("b.loop", ["b.back"]), topic("b.back", ["b.loop"])];
    const cycles = checkTopics(cyclic).filter((finding) => finding.code === "cycle");
    expect(cycles).toHaveLength(2);
    expect(cyclesOf(cyclic).map((cycle) => [...cycle].sort())).toEqual([["a.one", "a.three", "a.two"], ["b.back", "b.loop"]]);
  });

  it("does not count a self prerequisite as a cycle", () => {
    expect(cyclesOf([topic("a.self", ["a.self"])])).toEqual([]);
  });
});

describe("printOrder", () => {
  it("puts each topic after each topic that it requires, and keeps the input order in a level", () => {
    expect(printOrder(topics).map((item) => item.id)).toEqual(["a.first", "a.other", "b.second", "c.third"]);
  });

  it("does not change its input", () => {
    const before = JSON.stringify(topics);
    printOrder(topics);
    expect(JSON.stringify(topics)).toBe(before);
  });

  it("throws a RangeError on a cycle", () => {
    expect(() => printOrder([topic("a.one", ["a.two"]), topic("a.two", ["a.one"])])).toThrow(RangeError);
  });
});

describe("prerequisitesOf", () => {
  it("gives each topic to learn first, in the print order", () => {
    expect(prerequisitesOf(topics, "c.third").map((item) => item.id)).toEqual(["a.first", "b.second"]);
    expect(prerequisitesOf(topics, "a.first")).toEqual([]);
  });
});
