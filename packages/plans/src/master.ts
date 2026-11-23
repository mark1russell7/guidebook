// The master chart: one chart for any disaster, as data. A reader starts at a signal, answers a few questions and goes to a tab.
// A tab is a section of a printed plan: a set of keys and phases. The print gives each tab its page.

import { stronglyConnectedComponents } from "@mark1russell7/collections/graph";
import { resultOf } from "@mark1russell7/guidebook";
import type { Finding, GateResult, Source } from "@mark1russell7/guidebook";
import type { Phase } from "./ladder.ts";
import { stepsFor } from "./steps.ts";
import type { Step } from "./steps.ts";

/** The states of society after an event, from a society that works to a society that does not work. */
export const SOCIETY_STATES = ["works", "partly", "none"] as const;

/** A state of society: the emergency services, the shops, the grid and the law work, work in part or do not work. */
export type Society = (typeof SOCIETY_STATES)[number];

/** The words of each state of society, for a chart. */
export const SOCIETY_TITLES: Readonly<Record<Society, string>> = {
  works: "Society works",
  partly: "Society works in part",
  none: "Society does not work",
};

/**
 * A tab of a printed plan: the steps of its keys in its phases.
 * Each state of society is a section in the tab, so a tab is for one need or one subject, not for one state.
 */
export interface Tab<P extends string = Phase> {
  readonly id: string;
  readonly title: string;
  /** The keys of the tab: cases, cuts or needs. A tab of reference text or of a chart has no keys. */
  readonly keys: readonly string[];
  readonly phases: readonly P[];
  /** The most pages that the print of the tab can use. */
  readonly pages?: number;
}

/** An answer to a question of the chart. */
export interface ChartAnswer {
  /** The words of the answer, for a chart. */
  readonly label: string;
  /** The id of the next node. */
  readonly next: string;
  /** The state of society that the answer tells, if any. */
  readonly society?: Society;
}

/** A start of the chart: a thing that a reader sees or hears. */
export interface SignalNode {
  readonly id: string;
  readonly kind: "signal";
  readonly text: string;
  readonly next: string;
  readonly sources?: readonly string[];
}

/** A question of the chart, with two or more answers. */
export interface QuestionNode {
  readonly id: string;
  readonly kind: "question";
  readonly text: string;
  readonly answers: readonly ChartAnswer[];
  /** The ids of the sources that tell the question and its answers. */
  readonly sources: readonly string[];
  /** The reasoning of the question from first principles, for a question that no source tells. */
  readonly reasoning?: string;
}

/**
 * An end of the chart: an instruction that sends the reader to a tab.
 * An end with `next` leads on: after the tab, the reader goes to that node.
 */
export interface GotoNode {
  readonly id: string;
  readonly kind: "goto";
  readonly text: string;
  readonly tab: string;
  readonly sources?: readonly string[];
  /** The end also shows the card of the hazard of the reader, if the reader came with one. */
  readonly card?: true;
  /** The node that the reader goes to after the tab. No value means that the walk ends at the tab. */
  readonly next?: string;
}

/** A node of the master chart. */
export type ChartNode = SignalNode | QuestionNode | GotoNode;

/** The codes of the findings of the chart gate. */
export const MASTER_FINDING_CODES = [
  "duplicate-id",
  "unknown-node",
  "unknown-tab",
  "unknown-key",
  "few-answers",
  "no-signal",
  "unreachable",
  "cycle",
  "too-deep",
  "too-many-nodes",
  "too-many-ends",
  "tab-without-steps",
  "unused-tab",
  "uncovered-key",
  "no-source",
  "unknown-source",
  "bad-schema",
  "unknown-start",
  "unknown-catalog",
  "unknown-hazard",
  "duplicate-hazard",
  "missing-hazard",
  "unknown-signal",
  "unknown-entry",
  "unknown-card-step",
  "no-route",
] as const;

