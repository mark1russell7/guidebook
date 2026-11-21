// The offline bundles of the preparedness content: Kiwix ZIM files of open sources.
// The release, the size and the address of each file come from the Kiwix catalog feed, read on the date `BUNDLES_CHECKED`.
// The SHA-256 of each file comes later from the `.meta4` file of the release.

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
  { id: "wikipedia-medicine", title: "Wikipedia: medicine, with no pictures", bytes: 1_047_708_672, license: "cc-by-sa-4.0", level: "pocket", source: "wikipedia-en", version: "2026-10", url: `${ZIM}/wikipedia/wikipedia_en_medicine_nopic_2026-10.zim` },
  { id: "appropedia", title: "Appropedia: appropriate technology", bytes: 581_642_240, license: "cc-by-sa-4.0", level: "pocket", source: "appropedia", version: "2026-02", url: `${ZIM}/other/appropedia_en_all_maxi_2026-02.zim` },
  { id: "energypedia", title: "energypedia: energy access, with no pictures", bytes: 722_590_720, license: "cc-by-sa-4.0", level: "pocket", source: "energypedia", version: "2026-06", url: `${ZIM}/other/energypedia_en_all_nopic_2026-06.zim` },
  { id: "wikibooks", title: "Wikibooks, with no pictures", bytes: 3_544_612_864, license: "cc-by-sa-4.0", level: "pocket", source: "wikibooks-en", version: "2026-10", url: `${ZIM}/wikibooks/wikibooks_en_all_nopic_2026-10.zim` },
  { id: "wikipedia-mini", title: "Wikipedia: the introduction of each article", bytes: 14_386_799_616, license: "cc-by-sa-4.0", level: "pocket", source: "wikipedia-en", version: "2026-09", url: `${ZIM}/wikipedia/wikipedia_en_all_mini_2026-09.zim` },
  { id: "wikipedia-all", title: "Wikipedia: all articles, with no pictures", bytes: 52_690_707_456, license: "cc-by-sa-4.0", level: "shelf", source: "wikipedia-en", version: "2026-06", url: `${ZIM}/wikipedia/wikipedia_en_all_nopic_2026-06.zim` },
];
