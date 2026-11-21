import { describe, expect, it } from "vitest";
import { DAY_MS, LICENSES, LICENSE_RULES, USES, assertGate, checkSources, checkUnits, creditOf, gate, isWebAddress, layerOf, permits, timeOf } from "./index.ts";
import type { CitedUnit, License, Source } from "./index.ts";

const source = (id: string, license: License, extra: Partial<Source> = {}): Source => ({
  id,
  title: `Title of ${id}`,
  url: `https://example.org/${id}`,
  license,
  checked: "2026-11-01",
  ...extra,
});

const unit = (id: string, use: CitedUnit["use"], src: string): CitedUnit => ({ id, use, text: `Text of ${id}.`, source: src });

describe("permits", () => {
  it("permits a summary and a fact of each real license", () => {
    for (const license of LICENSES) {
      if (license === "invented") continue;
      expect(permits(license, "summary")).toBe(true);
      expect(permits(license, "fact", { commercial: true })).toBe(true);
    }
  });

  it("follows the table for a quote and a bundle", () => {
    for (const license of LICENSES) {
      const rule = LICENSE_RULES[license];
      expect(permits(license, "quote")).toBe(rule.real && rule.quote);
      expect(permits(license, "bundle")).toBe(rule.real && rule.bundle);
    }
  });

  it("refuses a quote of a source with all rights reserved", () => {
    expect(permits("all-rights-reserved", "quote")).toBe(false);
    expect(permits("all-rights-reserved", "bundle")).toBe(false);
  });

  it("permits a non-commercial bundle only while the guidebook is not commercial", () => {
    expect(permits("cc-by-nc-sa-3.0", "bundle")).toBe(true);
    expect(permits("cc-by-nc-sa-3.0", "bundle", { commercial: true })).toBe(false);
    expect(permits("cc-by-nc-sa-3.0", "quote")).toBe(false);
  });

  it("refuses each use of an invented source outside a fixture", () => {
    for (const use of USES) {
      expect(permits("invented", use)).toBe(false);
      expect(permits("invented", use, { fixture: true })).toBe(true);
    }
  });
});

describe("checkSources", () => {
  it("gives no finding for good sources", () => {
    expect(checkSources([source("a", "us-public-domain"), source("b", "cc-by-sa-4.0")], { at: "2026-11-21" })).toEqual([]);
  });

  it("finds a duplicate id, an empty title, a bad address, a bad date and an unknown license", () => {
    const bad = [
      source("a", "cc0"),
      source("a", "cc0", { title: " " }),
      source("b", "cc0", { url: "ftp://example.org/b" }),
      source("c", "cc0", { url: "not an address" }),
      source("d", "cc0", { checked: "2026-02-30" }),
      source("e", "gpl" as License),
    ];
    const codes = checkSources(bad).map((finding) => `${finding.id}:${finding.code}`);
    expect(codes).toEqual(["a:duplicate-id", "a:empty-title", "b:bad-url", "c:bad-url", "d:bad-date", "e:unknown-license"]);
  });

  it("warns of an old check, and refuses a check after the date of the gate", () => {
    const findings = checkSources([source("old", "cc0", { checked: "2025-11-20" }), source("new", "cc0", { checked: "2026-12-01" })], { at: "2026-11-21" });
    expect(findings.map((finding) => [finding.id, finding.code, finding.level])).toEqual([
      ["old", "stale", "warning"],
      ["new", "checked-in-future", "error"],
    ]);
  });

  it("keeps a check of exactly the maximum age", () => {
    expect(checkSources([source("edge", "cc0", { checked: "2025-11-21" })], { at: "2026-11-21" })).toEqual([]);
    expect(checkSources([source("edge", "cc0", { checked: "2026-11-11" })], { at: "2026-11-21", maxAgeDays: 9 }).map((f) => f.code)).toEqual(["stale"]);
  });

  it("throws when the date of the gate is not a date", () => {
    expect(() => checkSources([], { at: "21 November" })).toThrow(RangeError);
  });
});

