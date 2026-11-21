// The live check of the offline bundles of the preparedness content.
// The script reads the Kiwix catalog feed and the `.meta4` file of each newer release, through `polite-crawler/api`.
// It writes each finding of the release gate, and the record of each newer release. An error gives the exit code 1.
//
//   node scripts/check-bundles.ts [the date YYYY-MM-DD]

import { fetchTransport, send } from "polite-crawler/api";
import { HostScheduler, realClock } from "polite-crawler/politeness";
import { checkReleases, kiwixFeedUrl, kiwixKeyOf, latestReleases, parseKiwixFeed, parseMeta4, withRelease } from "../packages/library/src/index.ts";
import { BUNDLES } from "../packages/preparedness/src/index.ts";

const pace = { scheduler: new HostScheduler(realClock, 1), now: realClock.now };
const transport = fetchTransport({ userAgent: "guidebook-bundle-check/0.1 (+https://github.com/mark1russell7/guidebook)" });

async function read(url: string, what: string): Promise<string> {
  const host = new URL(url).host;
  const answer = await send(pace, transport, { source: "Kiwix", host, minIntervalMs: 2000, what, exchange: { method: "GET", url, headers: {}, body: null } });
  if (answer.reply.status !== 200) throw new Error(`${what}: the answer is ${answer.reply.status} ${answer.reply.statusText}.`);
  return answer.reply.body;
}

const at = process.argv[2] ?? new Date().toLocaleDateString("en-CA");
const entries = parseKiwixFeed(await read(kiwixFeedUrl({ lang: "eng" }), "the English catalog feed"));
const findings = checkReleases(BUNDLES, entries, { at });
for (const finding of findings) console.log(`${finding.level} ${finding.code} ${finding.id}: ${finding.message}`);

const latest = latestReleases(entries);
for (const bundle of BUNDLES) {
  const file = bundle.url === undefined ? undefined : kiwixKeyOf(bundle.url);
  const entry = file === undefined ? undefined : latest.get(file.key);
  if (file === undefined || entry === undefined || entry.release <= file.release) continue;
  const next = withRelease(bundle, entry, parseMeta4(await read(entry.meta4, `the .meta4 file of ${entry.key} ${entry.release}`)));
  console.log(`The newer record of "${bundle.id}":\n${JSON.stringify(next)}`);
}

console.log(`${entries.length} entries in the feed, ${BUNDLES.length} bundles, ${findings.length} findings, on ${at}.`);
if (findings.some((finding) => finding.level === "error")) process.exitCode = 1;
