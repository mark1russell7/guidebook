// The items that each step uses, by the id of the step. Each item is the id of a product of the supply catalog of
// `@mark1russell7/market/supplies`. A planner joins a step to the stock and the buy list with these ids.
//
// A step gets an item only when its action needs that item. The weather radio receives only the stations of the weather
// service. A step that names an FM or AM radio, or a local, a public or an emergency station, gets the AM and FM radio.
// A step that names shortwave gets no radio: the catalog has no product for it.

const WEATHER_RADIO = "communication.noaa-radio";
const AM_FM_RADIO = "communication.am-fm-radio";
const TWO_WAY_RADIOS = "communication.frs-radio-pair";
const FLASHLIGHT = "light.flashlight";
const CELLS = "power.aa-alkaline";
const FIRST_AID_KIT = "first-aid.kit";
const SLEEPING_BAG = "heat.sleeping-bag";

/** The items that each step uses, by the `id` of the step. A test holds that each key is the id of a step. */
export const STEP_USES: Readonly<Record<string, readonly string[]>> = {
  "met.winter.storm.ready.supplies": [WEATHER_RADIO, FLASHLIGHT, CELLS],
  "met.winter.storm.ready.car-kit": [FLASHLIGHT],
  "met.flood.ready.alerts": [WEATHER_RADIO],
  "met.tornado.ready.alerts": [WEATHER_RADIO],
  "met.tornado.P1.listen": [WEATHER_RADIO],
  "cbrne.hazardous-materials.warned.listen": [WEATHER_RADIO],
  "cbrne.radiological.ready.radio": [WEATHER_RADIO, CELLS],
  "cbrne.radiological.warned.inside": [WEATHER_RADIO],
  "health.medical-emergency.ready.first-aid-kit": [FIRST_AID_KIT],
  "civic.ai-collapse.ready.radio": [WEATHER_RADIO, CELLS],
  "civic.ai-collapse.P0.shelter": [WEATHER_RADIO],
  "civic.ai-collapse.P1.radio-info": [AM_FM_RADIO],
  "infra.power.grid-collapse.ready.radio": [AM_FM_RADIO, CELLS],
  "cyber.infrastructure-attack.ready.radio": [AM_FM_RADIO, CELLS],
  "security.civil-unrest.P0.go-in": [AM_FM_RADIO],
  "security.armed-conflict.warned.alarm-radio": [AM_FM_RADIO],
  "infra.power.grid-collapse.ready.warm": [SLEEPING_BAG],
  "cbrne.nuclear-detonation.ready.alerts-and-radio": [WEATHER_RADIO, CELLS],
  "security.nuclear-war.ready.radio": [WEATHER_RADIO, CELLS],
  "security.nuclear-war.warned.public-warning": [WEATHER_RADIO],
  "cbrne.emp.ready.spare-batteries": [CELLS],
  "cbrne.emp.ready.battery-radio": [AM_FM_RADIO, CELLS],
  "cbrne.emp.P1.listen-radio": [AM_FM_RADIO],
  "security.armed-conflict.ready.radio": [WEATHER_RADIO, CELLS],
  "power.grid.ready.flashlights": [FLASHLIGHT],
  "phone.network.ready.radio": [WEATHER_RADIO, CELLS],
  "phone.network.ready.radios": [TWO_WAY_RADIOS],
  "phone.network.P4.two-way-radio": [TWO_WAY_RADIOS],
  "phone.network.P2.news": [AM_FM_RADIO],
  "network.access.ready.radio": [WEATHER_RADIO, CELLS],
  "network.access.P1.news": [AM_FM_RADIO],
  "care.local.P3.medic": [FIRST_AID_KIT],
  "fuel.retail.ready.warm-layers": [SLEEPING_BAG],
  "home.dwelling.P1.radio": [WEATHER_RADIO, CELLS],
};