/** A code of a finding of the chart gate. */
export type MasterFindingCode = (typeof MASTER_FINDING_CODES)[number];

/** A finding of the chart gate. */
export type MasterFinding = Finding<MasterFindingCode, "chart">;

/** The options of the chart gate. */
export interface MasterGateOptions {
  /** The known keys: the cases, the cuts and the needs. */
  readonly on: readonly string[];
  /** The keys that a tab of the chart must hold. No `cover` means no key. */
  readonly cover?: readonly string[];
  /** The most questions on a path from a signal to a tab. The default is 3. */
  readonly maxQuestions?: number;
  /** The most nodes that the print of the chart can hold. No `maxNodes` means no limit. */
  readonly maxNodes?: number;
  /** The most ends (nodes of the kind `goto`) that the print of the chart can hold. No `maxEnds` means no limit. */
  readonly maxEnds?: number;
  /** The ids of the tabs that a reader reaches by another way than an end, for example the catalog through the cards. */
  readonly used?: readonly string[];
}

/** The ids of the nodes that come after a node. */
function nextOf(node: ChartNode): readonly string[] {
  if (node.kind === "signal") return [node.next];
  if (node.kind === "question") return node.answers.map((answer) => answer.next);
  return node.next === undefined ? [] : [node.next];
}

/** The nodes in a cycle. A chart with a cycle has no end on that path. */
function cycleNodes(nodes: readonly ChartNode[], byId: ReadonlyMap<string, ChartNode>): Set<string> {
  const next = (id: string): readonly string[] => {
    const node = byId.get(id);
    return node === undefined ? [] : nextOf(node).filter((to) => byId.has(to));
  };
  const out = new Set<string>();
  for (const group of stronglyConnectedComponents(nodes.map((node) => node.id), next)) {
    const [first] = group;
    if (group.length > 1 || (first !== undefined && next(first).includes(first))) for (const id of group) out.add(id);
  }
  return out;
}

/** The most questions from each node to the first end, on a chart with no cycle. The questions after an end do not count. */
function questionsToEnd(byId: ReadonlyMap<string, ChartNode>, skip: ReadonlySet<string>): Map<string, number> {
  const memo = new Map<string, number>();
  const walk = (id: string): number => {
    const known = memo.get(id);
    if (known !== undefined) return known;
    const node = byId.get(id);
    if (node === undefined || skip.has(id) || node.kind === "goto") return 0;
    const rest = Math.max(0, ...nextOf(node).map(walk));
    const value = (node.kind === "question" ? 1 : 0) + rest;
    memo.set(id, value);
    return value;
  };
  for (const id of byId.keys()) walk(id);
  return memo;
}

/** The ids of the nodes that a signal reaches. */
function reached(nodes: readonly ChartNode[], byId: ReadonlyMap<string, ChartNode>): Set<string> {
  const seen = new Set<string>();
  const stack = nodes.filter((node) => node.kind === "signal").map((node) => node.id);
  for (let id = stack.pop(); id !== undefined; id = stack.pop()) {
    if (seen.has(id)) continue;
    seen.add(id);
    const node = byId.get(id);
    if (node !== undefined) stack.push(...nextOf(node));
  }
  return seen;
}

/**
 * This function applies the chart gate.
 * Each node is known and reached, and each path ends at a known tab after a few questions.
 * Each tab with keys has steps. Each key of `cover` is in a tab that the chart reaches.
 */