describe("checkUnits", () => {
  const sources = [source("pd", "us-public-domain"), source("arr", "all-rights-reserved"), source("fix", "invented")];

  it("permits a quote of a public-domain source and a summary of a source with all rights reserved", () => {
    expect(checkUnits([unit("u1", "quote", "pd"), unit("u2", "summary", "arr"), unit("u3", "fact", "arr")], sources)).toEqual([]);
  });

  it("refuses a quote of a source with all rights reserved", () => {
    expect(checkUnits([unit("u1", "quote", "arr")], sources).map((f) => f.code)).toEqual(["use-refused"]);
  });

  it("refuses an invented source outside a fixture", () => {
    expect(checkUnits([unit("u1", "summary", "fix")], sources).map((f) => f.code)).toEqual(["use-refused"]);
    expect(checkUnits([unit("u1", "summary", "fix")], sources, { fixture: true })).toEqual([]);
  });

  it("finds a missing source, a duplicate id and empty text", () => {
    const units = [unit("u1", "fact", "none"), unit("u2", "fact", "pd"), { ...unit("u2", "fact", "pd"), text: "" }];
    expect(checkUnits(units, sources).map((f) => `${f.id}:${f.code}`)).toEqual(["u1:missing-source", "u2:duplicate-id", "u2:empty-text"]);
  });
});

describe("gate", () => {
  it("passes with warnings only", () => {
    const result = gate([unit("u1", "quote", "old")], [source("old", "cc0", { checked: "2024-01-01" })], { at: "2026-11-21" });
    expect(result.ok).toBe(true);
    expect(result.findings.map((f) => f.code)).toEqual(["stale"]);
  });

  it("stops on an error, and assertGate names each error", () => {
    const units = [unit("u1", "quote", "arr")];
    const sources = [source("arr", "all-rights-reserved")];
    expect(gate(units, sources).ok).toBe(false);
    expect(() => assertGate(units, sources)).toThrow(/1 errors:\n- use-refused: .*"arr"/u);
    expect(() => assertGate([unit("u2", "summary", "arr")], sources)).not.toThrow();
  });
});

describe("layerOf and creditOf", () => {
  it("puts only a quote of a share-alike source in the share-alike layer", () => {
    const sa = source("wiki", "cc-by-sa-4.0");
    expect(layerOf(unit("u1", "quote", "wiki"), sa)).toBe("share-alike");
    expect(layerOf(unit("u2", "summary", "wiki"), sa)).toBe("main");
    expect(layerOf(unit("u3", "quote", "pd"), source("pd", "us-public-domain"))).toBe("main");
  });

  it("gives the name, the address, the license and the date of the check", () => {
    expect(creditOf(source("wiki", "cc-by-sa-4.0", { by: "Wikipedia" }))).toBe(
      "Wikipedia: Title of wiki. https://example.org/wiki. CC BY-SA 4.0 (https://creativecommons.org/licenses/by-sa/4.0/). Checked 2026-11-01.",
    );
    expect(creditOf(source("arr", "all-rights-reserved"))).toBe("Title of arr. https://example.org/arr. All rights reserved. Checked 2026-11-01.");
  });
});

describe("timeOf and isWebAddress", () => {
  it("gives the time of a real date and undefined for a false date", () => {
    expect(timeOf("2026-01-02")).toBe(Date.UTC(2026, 0, 2));
    expect(timeOf("2026-01-02")! - timeOf("2026-01-01")!).toBe(DAY_MS);
    expect(timeOf("2026-02-30")).toBeUndefined();
    expect(timeOf("2026-1-2")).toBeUndefined();
  });

  it("accepts http and https addresses with a host and refuses others", () => {
    expect(isWebAddress("https://www.ready.gov/kit")).toBe(true);
    expect(isWebAddress("http://example.org:8080/a?b#c")).toBe(true);
    expect(isWebAddress("ftp://example.org")).toBe(false);
    expect(isWebAddress("https://exa mple.org")).toBe(false);
  });
});
