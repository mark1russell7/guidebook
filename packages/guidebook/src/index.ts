// The core of the guidebook: sources with their licenses, cited units of text, and the source gate.
// The core names no topic. Each topic is an add-on package that gives its own records.

export { LICENSES, LICENSE_RULES, USES, permits } from "./license.ts";
export type { Layer, License, LicenseRule, Use, UseContext } from "./license.ts";
export { creditOf } from "./source.ts";
export type { CitedUnit, IsoDate, Source, SourceId, UnitUse } from "./source.ts";
export { DAY_MS, FINDING_CODES, assertGate, checkSources, checkUnits, gate, isWebAddress, layerOf, resultOf, throwOnErrors, timeOf } from "./gate.ts";
export type { Finding, FindingCode, GateOptions, GateResult } from "./gate.ts";
