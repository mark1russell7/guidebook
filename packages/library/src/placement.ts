// The plan of the copies of one level as a query of `@mark1russell7/stack-placement`.
// Each slot is one copy. Each candidate is one medium offer at one place. Each place and each kind of medium is a shared
// fragment, so two copies at one place share the loss of that place. The chance comes from `worksChance` of `stack-risk`.

import type { Candidate, ChanceReading, PlacementLayer, PlacementPlan, Shared } from "@mark1russell7/stack-placement";
import { PLACEMENT_SCHEMA, planPlacement } from "@mark1russell7/stack-placement";
import { RISK_SCHEMA, worksChance } from "@mark1russell7/stack-risk";
import type { RiskLayer } from "@mark1russell7/stack-risk";
import { riskAddOn } from "@mark1russell7/stack-risk/add-on";
import type { Part, Stack } from "@mark1russell7/system-stack";
import { readLayer } from "@mark1russell7/system-stack";
import type { CopyRule, MediumKind, MediumLife } from "./records.ts";

/** A medium that a copy can go on, with its price and its rate of loss. The offers are input data of the caller. */
export interface MediumOffer {
  readonly id: string;
  readonly kind: MediumKind;
  /** The capacity of one medium in bytes. */
  readonly bytes: number;
  /** The price of one medium, in the currency of the plan. */
  readonly price: number;
  /** The years of use of one medium. The cost of a month is `price / (lifeYears × 12)`. */
  readonly lifeYears: number;
  /** The chance from 0 to 1 that a copy on the medium cannot be read after one year, for example an annual failure rate. */
  readonly yearlyLoss: number;
  /** The source of `yearlyLoss`. */
  readonly source: string;
  /**
   * The life of the medium at a quantile. A medium that ages fails more frequently when it is old, so a yearly rate is not a safe bound.
   * With a life, the chance of a copy is the smaller of the two. A plan that keeps a medium past its life gets the chance 0.
   */
  readonly life?: MediumLife;
}

/** A place that holds copies, with its rate of loss. The places are input data of the caller. */
export interface CopyPlace {
  readonly id: string;
  /** The chance from 0 to 1 that the place loses all its copies in one year, for example by fire, flood or theft. */
  readonly yearlyLoss: number;
  /** The source of `yearlyLoss`. */
  readonly source: string;
  /** The cost of a month of the place, for example the rent of a box. The default is 0. */
  readonly monthly?: number;
}

/** A shared cause of loss of all the copies on one kind of medium, for example a format that no reader can read. */
export interface KindLoss {
  readonly kind: MediumKind;
  readonly yearlyLoss: number;
  readonly source: string;
}

/** The input of `copiesLayer`. */
export interface CopiesInput {
  /** The copy rule of the level. The slots, the counts of kinds and places, and the period of the chance come from it. */
  readonly rule: CopyRule;
  /** The bytes of the bundles of the level, for example from `bytesOf`. An offer with less capacity is not a candidate. */
  readonly bytes: number;
  readonly offers: readonly MediumOffer[];
  readonly places: readonly CopyPlace[];
  /** The shared losses of the kinds. A kind with no record has no shared loss. */
  readonly kindLosses?: readonly KindLoss[];
  /** The count of optional slots after the `rule.copies` slots. The default is 1. */
  readonly extra?: number;
  /** The currency of the prices. */
  readonly currency: string;
  /** The largest cost of a month, and the smallest chance. */
  readonly limits?: { readonly cost?: number; readonly chance?: number };
}

/** The layer and the base stack of a plan of copies. */
export interface CopiesQuery {
  readonly layer: PlacementLayer;
  readonly base: Stack;
}

/** The part of a placed stack that works when one copy of the level or more can be read. */
export const libraryPartOf = (level: string): string => `library:${level}`;

const placePartOf = (place: string): string => `place:${place}`;
const kindPartOf = (kind: MediumKind): string => `medium:${kind}`;

/**
 * This function gives the chance that a medium with a life still works at the end of each period, from 0 to 1.
 * The medium is replaced after `useYears`. For each period that ends by the age `life.years`, the chance is `1 - life.quantile` or more.
 * The reason: the chance of the period is S(end) / S(start), and S(end) is S(life) or more. When `useYears` is more than `life.years`, the chance is 0.
 */
export function lifeChance(life: MediumLife, useYears: number): number {
  if (!(life.quantile >= 0 && life.quantile <= 1) || !(life.years > 0) || !(useYears > 0)) {
    throw new RangeError(`lifeChance: the life ${life.years} years at ${life.quantile}, or the use ${useYears} years, is out of range.`);
  }
  return useYears <= life.years ? 1 - life.quantile : 0;
}

const offerChance = (offer: MediumOffer, days: number): number => {
  const rate = keepChance(offer.yearlyLoss, days);
  return offer.life === undefined ? rate : Math.min(rate, lifeChance(offer.life, offer.lifeYears));
};

/** This function gives the chance that a thing with a yearly loss still works after `days` days. */
export function keepChance(yearlyLoss: number, days: number): number {
  if (!(yearlyLoss >= 0 && yearlyLoss <= 1) || !(days >= 0)) throw new RangeError(`keepChance: the loss ${yearlyLoss} or the days ${days} is out of range.`);
  return (1 - yearlyLoss) ** (days / 365);
}

