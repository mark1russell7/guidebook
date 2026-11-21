import { describe, expect, it } from "vitest";
import type { Source } from "@mark1russell7/guidebook";
import { bytesOf, checkCatalog, checkCopies, checksDue, copyStates } from "./index.ts";
import type { Bundle, Copy, CopyRule } from "./index.ts";

const HASH_A = "a".repeat(64);
const HASH_B = "b".repeat(64);

const sources: Source[] = [
  { id: "wiki", title: "An encyclopedia", url: "https://example.org/wiki", license: "cc-by-sa-4.0", checked: "2026-11-01" },
  { id: "closed", title: "A closed book", url: "https://example.org/closed", license: "all-rights-reserved", checked: "2026-11-01" },
];

const bundles: Bundle[] = [
  { id: "med", title: "Medicine", bytes: 1_000, license: "cc-by-sa-4.0", level: "life", source: "wiki", version: "2026-10", sha256: HASH_A },
  { id: "all", title: "All articles", bytes: 50_000, license: "cc-by-sa-4.0", level: "comfort", source: "wiki" },
];

const rules: CopyRule[] = [
  { level: "life", copies: 3, kinds: 2, places: 2, everyDays: 365 },
  { level: "comfort", copies: 1, kinds: 1, places: 1, everyDays: 730 },
];

const copies: Copy[] = [
  { bundle: "med", medium: "usb-1", kind: "flash", place: "home", checked: "2026-06-01", version: "2026-10", sha256: HASH_A },
  { bundle: "med", medium: "hdd-1", kind: "hdd", place: "office", checked: "2026-06-01", version: "2026-04", sha256: HASH_B },
  { bundle: "med", medium: "usb-2", kind: "flash", place: "home", checked: "2025-01-01", version: "2026-10", sha256: HASH_A },
  { bundle: "all", medium: "hdd-1", kind: "hdd", place: "office", checked: "2026-06-01" },
];

describe("checkCatalog", () => {
  it("gives no finding for a correct catalog", () => {
    expect(checkCatalog(bundles, { sources, rules })).toEqual([]);
  });

  it("refuses a license that does not permit a bundle", () => {
    const closed: Bundle = { id: "book", title: "Book", bytes: 10, license: "all-rights-reserved", level: "life", source: "closed" };
    expect(checkCatalog([closed]).map((finding) => finding.code)).toEqual(["use-refused"]);
  });

  it("refuses a non-commercial license in a commercial guidebook only", () => {
    const nc: Bundle = { id: "repair", title: "Repair", bytes: 10, license: "cc-by-nc-sa-3.0", level: "comfort", source: "wiki" };
    expect(checkCatalog([nc])).toEqual([]);
    expect(checkCatalog([nc], { commercial: true }).map((finding) => finding.code)).toEqual(["use-refused"]);
  });

  it("finds each bad field", () => {
    const bad: Bundle[] = [
      { id: "x", title: " ", bytes: 0, license: "cc0", level: "none", source: "gone", sha256: "ABC", url: "ftp://example.org/x" },
      { id: "x", title: "Second", bytes: 1.5, license: "cc0", level: "life", source: "wiki" },
    ];
    const codes = checkCatalog(bad, { sources, rules }).map((finding) => finding.code);
    expect(codes).toEqual(["empty-title", "bad-bytes", "bad-sha256", "bad-url", "missing-source", "unknown-level", "duplicate-id", "bad-bytes"]);
  });
});

describe("checkCopies", () => {
  it("gives no finding for correct copies", () => {
    expect(checkCopies(copies, bundles, { at: "2026-11-21" })).toEqual([]);
  });

  it("finds an unknown bundle, a bad date, a future check and a second record of one copy", () => {
    const bad: Copy[] = [
      { bundle: "gone", medium: "usb-9", kind: "flash", place: "home", checked: "2026-02-30" },
      { bundle: "med", medium: "usb-1", kind: "flash", place: "home", checked: "2027-01-01" },
      { bundle: "med", medium: "usb-1", kind: "flash", place: "home", checked: "2026-01-01" },
    ];
    const codes = checkCopies(bad, bundles, { at: "2026-11-21" }).map((finding) => finding.code);
    expect(codes).toEqual(["missing-bundle", "bad-date", "checked-in-future", "duplicate-copy"]);
  });
});

describe("copyStates", () => {
  const { states, findings } = copyStates(bundles, copies, rules, { at: "2026-11-21" });

  it("counts a copy of an earlier release as good, and a copy with an old check as due", () => {
    const med = states.find((state) => state.bundle === "med");
    expect(med?.copies.map((item) => item.status)).toEqual(["good", "old", "due"]);
    expect(med?.good).toBe(2);
    expect(med?.kinds).toEqual(["flash", "hdd"]);
    expect(med?.places).toEqual(["home", "office"]);
    expect(med?.ok).toBe(false);
  });

  it("gives an error for too few good copies, and a warning for each copy to act on", () => {
    expect(findings.map((finding) => `${finding.level} ${finding.code} ${finding.id}`)).toEqual([
      "error few-copies med",
      "warning old-version med@hdd-1",
      "warning check-due med@usb-2",
    ]);
  });

  it("marks a copy with a hash that does not agree with its release as bad", () => {
    const corrupt: Copy = { bundle: "med", medium: "usb-3", kind: "flash", place: "car", checked: "2026-11-01", version: "2026-10", sha256: HASH_B };
    const result = copyStates(bundles, [...copies, corrupt], rules, { at: "2026-11-21" });
    expect(result.states[0]?.copies.at(-1)?.status).toBe("bad");
    expect(result.findings.some((finding) => finding.code === "bad-hash" && finding.id === "med@usb-3")).toBe(true);
  });

  it("gives the bundle an error when no rule has its level", () => {
    const result = copyStates(bundles, copies, rules.slice(0, 1), { at: "2026-11-21" });
    expect(result.findings.filter((finding) => finding.code === "no-rule")).toMatchObject([{ id: "all", level: "error" }]);
  });

  it("is ok when each rule holds", () => {
    const fresh = copies.map((copy) => ({ ...copy, checked: "2026-11-01" }));
    const extra: Copy = { bundle: "med", medium: "dvd-1", kind: "optical", place: "car", checked: "2026-11-01", version: "2026-10", sha256: HASH_A };
    const result = copyStates(bundles, [...fresh, extra], rules, { at: "2026-11-21" });
    expect(result.states.every((state) => state.ok)).toBe(true);
    expect(result.findings.filter((finding) => finding.level === "error")).toEqual([]);
  });
});

describe("checksDue", () => {
  it("gives the last good date of each copy, the first due first", () => {
    expect(checksDue(bundles, copies, rules, { at: "2026-11-21", withinDays: 200 })).toEqual([
      { bundle: "med", medium: "usb-2", place: "home", due: "2026-01-01" },
      { bundle: "med", medium: "hdd-1", place: "office", due: "2027-06-01" },
      { bundle: "med", medium: "usb-1", place: "home", due: "2027-06-01" },
    ]);
  });

  it("keeps the last day of a rule as a good day", () => {
    const result = copyStates(bundles, [{ ...copies[0]!, checked: "2025-11-21" }], rules, { at: "2026-11-21" });
    expect(result.states[0]?.copies[0]?.status).toBe("good");
  });
});

describe("bytesOf", () => {
  it("adds the size of each bundle one time", () => {
    expect(bytesOf(bundles, ["med", "all", "med"])).toBe(51_000);
    expect(() => bytesOf(bundles, ["gone"])).toThrow(RangeError);
  });
});
