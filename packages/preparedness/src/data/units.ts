// The cited units of the topics. Each unit id starts with the id of its topic and a dot.
// The text of each unit is in the words of the guidebook: a summary or a fact, not a quote.
// A Wikipedia locator names the article, the section and the revision that the summary reads.

import type { CitedUnit } from "@mark1russell7/guidebook";

const wiki = (article: string, section: string, revision: number): string => `${article}, section ${section} (revision ${revision})`;

/** The units of the water topics. */
const WATER: readonly CitedUnit[] = [
  {
    id: "water.sources.home",
    use: "summary",
    text: "Look for water in the home first: ice cubes, the hot water tank and the pipes. Water that flows in a river or lake is better than still water. Do not use water with floating material, a dark color or a bad odor. Treat the water of each source.",
    source: "epa-water-disinfect",
    locator: "Additional Water Guidance",
  },
  {
    id: "water.sources.heating",
    use: "fact",
    text: "Do not drink, cook or wash with the water of the radiators or the boiler of a home heating system.",
    source: "cdc-water",
    locator: "Overview",
  },
  {
    id: "water.sources.chemicals",
    use: "fact",
    text: "Boiling and disinfection cannot make water with fuel, toxic chemicals or radioactive material safe. Use bottled water or a different source.",
    source: "cdc-water",
    locator: "Water with fuel or toxic chemicals in it",
  },
  {
    id: "water.sources.rain",
    use: "summary",
    text: "Rain is clean when it falls. But a roof and a tank add bird and animal feces, dust and other pollution. When you send the first flow of each rain to waste, much of this pollution goes with it. Treat roof water before you drink it.",
    source: "wikipedia-en",
    locator: wiki("Rainwater harvesting", "Quality of water", 1385816262),
  },
  {
    id: "water.boil.steps",
    use: "summary",
    text: "Let cloudy water settle, or filter it through a clean cloth, a paper towel or a coffee filter. Bring the clear water to a rolling boil for 1 minute, or for 3 minutes above 6,500 feet. Let it cool. Store it in clean containers with tight covers.",
    source: "cdc-water",
    locator: "Boil, Steps for boiling water",
  },
  {
    id: "water.boil.best",
    use: "fact",
    text: "Boiling is the best way to kill germs in water. Chemical disinfectants do not kill the parasites Cryptosporidium and Giardia as well as boiling.",
    source: "cdc-water",
    locator: "Key points, and Disinfect",
  },
  {
    id: "water.boil.limits",
    use: "fact",
    text: "Boiling and disinfection do not remove heavy metals, salts and most other chemicals.",
    source: "epa-water-disinfect",
    locator: "The first paragraph",
  },
  {
    id: "water.boil.taste",
    use: "summary",
    text: "Boiled water tastes flat. Pour it from one clean container to another, then let it stand for a few hours. Or add a pinch of salt to each quart or liter.",
    source: "cdc-water",
    locator: "Boil, Making boiled water taste better",
  },
  {
    id: "water.disinfect.bleach",
    use: "fact",
    text: "Use regular, unscented chlorine bleach with 6% or 8.25% sodium hypochlorite. Add 2 drops to each quart or liter of water. To each gallon, add 8 drops of 6% bleach or 6 drops of 8.25% bleach. Use double the bleach for water that is cloudy, colored or very cold.",
    source: "epa-water-disinfect",
    locator: "The table of bleach amounts",
  },
  {
    id: "water.disinfect.wait",
    use: "summary",
    text: "Stir the water, then let it stand for 30 minutes. Then the water has a slight odor of chlorine. If it has no odor, add the same amount of bleach again and wait 15 more minutes.",
    source: "epa-water-disinfect",
    locator: "Disinfect water using household bleach",
  },
  {
    id: "water.disinfect.fresh",
    use: "fact",
    text: "Use fresh bleach, or bleach that stayed at room temperature for less than one year. Do not use scented or color-safe bleach, or bleach with added cleaners.",
    source: "epa-water-disinfect",
    locator: "Disinfect water using household bleach",
  },
  {
    id: "water.disinfect.iodine",
    use: "fact",
    text: "With no bleach, add 5 drops of 2% tincture of iodine to each quart or liter of water. Add 10 drops to cloudy or colored water. Let it stand for at least 30 minutes.",
    source: "epa-water-disinfect",
    locator: "Other Disinfection Methods, Common household iodine",
  },
  {
    id: "water.disinfect.iodine-who",
    use: "fact",
    text: "Do not give water with iodine to a person who is pregnant, has thyroid problems or is sensitive to iodine. Nobody drinks water with iodine for more than a few weeks at a time.",
    source: "cdc-water",
    locator: "Who should avoid water disinfected with iodine",
  },
  {
    id: "water.disinfect.crypto",
    use: "fact",
    text: "Iodine and chlorine tablets do not kill Cryptosporidium. Chlorine dioxide tablets kill it when you follow their instructions.",
    source: "cdc-water",
    locator: "If Cryptosporidium is in your water",
  },
  {
    id: "water.filter.pore",
    use: "fact",
    text: "A portable filter removes bacteria only with an absolute pore size of 0.3 micron or smaller. It removes parasites such as Giardia and Cryptosporidium only with 1 micron or smaller. A filter does not remove all germs.",
    source: "cdc-water",
    locator: "Filter, Using a filter",
  },
  {
    id: "water.filter.viruses",
    use: "summary",
    text: "Most portable pump filters remove bacteria and protozoa, but not most viruses. After the filter, disinfect the water with a chemical or with ultraviolet light.",
    source: "wikipedia-en",
    locator: wiki("Portable water purification", "Filtration", 1381126756),
  },
  {
    id: "water.filter.homemade",
    use: "summary",
    text: "A filter of sand and charcoal made on site is not reliable, and it removes few germs. Boil the water after such a filter.",
    source: "wikipedia-en",
    locator: wiki("Portable water purification", "Homemade water filters", 1381126756),
  },
  {
    id: "water.filter.slow-sand",
    use: "summary",
    text: "A slow sand filter cleans water with a biofilm. The biofilm grows on the fine sand in the first 10 to 20 days. It needs no chemicals and no electricity, but it needs clear water. A good filter removes 90% to 99% of the bacteria.",
    source: "wikipedia-en",
    locator: wiki("Slow sand filter", "Method of operation, and Features", 1386975984),
  },
  {
    id: "water.store.amount",
    use: "summary",
    text: "Store at least 1 gallon of water for each person for each day, for 3 days. If you can, store a supply for 2 weeks. Store more for a pregnant woman, a sick person, pets or a hot climate.",
    source: "cdc-water-store",
    locator: "How much emergency water to store, and Other considerations",
  },
  {
    id: "water.store.containers",
    use: "summary",
    text: "Use food-grade water containers. Or use a container with a tight top, made of a strong material that does not break, not glass. Do not use a container that held a toxic chemical, such as bleach or a pesticide.",
    source: "cdc-water-store",
    locator: "Choosing a container, and Don't use unsafe containers",
  },
  {
    id: "water.store.clean",
    use: "summary",
    text: "Wash the container with soap and rinse it. Mix 1 teaspoon of unscented bleach with 5% to 9% sodium hypochlorite in 1 quart of water. Shake it in the closed container, wait 30 seconds, pour it out and let the container dry.",
    source: "cdc-water-store",
    locator: "Cleaning the container before use, Steps to take",
  },
  {
    id: "water.store.keep",
    use: "summary",
    text: "Write \"drinking water\" and the date on each container. Replace the water every 6 months. Keep it at 50 °F to 70 °F, out of direct sunlight and away from gasoline and pesticides.",
    source: "cdc-water-store",
    locator: "Storing the water",
  },
  {
    id: "water.store.bleach",
    use: "fact",
    text: "Store a bottle of unscented liquid chlorine bleach with 5% to 9% sodium hypochlorite. Use it to disinfect water and to clean.",
    source: "cdc-water-store",
    locator: "Other considerations",
  },
];

/** The cited units of the topics. The units of the other areas come in later changes. */
export const TOPIC_UNITS: readonly CitedUnit[] = [...WATER];
