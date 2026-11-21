// The time ladder of a plan: the phases before the start of an event, and the phases after it, each with its first second.

const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
/** A month of the ladder is 30 days, and a year is 365 days. */
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;

/** This constant is the number of seconds in one day. */
export const SECONDS_PER_DAY: number = DAY;

/** A ladder of phases. Each phase has a title that a print or a page shows. */
export interface Ladder<P extends string = string> {
  /** The phase before the start of an event, when no warning is live. */
  readonly ready: P;
  /** The phase before the start of an event, when a warning is live. */
  readonly warned: P;
  /** The phases after the start, in their sequence. Each phase starts at its second `from`. The first phase starts at 0. */
  readonly timed: readonly { readonly phase: P; readonly from: number }[];
  readonly titles: Readonly<Record<P, string>>;
}

/** The phases of the default ladder, in their sequence. */
export const PHASES = ["ready", "warned", "P0", "P1", "P2", "P3", "P4", "P5"] as const;

/** One phase of the default ladder. */
export type Phase = (typeof PHASES)[number];

/** The bounds of the phases `P0` to `P5`, in seconds: 0, 5 min, 5 h, 5 d, 5 wk, 5 mo and 5 yr. */
export const PHASE_BOUNDS: readonly number[] = [0, 5 * MINUTE, 5 * HOUR, 5 * DAY, 5 * WEEK, 5 * MONTH, 5 * YEAR];

/** The words of each phase of the default ladder. */
export const PHASE_TITLES: Readonly<Record<Phase, string>> = {
  ready: "Before an event",
  warned: "When a warning comes",
  P0: "In the first 5 minutes",
  P1: "From 5 minutes to 5 hours",
  P2: "From 5 hours to 5 days",
  P3: "From 5 days to 5 weeks",
  P4: "From 5 weeks to 5 months",
  P5: "From 5 months to 5 years",
};

/** The default ladder: each phase after the start is approximately 60 times longer than the phase before it. */
export const LADDER: Ladder<Phase> = {
  ready: "ready",
  warned: "warned",
  timed: (["P0", "P1", "P2", "P3", "P4", "P5"] as const).map((phase, i) => ({ phase, from: PHASE_BOUNDS[i] ?? 0 })),
  titles: PHASE_TITLES,
};

/** This function gives the phases of a ladder in their sequence: `ready`, `warned`, then the timed phases. */
export function phasesOf<P extends string>(ladder: Ladder<P>): readonly P[] {
  return [ladder.ready, ladder.warned, ...ladder.timed.map((step) => step.phase)];
}

/**
 * This function gives the phase of a time on a ladder, in seconds from the start of the event.
 * A negative time is before the start: it gives `warned` when a warning is live, else `ready`.
 * A time at a bound is in the later phase. A time after the start of the last phase stays in the last phase.
 */
export function phaseIn<P extends string>(ladder: Ladder<P>, seconds: number, warned = false): P {
  if (!Number.isFinite(seconds)) throw new RangeError(`phaseIn: the time ${String(seconds)} is not a finite number.`);
  if (seconds < 0) return warned ? ladder.warned : ladder.ready;
  let phase: P | undefined;
  for (const step of ladder.timed) if (seconds >= step.from) phase = step.phase;
  if (phase === undefined) throw new RangeError("phaseIn: the ladder has no timed phase that starts at 0.");
  return phase;
}

/** This function gives the phase of a time on the default ladder. 5 minutes gives `P1`. */
export function phaseOf(seconds: number, warned = false): Phase {
  return phaseIn(LADDER, seconds, warned);
}