export function checkMasterChart<P extends string>(
  nodes: readonly ChartNode[],
  tabs: readonly Tab<P>[],
  steps: readonly Step<P>[],
  sources: readonly Source[],
  options: MasterGateOptions,
): GateResult<MasterFinding> {
  const out: MasterFinding[] = [];
  const error = (code: MasterFindingCode, id: string, message: string): void => {
    out.push({ level: "error", code, record: "chart", id, message });
  };
  const byId = new Map<string, ChartNode>();
  for (const node of nodes) {
    if (byId.has(node.id)) error("duplicate-id", node.id, `Two nodes have the id "${node.id}".`);
    byId.set(node.id, node);
  }
  const tabById = new Map<string, Tab<P>>();
  for (const tab of tabs) {
    if (tabById.has(tab.id)) error("duplicate-id", tab.id, `Two tabs have the id "${tab.id}".`);
    tabById.set(tab.id, tab);
  }
  const known = new Set(options.on);
  const sourceIds = new Set(sources.map((source) => source.id));

  for (const node of nodes) {
    for (const to of nextOf(node)) if (!byId.has(to)) error("unknown-node", node.id, `The node goes to the unknown node "${to}".`);
    if (node.kind === "question" && node.answers.length < 2) error("few-answers", node.id, "The question has fewer than 2 answers.");
    if (node.kind === "goto" && !tabById.has(node.tab)) error("unknown-tab", node.id, `The node goes to the unknown tab "${node.tab}".`);
    if (node.kind === "question" && node.sources.length === 0 && (node.reasoning ?? "").trim() === "") error("no-source", node.id, "The question cites no source and gives no reasoning.");
    for (const id of node.sources ?? []) if (!sourceIds.has(id)) error("unknown-source", node.id, `The node cites the unknown source "${id}".`);
  }
  if (!nodes.some((node) => node.kind === "signal")) error("no-signal", "chart", "The chart has no signal, so a reader cannot start.");

  const seen = reached(nodes, byId);
  for (const node of nodes) if (!seen.has(node.id)) error("unreachable", node.id, "No signal reaches the node.");
  const cycle = cycleNodes(nodes, byId);
  for (const id of cycle) error("cycle", id, "The node is in a cycle, so its path has no end.");
  const limit = options.maxQuestions ?? 3;
  const depth = questionsToEnd(byId, cycle);
  for (const node of nodes) {
    const value = depth.get(node.id) ?? 0;
    if (node.kind === "signal" && value > limit) error("too-deep", node.id, `A path from the signal has ${value} questions. The limit is ${limit}.`);
  }

  if (options.maxNodes !== undefined && nodes.length > options.maxNodes) error("too-many-nodes", "chart", `The chart has ${nodes.length} nodes. The limit is ${options.maxNodes}.`);
  const ends = nodes.filter((node) => node.kind === "goto").length;
  if (options.maxEnds !== undefined && ends > options.maxEnds) error("too-many-ends", "chart", `The chart has ${ends} ends. The limit is ${options.maxEnds}.`);

  const used = new Set([...(options.used ?? []), ...nodes.filter((node) => seen.has(node.id)).flatMap((node) => (node.kind === "goto" ? [node.tab] : []))]);
  for (const tab of tabs) {
    for (const key of tab.keys) if (!known.has(key)) error("unknown-key", tab.id, `The tab names the unknown key "${key}".`);
    const keys = new Set(tab.keys);
    if (keys.size > 0 && !steps.some((step) => keys.has(step.on) && tab.phases.includes(step.phase))) error("tab-without-steps", tab.id, "The tab has no step in its keys and phases.");
    if (!used.has(tab.id)) error("unused-tab", tab.id, "No path of the chart goes to the tab.");
  }
  const held = new Set([...used].flatMap((id) => tabById.get(id)?.keys ?? []));
  for (const key of options.cover ?? []) if (!held.has(key)) error("uncovered-key", key, `No tab of the chart holds the key "${key}".`);
  return resultOf(out);
}

/** An edge of the master chart, for a renderer. */
export interface ChartEdge {
  readonly from: string;
  readonly to: string;
  /** The words of the answer. A signal edge has no label. */
  readonly label?: string;
}

/** A node of the master chart with its layer: the most edges from a signal to the node. */
export interface PlacedNode {
  readonly node: ChartNode;
  readonly layer: number;
}

