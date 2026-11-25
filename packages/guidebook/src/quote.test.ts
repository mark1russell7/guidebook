import { describe, expect, it } from "vitest";
import { QUOTE_CODES, checkQuotes, checkUnits, markChecked } from "./index.ts";
import type { CitedUnit, Source } from "./index.ts";

// The quotes and the texts are invented. They are not from a real source.
const text = "Page 4\n\nStore the water in a cool, dark place.\nChange the stored water every six months.\n";
const texts = new Map([["store", text]]);
const quote = (id: string, words: string, source = "store"): CitedUnit => ({ id, use: "quote", text: words, source });

describe("checkQuotes", () => {
  it("finds a quote across a line break, with curly quotes and another case, and gives its span", () => {
    const result = checkQuotes([quote("cool", "store the water in a cool,  dark place. Change"), quote("curly", "“Store the water”", "other")], new Map([["store", text], ["other", 'He said "store the water" one time.']]));
    expect(result.ok).toBe(true);
    expect(result.findings).toEqual([]);
    const span = result.checks[0]?.span;
    expect(result.checks[0]?.status).toBe("found");
    expect(span === undefined ? "" : text.slice(span.start, span.end)).toBe("Store the water in a cool, dark place.\nChange");
    expect(result.checks[1]?.status).toBe("found");
  });

  it("gives the error quote-not-found for a quote that the text does not hold", () => {
    const result = checkQuotes([quote("year", "Change the stored water every year.")], texts);
    expect(result.ok).toBe(false);
    expect(result.findings.map((finding) => [finding.level, finding.code, finding.id])).toEqual([["error", "quote-not-found", "year"]]);
    expect(result.checks).toEqual([{ unit: "year", source: "store", status: "not-found" }]);
  });

  it("gives the warning quote-no-read for a source with no text or with only white space", () => {
    const result = checkQuotes([quote("a", "Store the water", "absent"), quote("b", "Store the water", "blank")], new Map([["blank", " \n "]]));
    expect(result.ok).toBe(true);
    expect(result.findings.map((finding) => [finding.level, finding.code, finding.id])).toEqual([
      ["warning", "quote-no-read", "a"],
      ["warning", "quote-no-read", "b"],
    ]);
    expect(result.checks.map((check) => check.status)).toEqual(["no-read", "no-read"]);
  });

  it("examines only the quotes, and skips a unit from JSON with a bad shape", () => {
    const units = [{ id: "s", use: "summary", text: "Not in the text.", source: "store" }, null, { id: "n", use: "quote", text: 4, source: "store" }] as unknown as CitedUnit[];
    expect(checkQuotes(units, texts)).toEqual({ ok: true, findings: [], checks: [] });
  });

  it("has a code for each finding that it gives", () => {
    expect(QUOTE_CODES).toEqual(["quote-not-found", "quote-no-read"]);
  });
});

describe("markChecked", () => {
  it("sets the date checked only on the quotes that the check found", () => {
    const units: CitedUnit[] = [quote("found", "Store the water"), quote("missing", "Boil the water"), { id: "fact", use: "fact", text: "Store the water", source: "store" }];
    const result = checkQuotes(units, texts);
    const marked = markChecked(units, result.checks, "2026-11-24");
    expect(marked.map((unit) => unit.checked)).toEqual(["2026-11-24", undefined, undefined]);
    expect(units[0]?.checked).toBeUndefined();
  });

  it("throws a RangeError for a date that is not a real date", () => {
    expect(() => markChecked([], [], "2026-02-30")).toThrow(RangeError);
  });

  it("gives units that the source gate accepts, and the gate refuses a bad check date", () => {
    const source: Source = { id: "store", title: "Store", url: "https://example.org/store", license: "us-public-domain", checked: "2026-11-24" };
    const marked = markChecked([quote("found", "Store the water")], checkQuotes([quote("found", "Store the water")], texts).checks, "2026-11-24");
    expect(checkUnits(marked, [source])).toEqual([]);
    expect(checkUnits([{ ...quote("late", "Store the water"), checked: "2026-13-01" }], [source]).map((finding) => finding.code)).toEqual(["bad-date"]);
  });
});
