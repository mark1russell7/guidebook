import { byId, copyText, setupTheme } from "@mark1russell7/site-pages/chrome";
import {
  ALL_CASES,
  CASES,
  CUTS,
  CUT_OF_CASE,
  KEYS,
  MORE_CASES,
  PHASES,
  PHASE_TITLES,
  citationOf,
  gateReport,
  matrixOf,
  planOf,
  stateOf,
  titleOf,
  type Cell,
  type Phase,
  type Step,
} from "./demo.ts";

setupTheme(byId<HTMLButtonElement>("theme"), "theme");

const copy = byId<HTMLButtonElement>("copy");
copy.addEventListener("click", () => {
  void copyText(copy, byId("install").textContent ?? "");
});

/** This function makes an element with a class and a text. */
function el<K extends keyof HTMLElementTagNameMap>(tag: K, className = "", text = ""): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className !== "") node.className = className;
  if (text !== "") node.textContent = text;
  return node;
}

/** This function makes a toggle button with `aria-pressed`. */
function chip(label: string, value: string, pressed: boolean): HTMLButtonElement {
  const button = el("button", "chip", label);
  button.type = "button";
  button.dataset["value"] = value;
  button.setAttribute("aria-pressed", String(pressed));
  return button;
}

const pressed = (group: HTMLElement): string[] =>
  [...group.querySelectorAll<HTMLButtonElement>("button[aria-pressed=true]")].map((button) => button.dataset["value"] ?? "");

/** This function draws a step: its text, the key when it comes from a cut, and its sources. */
function stepItem(step: Step, mainKey: string): HTMLLIElement {
  const item = el("li", "step");
  item.append(el("p", "do", step.do));
  const meta = el("p", "meta");
  if (step.on !== mainKey) meta.append(el("span", "tag", titleOf(step.on)));
  for (const need of step.needs) meta.append(el("span", "tag need", need));
  for (const id of step.sources) {
    const citation = citationOf(id);
    if (citation === undefined) continue;
    const link = el("a", "source", citation.name);
    link.href = citation.url;
    link.title = citation.credit;
    link.rel = "noopener";
    meta.append(link);
  }
  item.append(meta);
  return item;
}

// The plan builder.

const caseSelect = byId<HTMLSelectElement>("case");
const cutsBox = byId("cuts");
const phasesBox = byId("phases");
const planList = byId<HTMLOListElement>("plan");
const planCount = byId("plan-count");

for (const [label, keys] of [["The 12 cases of v1", CASES], ["More cases", MORE_CASES]] as const) {
  const group = el("optgroup");
  group.label = label;
  for (const key of keys) {
    const option = el("option", "", titleOf(key));
    option.value = key;
    group.append(option);
  }
  caseSelect.append(group);
}
for (const cut of CUTS) cutsBox.append(chip(titleOf(cut), cut, cut === "energy.grid"));
for (const phase of PHASES) phasesBox.append(chip(phase, phase, phase !== "P4" && phase !== "P5"));
for (const button of phasesBox.querySelectorAll("button")) button.title = PHASE_TITLES[button.dataset["value"] as Phase];

function drawPlan(): void {
  const mainKey = caseSelect.value;
  const keys = [mainKey, ...pressed(cutsBox)];
  const plan = planOf(keys, pressed(phasesBox) as Phase[]);
  planList.replaceChildren();
  let steps = 0;
  for (const part of plan) {
    steps += part.steps.length;
    const item = el("li", "phase");
    const head = el("h3");
    head.append(el("span", "code", part.phase), document.createTextNode(` ${part.title}`));
    item.append(head);
    if (part.steps.length > 0) {
      const list = el("ol", "step-list");
      for (const step of part.steps) list.append(stepItem(step, mainKey));
      item.append(list);
    }
    for (const gap of part.gaps) item.append(el("p", "gap-note", `${titleOf(gap.on)}: ${gap.why}`));
    if (part.steps.length === 0 && part.gaps.length === 0) item.append(el("p", "gap-note", "No step in this phase."));
    planList.append(item);
  }
  planCount.textContent = plan.length === 0 ? "Choose one or more phases." : `${steps} steps in ${plan.length} phases.`;
}

caseSelect.addEventListener("change", () => {
  const cut = CUT_OF_CASE[caseSelect.value];
  if (cut !== undefined) cutsBox.querySelector<HTMLButtonElement>(`button[data-value="${cut}"]`)?.setAttribute("aria-pressed", "true");
  drawPlan();
});
for (const box of [cutsBox, phasesBox]) {
  box.addEventListener("click", (event) => {
    const button = (event.target as HTMLElement).closest("button");
    if (button === null) return;
    button.setAttribute("aria-pressed", String(button.getAttribute("aria-pressed") !== "true"));
    drawPlan();
  });
}
drawPlan();

// The matrix.

const table = byId<HTMLTableElement>("matrix");
const detail = byId("cell-detail");
let rows: "all" | "cases" | "cuts" = "all";
let selected: { on: string; phase: Phase } | undefined;