/** The master chart, for a renderer: the nodes by layer, the edges and the tabs that the chart reaches. */
export interface MasterChart<P extends string = Phase> {
  readonly nodes: readonly PlacedNode[];
  readonly edges: readonly ChartEdge[];
  readonly tabs: readonly Tab<P>[];
}

/** This function gives the master chart for a renderer. It gives no layer to a node in a cycle. Apply the chart gate first. */
export function masterChartOf<P extends string>(nodes: readonly ChartNode[], tabs: readonly Tab<P>[]): MasterChart<P> {
  const byId = new Map(nodes.map((node) => [node.id, node] as const));
  const cycle = cycleNodes(nodes, byId);
  const edges: ChartEdge[] = nodes.flatMap((node): ChartEdge[] => {
    if (node.kind === "signal") return [{ from: node.id, to: node.next }];
    if (node.kind === "question") return node.answers.map((answer) => ({ from: node.id, to: answer.next, label: answer.label }));
    return [];
  });
  const layer = new Map<string, number>();
  const into = new Map<string, string[]>();
  for (const edge of edges) into.set(edge.to, [...(into.get(edge.to) ?? []), edge.from]);
  const layerOf = (id: string): number => {
    const known = layer.get(id);
    if (known !== undefined) return known;
    const before = (into.get(id) ?? []).filter((from) => byId.has(from) && !cycle.has(from));
    const value = before.length === 0 ? 0 : 1 + Math.max(...before.map(layerOf));
    layer.set(id, value);
    return value;
  };
  const placed = nodes.filter((node) => !cycle.has(node.id)).map((node) => ({ node, layer: layerOf(node.id) }));
  placed.sort((a, b) => a.layer - b.layer);
  const tabIds = new Set(nodes.flatMap((node) => (node.kind === "goto" ? [node.tab] : [])));
  return { nodes: placed, edges, tabs: tabs.filter((tab) => tabIds.has(tab.id)) };
}

/** The name and the major version of the schema of the master graph. A reader refuses a graph with another value. */
export const GRAPH_SCHEMA = "guidebook-graph/2";

/** A row of the hazard catalog: an index into the graph, with the facts that are unique to the hazard. */
export interface HazardRow {
  /** The key of the case. */
  readonly key: string;
  readonly title: string;
  /** The ids of the signal nodes that the hazard gives. */
  readonly signals: readonly string[];
  /** The id of the node where a reader with this hazard joins the graph. */
  readonly entry: string;
  /** The ids of the steps of the case that are unique to it: its card. */
  readonly card: readonly string[];
}

/**
 * The master graph: one value that a printed binder and an app read.
 * The edges come from the nodes with `masterChartOf`, so no second list can disagree with them.
 */
export interface MasterGraph<P extends string = Phase> {
  readonly schema: typeof GRAPH_SCHEMA;
  /** The id of the tab of the chart itself, the entry of the binder. */
  readonly start: string;
  /** The id of the tab of the hazard catalog. An end with `card` shows the card from it. */
  readonly catalog: string;
  /** The states of society, in the sequence of the sections of each tab. */
  readonly societies: readonly Society[];
  readonly nodes: readonly ChartNode[];
  readonly tabs: readonly Tab<P>[];
  readonly hazards: readonly HazardRow[];
}

/** The options of the graph gate: the options of the chart gate and the cases that the catalog must index. */
export interface GraphGateOptions extends MasterGateOptions {
  /** The keys of the cases. Each case has one row of the catalog. */
  readonly cases: readonly string[];
}

/**
 * This function applies the graph gate: the chart gate, and the gate of the hazard rows.
 *
 * The start tab and the catalog tab are tabs. The start tab needs no path. An end with `card` uses the catalog tab.
 * Each case has one row. Each row names known signals, a known entry and steps of its case.
 * Each entry reaches an end whose tab has keys.
 */
