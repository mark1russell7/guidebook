// The sources of the preparedness content. This list is shared by all the add-ons of the content. Add a source at the end, and do not change an id.
// Each source is a page of a US federal agency, so its text is in the US public domain (17 U.S.C. 105).

import type { Source } from "@mark1russell7/guidebook";

/** The date of the last check of the sources against their pages. */
export const CHECKED = "2026-11-21";

const federal = (id: string, by: string, title: string, url: string): Source => ({ id, title, url, license: "us-public-domain", checked: CHECKED, by });

/** The sources of the content, each with its id, its title, its address and the date of its last check. */
export const SOURCES: readonly Source[] = [
  federal("ready-winter", "Ready.gov", "Winter Weather", "https://www.ready.gov/winter-weather"),
  federal("ready-hurricanes", "Ready.gov", "Hurricanes", "https://www.ready.gov/hurricanes"),
  federal("ready-floods", "Ready.gov", "Floods", "https://www.ready.gov/floods"),
  federal("ready-heat", "Ready.gov", "Extreme Heat", "https://www.ready.gov/heat"),
  federal("ready-tornadoes", "Ready.gov", "Tornadoes", "https://www.ready.gov/tornadoes"),
  federal("ready-earthquakes", "Ready.gov", "Earthquakes", "https://www.ready.gov/earthquakes"),
  federal("ready-fire", "Ready.gov", "Home Fires", "https://www.ready.gov/home-fires"),
  federal("ready-wildfires", "Ready.gov", "Wildfires", "https://www.ready.gov/wildfires"),
  federal("ready-hazmat", "Ready.gov", "Chemicals and Hazardous Materials Incidents", "https://www.ready.gov/hazmat"),
  federal("ready-radiation", "Ready.gov", "Radiation Emergencies", "https://www.ready.gov/radiation"),
  federal("ready-pandemic", "Ready.gov", "Pandemics", "https://www.ready.gov/pandemic"),
  federal("ready-evacuation", "Ready.gov", "Evacuation", "https://www.ready.gov/evacuation"),
  federal("ready-power", "Ready.gov", "Power Outages", "https://www.ready.gov/power-outages"),
  federal("ready-water", "Ready.gov", "Water", "https://www.ready.gov/water"),
  federal("ready-kit", "Ready.gov", "Build a Kit", "https://www.ready.gov/kit"),
  federal("ready-safety", "Ready.gov", "Safety Skills", "https://www.ready.gov/safety-skills"),
  federal("cdc-co", "CDC", "Carbon Monoxide Poisoning Basics", "https://www.cdc.gov/carbon-monoxide/about/index.html"),
  federal("cdc-water", "CDC", "How to Make Water Safe in an Emergency", "https://www.cdc.gov/water-emergency/about/index.html"),
  federal("fda-drugs", "FDA", "Safe Drug Use After a Natural Disaster", "https://www.fda.gov/drugs/emergency-preparedness-drugs/safe-drug-use-after-natural-disaster"),
];
