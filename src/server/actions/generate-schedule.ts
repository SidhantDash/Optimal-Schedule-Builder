"use server";

import { catalog } from "~/catalog/browser";
import { loadSections } from "~/lib/domain/catalogSections";
import type { GenerationConstraints } from "~/lib/generation/constraints";
import {
  generateSchedules,
  MAX_INPUT_COURSES,
  type GenerationOutcome,
} from "~/lib/generation/engine";
import { diagnoseNoSchedules } from "~/lib/generation/diagnose";
import {
  filterUsableSections,
  groupSectionsByCourse,
} from "~/lib/generation/prepareCourses";

export interface GenerateScheduleParams {
  academicPeriod: number;
  /** Qualified course abbreviations, e.g. ["CSCI1302", "MATH2250"] */
  inputCourseNumbers: string[];
  excludedSectionCrns: number[];
  /** "HH:MM", the earliest acceptable start time; omit for no lower bound. */
  prefStartTime?: string;
  /** "HH:MM", the latest acceptable end time; omit for no upper bound. */
  prefEndTime?: string;
  inputCampus: string;
  minCreditHours: number;
  maxCreditHours: number;
  showFilledClasses: boolean;
}

const TIME_OF_DAY = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

/**
 * Server actions are public endpoints, so the "HH:MM" contract documented on
 * the params cannot be trusted. A malformed bound is dropped rather than
 * passed through: string-comparing garbage against meeting times would
 * silently filter out every section.
 */
function toTimeOfDay(t: string | undefined): string | undefined {
  return t !== undefined && TIME_OF_DAY.test(t) ? t : undefined;
}

const FAILURE_MESSAGES: Record<
  Extract<GenerationOutcome, { ok: false }>["reason"],
  string
> = {
  "no-courses":
    "None of the selected courses have sections in this term matching your filters.",
  "too-many-courses": `Generating a schedule is limited to ${MAX_INPUT_COURSES} courses at a time.`,
  "no-schedules":
    "No schedules found matching your criteria — try adjusting your filters or included courses/sections.",
};

export async function getRecommendedSchedules(
  params: GenerateScheduleParams,
): Promise<{ data: number[][]; error?: string }> {
  if (params.inputCourseNumbers.length === 0) {
    return {
      data: [],
      error: "Select at least one course to generate a schedule.",
    };
  }
  if (params.inputCourseNumbers.length > MAX_INPUT_COURSES) {
    return {
      data: [],
      error: `Generating a schedule is limited to ${MAX_INPUT_COURSES} courses at a time — you selected ${params.inputCourseNumbers.length}.`,
    };
  }

  const allSections = await loadSections(catalog, params.academicPeriod, {
    courseAbbrs: params.inputCourseNumbers,
  });

  // `campusOptions` is keyed by the human-readable campus name, which the
  // registrar feed stores as `description`; `abbr` holds the Banner code. The
  // catalog names the campus on every section, so the id comes from there.
  const campusId = allSections.find(
    (section) => section.campus.description === params.inputCampus,
  )?.campus.id;

  // Falling through with an unresolved campus would silently ignore the filter
  // and hand back sections from every campus.
  if (params.inputCampus && campusId === undefined) {
    return {
      data: [],
      error: `No sections found for the ${params.inputCampus} campus.`,
    };
  }

  const usableSections = filterUsableSections(
    allSections,
    params.showFilledClasses,
  );
  const courses = groupSectionsByCourse(usableSections);

  const ctx: GenerationConstraints = {
    excludedCourses: [],
    excludedSections: params.excludedSectionCrns,
    campusId,
    minCreditHours: params.minCreditHours,
    maxCreditHours: params.maxCreditHours,
    showFilledClasses: params.showFilledClasses,
    prefStartTime: toTimeOfDay(params.prefStartTime),
    prefEndTime: toTimeOfDay(params.prefEndTime),
  };

  const outcome = generateSchedules(courses, ctx);
  if (outcome.ok) {
    return {
      data: outcome.schedules.map((schedule) =>
        schedule.map((section) => section.crn),
      ),
    };
  }

  if (outcome.reason === "no-schedules") {
    // The generic message is only the fallback: name the course and the
    // constraint that eliminated it so the user knows what to relax.
    const reasons = diagnoseNoSchedules(courses, ctx);
    if (reasons.length > 0) return { data: [], error: reasons.join(" ") };
  }

  return { data: [], error: FAILURE_MESSAGES[outcome.reason] };
}