export function checkMasterGraph<P extends string>(
  graph: MasterGraph<P>,
  steps: readonly Step<P>[],
  sources: readonly Source[],
  options: GraphGateOptions,
): GateResult<MasterFinding> {
  const out: MasterFinding[] = [];
  const error = (code: MasterFindingCode, id: string, message: string): void => {
    out.push({ level: "error", code, record: "chart", id, message });
  };
  if (graph.schema !== GRAPH_SCHEMA) error("bad-schema", "graph", `The schema is "${String(graph.schema)}", not "${GRAPH_SCHEMA}".`);
  const tabIds = new Set(graph.tabs.map((tab) => tab.id));
  if (!tabIds.has(graph.start)) error("unknown-start", graph.start, `The start tab "${graph.start}" is not a tab.`);
  if (!tabIds.has(graph.catalog)) error("unknown-catalog", graph.catalog, `The catalog tab "${graph.catalog}" is not a tab.`);
  const withCards = graph.nodes.some((node) => node.kind === "goto" && node.card === true);
  const chartTabs = graph.tabs.filter((tab) => tab.id !== graph.start);
  const chart = checkMasterChart(graph.nodes, chartTabs, steps, sources, { ...options, used: [...(options.used ?? []), ...(withCards ? [graph.catalog] : [])] });
  out.push(...chart.findings);

  const byId = new Map(graph.nodes.map((node) => [node.id, node] as const));
  const stepById = new Map(steps.map((step) => [step.id, step] as const));
  const tabById = new Map(graph.tabs.map((tab) => [tab.id, tab] as const));
  const cases = new Set(options.cases);
  const rows = new Set<string>();
  const routes = (id: string, seen = new Set<string>()): boolean => {
    if (seen.has(id)) return false;
    seen.add(id);
    const node = byId.get(id);
    if (node === undefined) return false;
    if (node.kind === "goto") return (tabById.get(node.tab)?.keys.length ?? 0) > 0;
    return nextOf(node).some((to) => routes(to, seen));
  };
  for (const row of graph.hazards) {
    if (rows.has(row.key)) error("duplicate-hazard", row.key, `Two rows of the catalog have the key "${row.key}".`);
    rows.add(row.key);
    if (!cases.has(row.key)) error("unknown-hazard", row.key, `The row names the unknown case "${row.key}".`);
    if (row.signals.length === 0) error("unknown-signal", row.key, "The row names no signal.");
    for (const id of row.signals) if (byId.get(id)?.kind !== "signal") error("unknown-signal", row.key, `The row names "${id}", which is not a signal node.`);
    if (!byId.has(row.entry)) error("unknown-entry", row.key, `The row names the unknown entry "${row.entry}".`);
    else if (!routes(row.entry)) error("no-route", row.key, "No path from the entry of the row goes to a tab with keys.");
    for (const id of row.card) if (stepById.get(id)?.on !== row.key) error("unknown-card-step", row.key, `The card names "${id}", which is not a step of the case.`);
  }
  for (const key of options.cases) if (!rows.has(key)) error("missing-hazard", key, `The catalog has no row for the case "${key}".`);
  return resultOf(out);
}

/** A node that a walk left, with the state of society at that node. */
export interface WalkStep {
  readonly at: string;
  readonly society?: Society;
}

/**
 * The state of a walk of the master graph. It is plain data, so a reader can keep it in an address or a store.
 * `at` is the id of the current node. `trail` holds the nodes before it, the first one first.
 */
export interface WalkState {
  readonly at: string;
  /** The key of the case of the reader, if the reader came from a row of the catalog. */
  readonly hazard?: string;
  /** The state of society that the answers told, if any. */
  readonly society?: Society;
  readonly trail: readonly WalkStep[];
}

/** The steps of one phase at the end of a walk. */
export interface WalkPhase<P extends string = Phase> {
  readonly phase: P;
  readonly steps: readonly Step<P>[];
}

