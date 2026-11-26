// The groups of persons that a step can be for, and the groups of one person.
// A step with the field `persons` protects the persons of these groups. A planner gives the step to the plan of each person in a group.

/**
 * The groups of persons, in a fixed sequence.
 *
 * - `infant`: a person younger than 12 months.
 * - `child`: a person of 12 months or more and younger than 18 years.
 * - `older-adult`: a person of 65 years or more. The pages of the CDC for older adults use this bound.
 * - `pregnant`: a person with a stage of pregnancy.
 */
export const PERSON_GROUPS = ["infant", "child", "older-adult", "pregnant"] as const;

/** A group of persons that a step can be for. */
export type PersonGroup = (typeof PERSON_GROUPS)[number];

/** The facts of a person that give its groups: the age in whole months and an optional stage, for example `pregnancy-2`. */
export interface PersonFacts {
  readonly ageMonths: number;
  /** The stage of the person. A stage that starts with `pregnancy` puts the person in the group `pregnant`. */
  readonly stage?: string | undefined;
}

/** The age of an infant: less than this count of months. */
const INFANT_MONTHS = 12;
/** The age of a child: less than this count of months (18 years). */
const CHILD_MONTHS = 216;
/** The age of an older adult: this count of months (65 years) or more. */
const OLDER_MONTHS = 780;

/**
 * This function gives the groups of one person, in the sequence of `PERSON_GROUPS`.
 *
 * @param person - The age and the stage of the person
 * @throws {RangeError} When the age is not a whole number of 0 or more
 */
export function personGroups(person: PersonFacts): PersonGroup[] {
  const months = person.ageMonths;
  if (!Number.isSafeInteger(months) || months < 0) throw new RangeError(`personGroups: the age ${String(months)} is not a whole number of months of 0 or more.`);
  const groups: PersonGroup[] = [];
  if (months < INFANT_MONTHS) groups.push("infant");
  else if (months < CHILD_MONTHS) groups.push("child");
  if (months >= OLDER_MONTHS) groups.push("older-adult");
  if (person.stage?.startsWith("pregnancy") === true) groups.push("pregnant");
  return groups;
}
