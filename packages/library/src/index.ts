// The library add-on of the guidebook: a catalog of offline bundles, the copies of each bundle on media, and their gaps.
// The add-on names no topic: the levels, the places and the media are input data of the caller.

export { MEDIUM_KINDS } from "./records.ts";
export type { Bundle, Copy, CopyRule, MediumKind } from "./records.ts";
export { LIBRARY_CODES, checkCatalog, checkCopies } from "./check.ts";
export type { CatalogOptions, CopiesOptions, LibraryCode, LibraryFinding } from "./check.ts";
export { GAP_CODES, bytesOf, checksDue, copyStates } from "./copies.ts";
export type { CopyState, CopyStates, CopyStatus, DueCheck, GapCode, GapFinding } from "./copies.ts";
