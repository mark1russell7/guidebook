// The live quote check of the preparedness content.
// The script reads each source of a quote through the page store of `polite-crawler`, with one request at a time for each host.
// The crawler reads the text layer of a PDF. A page that asks not to be AI input gives no text, so its quotes get no read.
// The script writes each finding of `checkQuotes` and each quote that it found, with the new date `checked`.
// An error gives the exit code 1.
//
//   node scripts/check-quotes.ts [the date YYYY-MM-DD]
//
// The variable QUOTE_STORE sets the folder of the page store. The default is a new folder in the temporary folder.

import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { openCrawler } from "polite-crawler";
import { checkQuotes, markChecked } from "../packages/guidebook/src/index.ts";
import type { SourceId } from "../packages/guidebook/src/index.ts";
import { MEDIA_UNITS, SOURCES, TAB_UNITS, TOPIC_UNITS } from "../packages/preparedness/src/index.ts";

const at = process.argv[2] ?? new Date().toLocaleDateString("en-CA");
const units = [...MEDIA_UNITS, ...TOPIC_UNITS, ...TAB_UNITS];
const cited = new Set(units.filter((unit) => unit.use === "quote").map((unit) => unit.source));
const dir = process.env["QUOTE_STORE"] ?? mkdtempSync(join(tmpdir(), "quote-store-"));
const crawler = openCrawler({ dir, userAgent: "guidebook-quote-check/0.1 (+https://github.com/mark1russell7/guidebook)", renderer: false });

const texts = new Map<SourceId, string>();
try {
  for (const source of SOURCES.filter((item) => cited.has(item.id))) {
    try {
      const page = await crawler.fetch(source.url, { maxAge: "24h" });
      if (page.outcome !== "ok" || page.doc === null) {
        console.log(`no read ${source.id}: the fetch gave "${page.outcome}" (${page.status}). ${page.note ?? ""}`.trim());
        continue;
      }
      const head = await crawler.read(page.doc, { length: 1 });
      const read = await crawler.read(page.doc, { length: Math.max(head.total, 1) });
      if (read.held_back) console.log(`no read ${source.id}: the page asks not to be AI input.`);
      else texts.set(source.id, read.text);
    } catch (error) {
      console.log(`no read ${source.id}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
} finally {
  await crawler.close();
}

const result = checkQuotes(units, texts);
for (const finding of result.findings) console.log(`${finding.level} ${finding.code} ${finding.id}: ${finding.message}`);
const found = new Set(result.checks.filter((check) => check.status === "found").map((check) => check.unit));
for (const unit of markChecked(units, result.checks, at)) {
  if (found.has(unit.id)) console.log(`The checked record of "${unit.id}":\n${JSON.stringify(unit)}`);
}

console.log(`${result.checks.length} quotes, ${cited.size} sources, ${texts.size} read, ${found.size} found, ${result.findings.length} findings, on ${at}.`);
if (!result.ok) process.exitCode = 1;