function showCell(cell: Cell): void {
  selected = { on: cell.on, phase: cell.phase };
  detail.hidden = false;
  detail.replaceChildren();
  const head = el("h3");
  head.append(el("span", "code", cell.phase), document.createTextNode(` ${titleOf(cell.on)}: ${PHASE_TITLES[cell.phase]}`));
  detail.append(head);
  if (cell.steps.length > 0) {
    const list = el("ol", "step-list");
    for (const step of cell.steps) list.append(stepItem(step, cell.on));
    detail.append(list);
  } else {
    detail.append(el("p", "gap-note", cell.gap?.why ?? "This cell has no step and no mark. The step gate gives a finding."));
  }
  for (const button of table.querySelectorAll<HTMLButtonElement>("button.cell")) {
    button.setAttribute("aria-pressed", String(button.dataset["on"] === cell.on && button.dataset["phase"] === cell.phase));
  }
}

function drawMatrix(): void {
  const keys = rows === "cases" ? ALL_CASES : rows === "cuts" ? CUTS : KEYS;
  const matrix = matrixOf(keys);
  table.replaceChildren();
  const head = el("thead");
  const headRow = el("tr");
  headRow.append(el("th", "corner", "Key"));
  for (const phase of PHASES) {
    const th = el("th", "", phase);
    th.scope = "col";
    th.title = PHASE_TITLES[phase];
    headRow.append(th);
  }
  head.append(headRow);
  const body = el("tbody");
  for (const row of matrix) {
    const tr = el("tr");
    const first = row[0];
    if (first === undefined) continue;
    if (rows === "all" && first.on === CUTS[0]) tr.className = "first-cut";
    const th = el("th", "", titleOf(first.on));
    th.scope = "row";
    th.title = first.on;
    tr.append(th);
    for (const cell of row) {
      const td = el("td");
      const state = stateOf(cell);
      const button = el("button", `cell ${state}`, state === "steps" ? String(cell.steps.length) : state === "gap" ? "–" : "!");
      button.type = "button";
      button.dataset["on"] = cell.on;
      button.dataset["phase"] = cell.phase;
      const what = state === "steps" ? `${cell.steps.length} steps` : state === "gap" ? "a marked gap" : "no step and no mark";
      button.setAttribute("aria-label", `${titleOf(cell.on)}, ${cell.phase}: ${what}`);
      button.setAttribute("aria-pressed", String(selected?.on === cell.on && selected.phase === cell.phase));
      button.addEventListener("click", () => showCell(cell));
      td.append(button);
      tr.append(td);
    }
    body.append(tr);
  }
  table.append(head, body);
}

for (const button of document.querySelectorAll<HTMLButtonElement>("[data-rows]")) {
  button.addEventListener("click", () => {
    rows = button.dataset["rows"] as typeof rows;
    for (const other of document.querySelectorAll<HTMLButtonElement>("[data-rows]")) other.setAttribute("aria-pressed", String(other === button));
    drawMatrix();
  });
}
drawMatrix();

// The facts and the gates.

const today = new Date();
const at = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
const report = gateReport(at);
const errors = report.findings.filter((finding) => finding.level === "error");
const facts = byId("facts");
for (const [value, label] of [
  [String(report.sources), "sources"],
  [String(report.steps), "steps"],
  [String(report.gaps), "marked gaps"],
  [`${report.filled} of ${report.cells}`, "cells with a step or a mark"],
] as const) {
  const item = el("li");
  item.append(el("strong", "", value), el("span", "", label));
  facts.append(item);
}
const verdict = el("li", errors.length === 0 ? "pass" : "fail");
verdict.append(el("strong", "", errors.length === 0 ? "Pass" : "Fail"), el("span", "", "the source and step gates"));
facts.append(verdict);
const coverage = el("li", report.open.length === 0 ? "pass" : "fail");
coverage.append(
  el("strong", "", `${report.covered} of ${report.horizonCells}`),
  el("span", "", report.open.length === 0 ? "cells with steps from 5 minutes to 5 years: the coverage gate passes" : "cells with steps from 5 minutes to 5 years: the coverage gate fails"),
);
facts.append(coverage);

const gates = byId("gates");
const summary = el("p", `verdict ${errors.length === 0 ? "pass" : "fail"}`);
summary.textContent =
  report.findings.length === 0
    ? `No finding. The source gate examined ${report.sources} sources, and the step gate examined ${report.steps} steps in ${report.cells} cells.`
    : `${errors.length} errors and ${report.findings.length - errors.length} warnings.`;
gates.append(summary);
if (report.findings.length > 0) {
  const list = el("ul", "findings");
  for (const finding of report.findings) list.append(el("li", finding.level, `${finding.code} on ${finding.id}: ${finding.message}`));
  gates.append(list);
}
const open = el("p", `verdict ${report.open.length === 0 ? "pass" : "fail"}`);
open.textContent =
  report.open.length === 0
    ? "The coverage gate passes: each key has steps in each horizon from 5 minutes to 5 years."
    : `The coverage gate fails: ${report.open.length} cells from 5 minutes to 5 years have no step. A marked gap does not pass it.`;
gates.append(open);
gates.append(el("p", "note", `The sources were last read on ${report.checked}. A source that is too old gives a warning.`));
