// The offline bundles of the preparedness content: Kiwix ZIM files of open wikis and of 10 sites of Stack Exchange.
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
  { id: "stackexchange-sustainability", title: "Stack Exchange: Sustainable Living Q&A", bytes: 27_687_333, license: "cc-by-sa-4.0", level: "pocket", source: "stackexchange", version: "2026-10", sha256: "1516f252827b1409b7b55c1a44671e7e59b857bf2bb3732f3af62c996e40412f", url: `${ZIM}/stack_exchange/sustainability.stackexchange.com_en_all_2026-10.zim` },
  { id: "stackexchange-medicalsciences", title: "Stack Exchange: Medical Sciences Q&A", bytes: 60_659_941, license: "cc-by-sa-4.0", level: "pocket", source: "stackexchange", version: "2026-10", sha256: "14542ddfa6a9b354fa3e0468b3ff49ee2544defce175270209f4014d34f2feec", url: `${ZIM}/stack_exchange/medicalsciences.stackexchange.com_en_all_2026-10.zim` },
  { id: "stackexchange-ham", title: "Stack Exchange: Amateur Radio Q&A", bytes: 77_108_284, license: "cc-by-sa-4.0", level: "pocket", source: "stackexchange", version: "2026-10", sha256: "cb8a0cd7ae0078279ace1cd2a05e60505aa2494c29e82dac1942bf4cd54fcf9c", url: `${ZIM}/stack_exchange/ham.stackexchange.com_en_all_2026-10.zim` },
  { id: "stackexchange-woodworking", title: "Stack Exchange: Woodworking Q&A", bytes: 106_657_287, license: "cc-by-sa-4.0", level: "pocket", source: "stackexchange", version: "2026-10", sha256: "2ba925d1028f9442c153569701868b5b7abc6dbb2551c620680a92be9272b062", url: `${ZIM}/stack_exchange/woodworking.stackexchange.com_en_all_2026-10.zim` },
  { id: "stackexchange-outdoors", title: "Stack Exchange: The Great Outdoors Q&A", bytes: 141_820_374, license: "cc-by-sa-4.0", level: "pocket", source: "stackexchange", version: "2026-10", sha256: "73752057bd2253af6cf80c69caf0def158bcf378188f0fbc7ab8ed07bbbe9bc5", url: `${ZIM}/stack_exchange/outdoors.stackexchange.com_en_all_2026-10.zim` },
  { id: "stackexchange-cooking", title: "Stack Exchange: Cooking Q&A (Seasoned Advice)", bytes: 238_098_128, license: "cc-by-sa-4.0", level: "pocket", source: "stackexchange", version: "2026-10", sha256: "b5dc3a79b681be1afea32dd65e837c604e7dd7072f51622414a7a1d61fc52541", url: `${ZIM}/stack_exchange/cooking.stackexchange.com_en_all_2026-10.zim` },
  { id: "stackexchange-chemistry", title: "Stack Exchange: Chemistry Q&A", bytes: 419_958_885, license: "cc-by-sa-4.0", level: "pocket", source: "stackexchange", version: "2026-10", sha256: "29df06f911373044997678301ebe894ef10fdf15c8e83d39ab83f7ae91f65394", url: `${ZIM}/stack_exchange/chemistry.stackexchange.com_en_all_2026-10.zim` },
  { id: "stackexchange-gardening", title: "Stack Exchange: Gardening & Landscaping Q&A", bytes: 933_097_375, license: "cc-by-sa-4.0", level: "pocket", source: "stackexchange", version: "2026-10", sha256: "8079b77ba40d830c31cdfa0e3f43a100e9d9488d856b10ffb3aca4e829594e6e", url: `${ZIM}/stack_exchange/gardening.stackexchange.com_en_all_2026-10.zim` },
  { id: "stackexchange-diy", title: "Stack Exchange: Home Improvement Q&A", bytes: 2_086_024_326, license: "cc-by-sa-4.0", level: "pocket", source: "stackexchange", version: "2026-10", sha256: "df795a094698282164ddee422814f88bf84841a2413c89ac23401efd71f22731", url: `${ZIM}/stack_exchange/diy.stackexchange.com_en_all_2026-10.zim` },
  { id: "stackexchange-electronics", title: "Stack Exchange: Electronics Q&A", bytes: 4_261_397_539, license: "cc-by-sa-4.0", level: "pocket", source: "stackexchange", version: "2026-10", sha256: "b28e58b24ed55c602265729b34b0c6cc4e12228e6fe2f55df5b5e9eae169b266", url: `${ZIM}/stack_exchange/electronics.stackexchange.com_en_all_2026-10.zim` },
  { id: "wikipedia-mini", title: "Wikipedia: the introduction of each article", bytes: 14_386_799_064, license: "cc-by-sa-4.0", level: "pocket", source: "wikipedia-en", version: "2026-09", sha256: "350d8956ee3d7abe2839c464c3a983f93d6934a16c7f04b10715b49439dfd349", url: `${ZIM}/wikipedia/wikipedia_en_all_mini_2026-09.zim` },
  { id: "wikipedia-all", title: "Wikipedia: all articles, with no pictures", bytes: 52_690_706_555, license: "cc-by-sa-4.0", level: "shelf", source: "wikipedia-en", version: "2026-06", sha256: "441a56d9e05b2d98f8ae9acb7986a513ed47904d73852c92dc6b7d50baa122e5", url: `${ZIM}/wikipedia/wikipedia_en_all_nopic_2026-06.zim` },
];
