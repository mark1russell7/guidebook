// The offline bundles of the preparedness content: Kiwix ZIM files of open sources.
// The release and the address of each file come from the Kiwix catalog feed, read on the date `BUNDLES_CHECKED`.
// The exact size and the SHA-256 of each file come from the `.meta4` file of its release.
// The weekly workflow `bundles.yml` starts `scripts/check-bundles.ts`, which compares the bundles to the live feed.

import type { Bundle } from "@mark1russell7/guidebook-library";

/** The date of the last read of the Kiwix catalog feed. */
export const BUNDLES_CHECKED = "2026-11-21";

/**
 * The levels of the bundles.
 * - `pocket`: the small bundles. Together they fit on one flash drive of 32 GB.
 * - `shelf`: the large bundles. Each needs a drive of 64 GB or more.
 */
export const BUNDLE_LEVELS = ["pocket", "shelf"] as const;

const ZIM = "https://download.kiwix.org/zim";

/** The bundles of the content, in the sequence of their level, and then of their size. */
export const BUNDLES: readonly Bundle[] = [
  { id: "wikipedia-medicine", title: "Wikipedia: medicine, with no pictures", bytes: 1_047_708_415, license: "cc-by-sa-4.0", level: "pocket", source: "wikipedia-en", version: "2026-10", sha256: "718fadad40b3491be3fa8f95181a948e4d726f97a79a14e0ef1b90c6b2b03625", url: `${ZIM}/wikipedia/wikipedia_en_medicine_nopic_2026-10.zim` },
  { id: "appropedia", title: "Appropedia: appropriate technology", bytes: 581_641_351, license: "cc-by-sa-4.0", level: "pocket", source: "appropedia", version: "2026-02", sha256: "dcf200ba723c27397e1c9a2e4891ff91fa13993df1fa285315190d8525a53469", url: `${ZIM}/other/appropedia_en_all_maxi_2026-02.zim` },
  { id: "energypedia", title: "energypedia: energy access, with no pictures", bytes: 722_590_405, license: "cc-by-sa-4.0", level: "pocket", source: "energypedia", version: "2026-06", sha256: "f1b2cf0afde2927eab9acd2b6365144eae35986894c2a8eac7071045fd01d295", url: `${ZIM}/other/energypedia_en_all_nopic_2026-06.zim` },
  { id: "wikibooks", title: "Wikibooks, with no pictures", bytes: 3_544_612_812, license: "cc-by-sa-4.0", level: "pocket", source: "wikibooks-en", version: "2026-10", sha256: "bda3410005656daeb523c81774e151b750cd5a8828f081ded0848cd7fdccba7c", url: `${ZIM}/wikibooks/wikibooks_en_all_nopic_2026-10.zim` },
  { id: "wikipedia-mini", title: "Wikipedia: the introduction of each article", bytes: 14_386_799_064, license: "cc-by-sa-4.0", level: "pocket", source: "wikipedia-en", version: "2026-09", sha256: "350d8956ee3d7abe2839c464c3a983f93d6934a16c7f04b10715b49439dfd349", url: `${ZIM}/wikipedia/wikipedia_en_all_mini_2026-09.zim` },
  { id: "wikipedia-all", title: "Wikipedia: all articles, with no pictures", bytes: 52_690_706_555, license: "cc-by-sa-4.0", level: "shelf", source: "wikipedia-en", version: "2026-06", sha256: "441a56d9e05b2d98f8ae9acb7986a513ed47904d73852c92dc6b7d50baa122e5", url: `${ZIM}/wikipedia/wikipedia_en_all_nopic_2026-06.zim` },
];