const fragment = (part: Part, works: number, source: string): Stack => ({
  schema: "stack/1",
  parts: [part],
  layers: { [RISK_SCHEMA]: { schema: RISK_SCHEMA, goals: [], chances: [{ part: part.id, works, source }] } satisfies RiskLayer },
});

/**
 * This function gives the placement layer and the base stack of the copies of one level.
 * The chance of a choice is the chance that one copy or more can be read after one period `rule.everyDays`. A check then repairs each loss.
 * It throws a `RangeError` when no offer can hold the bytes, or when the input has no place.
 */
export function copiesLayer(input: CopiesInput): CopiesQuery {
  const { rule } = input;
  const days = rule.everyDays;
  const offers = input.offers.filter((offer) => offer.bytes >= input.bytes);
  if (offers.length === 0) throw new RangeError(`copiesLayer: no offer holds the ${input.bytes} bytes of the level "${rule.level}".`);
  if (input.places.length === 0) throw new RangeError(`copiesLayer: the level "${rule.level}" has no place.`);
  const count = Math.max(1, rule.copies) + (input.extra ?? 1);
  const slotIds = Array.from({ length: count }, (_, i) => `copy-${i + 1}`);
  const kinds = [...new Set(offers.map((offer) => offer.kind))];
  const losses = new Map((input.kindLosses ?? []).map((loss) => [loss.kind, loss]));
  const shared: Shared[] = [
    ...input.places.map((place) => ({
      id: placePartOf(place.id),
      stack: fragment({ id: placePartOf(place.id), kind: "place", name: place.id }, keepChance(place.yearlyLoss, days), place.source),
      cost: place.monthly ?? 0,
    })),
    ...kinds.map((kind) => {
      const loss = losses.get(kind);
      const works = loss === undefined ? 1 : keepChance(loss.yearlyLoss, days);
      return { id: kindPartOf(kind), stack: fragment({ id: kindPartOf(kind), kind: "medium", name: kind }, works, loss?.source ?? "No shared loss of the kind is known.") };
    }),
  ];
  const candidatesOf = (slot: string): Candidate[] =>
    offers.flatMap((offer) =>
      input.places.map((place) => ({
        key: `${offer.id}@${place.id}`,
        cost: offer.price / (offer.lifeYears * 12),
        uses: [placePartOf(place.id), kindPartOf(offer.kind)],
        source: offer.id,
        stack: fragment({ id: slot, kind: "copy", needs: [placePartOf(place.id), kindPartOf(offer.kind)] }, offerChance(offer, days), offer.life === undefined ? offer.source : `${offer.source} ${offer.life.source}`),
      })),
    );
  const part = libraryPartOf(rule.level);
  const layer: PlacementLayer = {
    schema: PLACEMENT_SCHEMA,
    part,
    currency: input.currency,
    slots: slotIds.map((id, i) => ({ id, candidates: candidatesOf(id), optional: i >= rule.copies })),
    shared,
    ...(input.limits === undefined ? {} : { limits: input.limits }),
  };
  const base: Stack = {
    schema: "stack/1",
    parts: [{ id: part, kind: "function", needs: [{ any: slotIds }] }],
    layers: { [RISK_SCHEMA]: { schema: RISK_SCHEMA, goals: [], chances: [{ part, works: 1, source: "The level works when one copy or more can be read." }] } satisfies RiskLayer },
  };
  return { layer, base };
}

/** The options of `planCopies`. */
export interface PlanCopiesOptions {
  /** The date of the plan, for the risk add-on. */
  readonly today: string;
  /** The count of evaluations of a seeded search of a large space. */
  readonly evaluations?: number;
  readonly seed?: number | string;
}

/**
 * This function gives the front of the plans of copies. No other plan is better on the cost of a month and on the chance.
 * A plan with fewer places or fewer kinds than the rule gets the break `measure`, so it is not on the front.
 */
export function planCopies(query: CopiesQuery, rule: CopyRule, options: PlanCopiesOptions): PlacementPlan {
  const risk = riskAddOn({ today: options.today });
  const chance = (stack: Stack, part: string): ChanceReading => {
    const places = stack.parts.filter((p) => p.kind === "place").length;
    const kinds = stack.parts.filter((p) => p.kind === "medium").length;
    if (places < rule.places || kinds < rule.kinds) throw new RangeError(`The plan has ${places} places and ${kinds} kinds. The rule needs ${rule.places} and ${rule.kinds}.`);
    const read = readLayer(stack, risk);
    if (read !== undefined && !read.ok) throw new RangeError(read.errors.join(" "));
    const works = worksChance(read?.layer ?? { schema: RISK_SCHEMA, goals: [] }, stack, part);
    return works.kind === "exact" ? { value: works.value, importance: works.importance, assumed: works.assumed } : { value: Number.NaN };
  };
  return planPlacement(query.layer, query.base, {
    joiners: [risk],
    chance,
    ...(options.evaluations === undefined ? {} : { evaluations: options.evaluations }),
    ...(options.seed === undefined ? {} : { seed: options.seed }),
  });
}
