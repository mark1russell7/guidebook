// The topics add-on: a topic is one node of a graph of prerequisites. The add-on names no topic.

import { buildLeveledDAG, getAncestors } from "@mark1russell7/collections/dag";
import type { DAGNode } from "@mark1russell7/collections/dag";
import { stronglyConnectedComponents } from "@mark1russell7/collections/graph";
import type { Finding } from "@mark1russell7/guidebook";

/** A topic: a subject that a reader can learn, with the topics to learn first. */
export interface Topic {
  /** A stable id, with the area first, for example `water.boil`. */
  readonly id: string;
  readonly title: string;
  /** The area of the topic. The caller gives the list of the areas. */
  readonly area: string;
  /** The topics that a reader must know first. The graph of all `requires` has no cycle. */
  readonly requires: readonly string[];
  /** The `id` of each cited unit of the topic, in the sequence of the text. */
  readonly units: readonly string[];
  /** The `id` of each offline bundle that holds more of the topic. */
  readonly bundles: readonly string[];
  /** The needs or functions that the topic helps to keep. The caller gives their codes. */
  readonly serves?: readonly string[];
  /** The count of printed pages. */
  readonly pages?: number;
}

/** The codes of the findings of the topic gate. */
export const TOPIC_CODES = [
  "duplicate-id",
  "empty-title",
  "unknown-area",
  "missing-topic",
  "self-require",
  "cycle",
  "missing-unit",
  "missing-bundle",
  "unknown-serve",
  "no-content",
  "bad-pages",
] as const;

/** A code of a finding of the topic gate. */
export type TopicCode = (typeof TOPIC_CODES)[number];

/** A finding of the topic gate. */
export type TopicFinding = Finding<TopicCode, "topic">;

/** The known ids that the gate examines. Each list that is not given is not examined. */
export interface TopicOptions {
  readonly areas?: readonly string[];
  readonly units?: readonly string[];
  readonly bundles?: readonly string[];
  readonly serves?: readonly string[];
}

/**
 * This function gives the findings of a list of topics.
 * Each topic needs a unique id, a title, known prerequisites, units and bundles, and some content: a unit or a bundle.
 * Each cycle of prerequisites gets one finding with the topics of the cycle.
 */
export function checkTopics(topics: readonly Topic[], options: TopicOptions = {}): readonly TopicFinding[] {
  const out: TopicFinding[] = [];
  const error = (code: TopicCode, id: string, message: string): void => {
    out.push({ level: "error", code, record: "topic", id, message });
  };
  const ids = new Set<string>();
  for (const topic of topics) {
    if (ids.has(topic.id)) error("duplicate-id", topic.id, `Two topics have the id "${topic.id}".`);
    ids.add(topic.id);
  }
  const known = (list: readonly string[] | undefined): Set<string> | undefined => (list === undefined ? undefined : new Set(list));
  const areas = known(options.areas);
  const units = known(options.units);
  const bundles = known(options.bundles);
  const serves = known(options.serves);
  for (const topic of topics) {
    if (topic.title.trim() === "") error("empty-title", topic.id, `The topic "${topic.id}" has no title.`);
    if (areas !== undefined && !areas.has(topic.area)) error("unknown-area", topic.id, `The topic "${topic.id}" has the unknown area "${topic.area}".`);
    for (const need of topic.requires) {
      if (need === topic.id) error("self-require", topic.id, `The topic "${topic.id}" requires itself.`);
      else if (!ids.has(need)) error("missing-topic", topic.id, `The topic "${topic.id}" requires the unknown topic "${need}".`);
    }
    for (const unit of topic.units) {
      if (units !== undefined && !units.has(unit)) error("missing-unit", topic.id, `The topic "${topic.id}" names the unknown unit "${unit}".`);
    }
    for (const bundle of topic.bundles) {
      if (bundles !== undefined && !bundles.has(bundle)) error("missing-bundle", topic.id, `The topic "${topic.id}" names the unknown bundle "${bundle}".`);
    }
    for (const serve of topic.serves ?? []) {
      if (serves !== undefined && !serves.has(serve)) error("unknown-serve", topic.id, `The topic "${topic.id}" serves the unknown code "${serve}".`);
    }
    if (topic.units.length === 0 && topic.bundles.length === 0) error("no-content", topic.id, `The topic "${topic.id}" has no unit and no bundle.`);
    if (topic.pages !== undefined && (!Number.isSafeInteger(topic.pages) || topic.pages < 1)) error("bad-pages", topic.id, `The topic "${topic.id}" has ${topic.pages} pages. It needs a whole number of 1 or more.`);
  }
  for (const cycle of cyclesOf(topics)) {
    error("cycle", cycle[0] ?? "", `The topics ${cycle.map((id) => `"${id}"`).join(", ")} require each other in a cycle.`);
  }
  return out;
}

/** This function gives each cycle of prerequisites as the list of its topics, in the order of the input. */
export function cyclesOf(topics: readonly Topic[]): readonly (readonly string[])[] {
  const requires = new Map(topics.map((topic) => [topic.id, topic.requires.filter((need) => need !== topic.id)]));
  const components = stronglyConnectedComponents([...requires.keys()], (id) => requires.get(id) ?? []);
  const order = new Map(topics.map((topic, index) => [topic.id, index]));
  return components
    .filter((component) => component.length > 1)
    .sort((a, b) => (order.get(a[0] ?? "") ?? 0) - (order.get(b[0] ?? "") ?? 0));
}

function nodesOf(topics: readonly Topic[]): Map<string, DAGNode<Topic>> {
  return new Map(topics.map((topic) => [topic.id, { id: topic.id, dependencies: [...topic.requires], data: topic }]));
}

/**
 * This function gives the topics in the print order: each topic comes after each topic that it requires.
 * The topics of one level keep the order of the input. A prerequisite that is not in the list is not an edge.
 * A cycle throws a `RangeError`: start `checkTopics` first.
 */
export function printOrder(topics: readonly Topic[]): readonly Topic[] {
  const cycles = cyclesOf(topics);
  if (cycles.length > 0) throw new RangeError(`printOrder: the topics ${cycles[0]?.join(", ") ?? ""} require each other in a cycle.`);
  const dag = buildLeveledDAG(nodesOf(topics));
  const order = new Map(topics.map((topic, index) => [topic.id, index]));
  return dag.levels.flatMap((level) => [...level].sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0)).map((node) => node.data as Topic));
}

/** This function gives each topic that a reader must know before the topic `id`, in the print order. */
export function prerequisitesOf(topics: readonly Topic[], id: string): readonly Topic[] {
  const before = getAncestors(nodesOf(topics), id);
  return printOrder(topics).filter((topic) => before.has(topic.id));
}
