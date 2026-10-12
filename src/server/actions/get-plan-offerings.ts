"use server";

import { catalog } from "~/catalog/browser";
import { loadSections } from "~/lib/domain/catalogSections";
import { toWeekSchedule } from "~/lib/schedule-display";
import { type WeekSchedule } from "~/types/scheduleTypes";

/**
 * The week a saved plan lays out. The catalog has no lookup by CRN, so the
 * plan names the courses it came from (`courseIds`) and the sections are read
 * for those courses and cut down to the plan's CRNs.
 */
export async function getPlanOfferings(
  academicPeriod: number,
  crns: number[],
  courseIds: number[],
): Promise<WeekSchedule> {
  if (!crns.length || !courseIds.length) return {};

  const wanted = new Set(crns);
  const sections = (
    await loadSections(catalog, academicPeriod, { courseIds })
  ).filter((section) => wanted.has(section.crn));

  return toWeekSchedule(sections);
}
