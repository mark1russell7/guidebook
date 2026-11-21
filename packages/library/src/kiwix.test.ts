import { describe, expect, it } from "vitest";
import { checkReleases, kiwixFeedUrl, kiwixKeyOf, latestReleases, parseKiwixFeed, parseMeta4, withRelease } from "./index.ts";
import type { Bundle } from "./index.ts";

const ZIM = "https://lb.download.kiwix.org/zim/wikipedia";
const HASH = "718fadad40b3491be3fa8f95181a948e4d726f97a79a14e0ef1b90c6b2b03625";

const entry = (name: string, flavour: string, release: string, length: number, title = "A title"): string => `
  <entry>
    <id>urn:uuid:${name}-${release}</id>
    <title>${title}</title>
    <updated>${release}-10T00:00:00Z</updated>
    <name>${name}</name>
    <flavour>${flavour}</flavour>
    <dc:issued>${release}-10T00:00:00Z</dc:issued>
    <link type="text/html" href="https://browse.library.kiwix.org/content/${name}_${flavour}_${release}" />
    <link rel="http://opds-spec.org/acquisition/open-access" type="application/x-zim" href="${ZIM}/${name}_${flavour}_${release}.zim.meta4" length="${length}" />
  </entry>`;

const FEED = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/terms/">
  <id>feed</id>
  ${entry("wikipedia_en_medicine", "nopic", "2026-10", 1_047_708_672, "Medicine &amp; health")}
  ${entry("wikipedia_en_medicine", "nopic", "2026-04", 1_000_000_512)}
  ${entry("wikipedia_en_all", "mini", "2026-09", 14_386_799_616)}
  <entry><id>no-link</id><name>x</name></entry>
</feed>`;

const META4 = `<?xml version="1.0" encoding="UTF-8"?>
<metalink xmlns="urn:ietf:params:xml:ns:metalink">
  <file name="wikipedia_en_medicine_nopic_2026-10.zim">
    <size>1047708415</size>
    <hash type="md5">80af4a213f2bc2b3d9004ce67399f930</hash>
    <hash type="sha-256">${HASH.toUpperCase()}</hash>
    <url location="de" priority="1">https://mirror.example.org/wikipedia_en_medicine_nopic_2026-10.zim</url>
  </file>
</metalink>`;

const bundle = (release: string, extra: Partial<Bundle> = {}): Bundle => ({
  id: "med",
  title: "Medicine",
  bytes: 1,
  license: "cc-by-sa-4.0",
  level: "pocket",
  source: "wiki",
  version: release,
  url: `https://download.kiwix.org/zim/wikipedia/wikipedia_en_medicine_nopic_${release}.zim`,
  ...extra,
});

describe("kiwixFeedUrl", () => {
  it("gives the address of the feed with the query", () => {
    expect(kiwixFeedUrl({ lang: "eng", name: "wikipedia_en_medicine" })).toBe("https://opds.library.kiwix.org/catalog/v2/entries?lang=eng&name=wikipedia_en_medicine&count=2000");
  });
});

describe("kiwixKeyOf", () => {
  it("gives the key and the release of a ZIM file, a .meta4 file or an address", () => {
    expect(kiwixKeyOf("wikipedia_en_all_mini_2026-09.zim")).toEqual({ key: "wikipedia_en_all_mini", release: "2026-09" });
    expect(kiwixKeyOf(`${ZIM}/diy.stackexchange.com_en_all_2026-10.zim.meta4`)).toEqual({ key: "diy.stackexchange.com_en_all", release: "2026-10" });
    expect(kiwixKeyOf("https://example.org/book.pdf")).toBeUndefined();
  });
});

describe("parseKiwixFeed", () => {
  const entries = parseKiwixFeed(FEED);

  it("gives each entry with a .meta4 link, and decodes the references", () => {
    expect(entries).toHaveLength(3);
    expect(entries[0]).toEqual({
      key: "wikipedia_en_medicine_nopic",
      name: "wikipedia_en_medicine",
      flavour: "nopic",
      title: "Medicine & health",
      release: "2026-10",
      issued: "2026-10-10",
      meta4: `${ZIM}/wikipedia_en_medicine_nopic_2026-10.zim.meta4`,
      approxBytes: 1_047_708_672,
    });
  });

  it("keeps the newest release of each key", () => {
    const latest = latestReleases(entries);
    expect([...latest.keys()]).toEqual(["wikipedia_en_medicine_nopic", "wikipedia_en_all_mini"]);
    expect(latest.get("wikipedia_en_medicine_nopic")?.release).toBe("2026-10");
  });
});

describe("parseMeta4", () => {
  it("gives the exact size and the SHA-256 in lower case", () => {
    expect(parseMeta4(META4)).toEqual({ file: "wikipedia_en_medicine_nopic_2026-10.zim", bytes: 1_047_708_415, sha256: HASH });
  });

  it("throws a RangeError when the SHA-256 is missing", () => {
    expect(() => parseMeta4(META4.replace(/<hash type="sha-256">[^<]+<\/hash>/u, ""))).toThrow(RangeError);
  });
});

describe("withRelease", () => {
  const [latest] = parseKiwixFeed(FEED);

  it("gives the bundle the release, the exact size, the hash and the ZIM address", () => {
    expect(withRelease(bundle("2026-04"), latest!, parseMeta4(META4))).toMatchObject({
      version: "2026-10",
      bytes: 1_047_708_415,
      sha256: HASH,
      url: `${ZIM}/wikipedia_en_medicine_nopic_2026-10.zim`,
    });
  });

  it("throws a RangeError when the .meta4 file is for a different release", () => {
    expect(() => withRelease(bundle("2026-04"), latest!, { ...parseMeta4(META4), file: "wikipedia_en_medicine_nopic_2026-04.zim" })).toThrow(RangeError);
  });
});

describe("checkReleases", () => {
  const entries = parseKiwixFeed(FEED);
  const codes = (bundles: Bundle[], at = "2026-11-21"): string[] => checkReleases(bundles, entries, { at }).map((finding) => `${finding.level} ${finding.code}`);

  it("gives no finding for the newest release with a hash", () => {
    expect(codes([bundle("2026-10", { sha256: HASH })])).toEqual([]);
  });

  it("gives a warning for a newer release, and an error when the bundle is older than a year", () => {
    expect(codes([bundle("2026-04", { sha256: HASH })])).toEqual(["warning newer-release"]);
    expect(codes([bundle("2026-04", { sha256: HASH })], "2027-06-01")).toEqual(["error old-release"]);
  });

  it("finds a file that the feed does not have, an address that is not Kiwix, and a missing hash", () => {
    const gone = bundle("2026-10", { url: "https://download.kiwix.org/zim/other/gone_en_all_2026-10.zim", sha256: HASH });
    const other = bundle("2026-10", { url: "https://example.org/book.pdf", sha256: HASH });
    expect(codes([gone, other, bundle("2026-10")])).toEqual(["error not-in-feed", "warning not-kiwix", "warning no-hash"]);
  });
});