/** The end of a walk: the tab, its steps by phase for the state of society, and the card of the hazard. */
export interface WalkEnd<P extends string = Phase> {
  readonly tab: Tab<P>;
  /** The state of society of the steps. No value means the steps of each state. */
  readonly society?: Society;
  readonly phases: readonly WalkPhase<P>[];
  /** The steps of the card of the hazard, when the end has `card` and the walk has a hazard. */
  readonly card: readonly Step<P>[];
}

/**
 * This function gives the start of a walk.
 * With a hazard, the walk starts at the entry of its row. With no hazard, it starts at `signal` or at the first signal.
 * It gives `undefined` for an unknown hazard or signal.
 */
export function walkStart<P extends string>(graph: MasterGraph<P>, hazard?: string, signal?: string): WalkState | undefined {
  if (hazard !== undefined) {
    const row = graph.hazards.find((item) => item.key === hazard);
    return row === undefined ? undefined : { at: row.entry, hazard, trail: [] };
  }
  const start = graph.nodes.find((node) => node.kind === "signal" && (signal === undefined || node.id === signal));
  return start === undefined ? undefined : { at: start.id, trail: [] };
}

/**
 * This function gives the state after an answer.
 * At a signal or at an end with `next`, the walk goes to the next node, and the label is not used. At a question, the label selects the answer.
 * An answer with a state of society sets it. The function gives `undefined` for an unknown label, or at an end with no `next`.
 */
export function walkAnswer<P extends string>(graph: MasterGraph<P>, state: WalkState, label?: string): WalkState | undefined {
  const node = graph.nodes.find((item) => item.id === state.at);
  const trail = [...state.trail, { at: state.at, ...(state.society === undefined ? {} : { society: state.society }) }];
  const keep = state.hazard === undefined ? {} : { hazard: state.hazard };
  if (node?.kind === "signal" || (node?.kind === "goto" && node.next !== undefined)) return { at: node.next ?? state.at, ...keep, ...(state.society === undefined ? {} : { society: state.society }), trail };
  if (node?.kind !== "question") return undefined;
  const answer = node.answers.find((item) => item.label === label);
  if (answer === undefined) return undefined;
  const society = answer.society ?? state.society;
  return { at: answer.next, ...keep, ...(society === undefined ? {} : { society }), trail };
}

/** This function gives the state one node back, with the state of society at that node. At the start, it gives the same state. */
export function walkBack(state: WalkState): WalkState {
  const last = state.trail.at(-1);
  if (last === undefined) return state;
  return { at: last.at, ...(state.hazard === undefined ? {} : { hazard: state.hazard }), ...(last.society === undefined ? {} : { society: last.society }), trail: state.trail.slice(0, -1) };
}

/**
 * This function gives the end of a walk at a goto: its tab, the steps of the tab by phase, and the card.
 * The steps are for the state of society of the walk. It gives `undefined` when the walk is not at a goto.
 */
export function walkEnd<P extends string>(graph: MasterGraph<P>, state: WalkState, steps: readonly Step<P>[]): WalkEnd<P> | undefined {
  const node = graph.nodes.find((item) => item.id === state.at);
  if (node?.kind !== "goto") return undefined;
  const tab = graph.tabs.find((item) => item.id === node.tab);
  if (tab === undefined) return undefined;
  const options = state.society === undefined ? {} : { society: state.society };
  const phases = tab.phases.map((phase) => ({ phase, steps: stepsFor(steps, tab.keys, [phase], options) })).filter((item) => item.steps.length > 0);
  const row = node.card === true && state.hazard !== undefined ? graph.hazards.find((item) => item.key === state.hazard) : undefined;
  const byId = new Map(steps.map((step) => [step.id, step] as const));
  const card = (row?.card ?? []).flatMap((id) => {
    const step = byId.get(id);
    return step === undefined ? [] : [step];
  });
  return { tab, ...options, phases, card };
}
