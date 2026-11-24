import { describe, expect, it } from "vitest";
import { DAY_MS, LICENSES, LICENSE_RULES, SOURCE_FIELDS, USES, assertGate, checkSources, checkUnits, creditOf, gate, isSha256, isWebAddress, layerOf, permits, timeOf } from "./index.ts";
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
  it("permits a summary and a fact of each real license that permits units", () => {
    for (const license of LICENSES) {
      if (license === "invented") continue;
      expect(permits(license, "summary")).toBe(LICENSE_RULES[license].units);
      expect(permits(license, "fact", { commercial: true })).toBe(LICENSE_RULES[license].units);
    }
  });

  it("refuses each use of a link-only source", () => {
    for (const use of USES) expect(permits("link-only", use)).toBe(false);
    const units = [unit("a", "summary", "store"), unit("b", "fact", "store"), unit("c", "quote", "store")];
    const findings = checkUnits(units, [source("store", "link-only", { note: "No AI ingestion (publisher, 2026-11-23)" })]);
    expect(findings.map((finding) => `${finding.code} ${finding.id}`)).toEqual(["use-refused a", "use-refused b", "use-refused c"]);
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

  it("examines the optional terms address, change date and hash of a source", () => {
    const hash = "ceea04ce1a7c13a95a170f3548ed3926ad6dd49599bd730fb58bc9c02711d16e";
    const good = source("good", "us-public-domain", { terms: "https://www.fema.gov/about/website-information#copyright", updated: "2026-10-30", sha256: hash });
    expect(checkSources([good], { at: "2026-11-21" })).toEqual([]);
    // A change on the day of the check is not after the check.
    expect(checkSources([source("day", "cc0", { updated: "2026-11-01" })], { at: "2026-11-21" })).toEqual([]);
    const bad = [
      source("terms", "cc0", { terms: "fema.gov/terms" }),
      source("form", "cc0", { updated: "20 November" }),
      source("late", "cc0", { updated: "2026-11-02" }),
      source("upper", "cc0", { sha256: hash.toUpperCase() }),
      source("short", "cc0", { sha256: hash.slice(1) }),
    ];
    expect([isSha256(hash), isSha256(hash.toUpperCase()), isSha256("")]).toEqual([true, false, false]);
    expect(checkSources(bad).map((finding) => `${finding.id}:${finding.code}`)).toEqual(["terms:bad-url", "form:bad-date", "late:updated-after-check", "upper:bad-sha256", "short:bad-sha256"]);
  });

  it("gives the error missing-field for each field of the option require that a source does not have", () => {
    const hash = "ceea04ce1a7c13a95a170f3548ed3926ad6dd49599bd730fb58bc9c02711d16e";
    const full = source("full", "cc0", { by: "Agency", terms: "https://example.org/terms", sha256: hash });
    const require = ["sha256", "by", "terms"] as const;
    expect(checkSources([full], { require })).toEqual([]);
    // Without the option, the fields stay optional.
    expect(checkSources([source("bare", "cc0")])).toEqual([]);
    const bare = checkSources([source("bare", "cc0", { by: " " })], { require });
    // The order of the findings is the order of SOURCE_FIELDS, not the order of the option.
    expect(bare.map((finding) => [finding.code, finding.message.match(/field "(\w+)"/u)?.[1]])).toEqual([["missing-field", "by"], ["missing-field", "terms"], ["missing-field", "sha256"]]);
    expect(checkSources([source("note", "cc0")], { require: ["note", "updated"] }).map((finding) => finding.code)).toEqual(["missing-field", "missing-field"]);
    expect(SOURCE_FIELDS).toEqual(["by", "note", "terms", "updated", "sha256"]);
    // A list from JSON can name a field that a source does not have.
    expect(() => checkSources([], { require: ["licence" as "by"] })).toThrow(RangeError);
  });

  it("accepts only addresses with https: when the option https is true", () => {
    const plain = source("plain", "cc0", { url: "http://example.org/plain" });
    const terms = source("terms", "cc0", { terms: "http://example.org/terms" });
    const upper = source("upper", "cc0", { url: "HTTPS://example.org/upper", terms: "https://example.org/terms" });
    expect(checkSources([plain, terms, upper])).toEqual([]);
    expect(checkSources([plain, terms, upper], { https: true }).map((finding) => `${finding.id}:${finding.code}`)).toEqual(["plain:bad-url", "terms:bad-url"]);
    // A bad address gives one finding, not a second one for the option.
    expect(checkSources([source("ftp", "cc0", { url: "ftp://example.org/ftp" })], { https: true }).map((finding) => finding.code)).toEqual(["bad-url"]);
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

describe("the gate with a source or a unit from JSON with a bad shape", () => {
  const bad: readonly unknown[] = [null, undefined, 0, "text", [], {}, true, Number.NaN];
  const good = source("a", "cc-by-4.0");

  it("does not throw for a bad value in place of a source, a unit, or each of their fields", () => {
    for (const value of bad) {
      expect(() => checkSources([value as Source])).not.toThrow();
      expect(() => checkUnits([value as CitedUnit], [good])).not.toThrow();
      expect(() => checkUnits([unit("u", "fact", "a")], [value as Source])).not.toThrow();
      for (const field of ["id", "title", "url", "license", "checked", "updated", "terms", "sha256"])
        expect(() => checkSources([{ ...good, [field]: value } as Source], { https: true, require: [...SOURCE_FIELDS] })).not.toThrow();
      for (const field of ["id", "use", "text", "source"])
        expect(() => checkUnits([{ ...unit("u", "fact", "a"), [field]: value } as CitedUnit], [good])).not.toThrow();
    }
  });

  it("gives an error for a field of a wrong type", () => {
    const codes = (findings: readonly { readonly code: string }[]): string[] => findings.map((finding) => finding.code);
    expect(codes(checkSources([{ ...good, title: 5 } as unknown as Source]))).toEqual(["empty-title"]);
    expect(codes(checkSources([{ ...good, url: 5 } as unknown as Source]))).toEqual(["bad-url"]);
    expect(codes(checkSources([{ ...good, checked: 20261101 } as unknown as Source]))).toEqual(["bad-date"]);
    expect(codes(checkSources([{ ...good, updated: null } as unknown as Source]))).toEqual(["bad-date"]);
    expect(codes(checkSources([{ ...good, sha256: 5 } as unknown as Source]))).toEqual(["bad-sha256"]);
    expect(codes(checkUnits([{ ...unit("u", "fact", "a"), text: null } as unknown as CitedUnit], [good]))).toEqual(["empty-text"]);
    expect(codes(checkUnits([{ ...unit("u", "fact", "a"), use: "poem" } as unknown as CitedUnit], [good]))).toEqual(["use-refused"]);
    // A source that is not a record has no title, address, license or check date.
    expect(codes(checkSources([null as unknown as Source]))).toEqual(["empty-title", "bad-url", "unknown-license", "bad-date"]);
  });
});
