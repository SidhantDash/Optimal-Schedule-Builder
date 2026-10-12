import type {
  CatalogClient,
  Section as CatalogSection,
} from "@devdogsuga/sdk/catalog";
import type { Section } from "./section";

/** The catalog answers at most this many courses per `/sections` call. */
export const SECTIONS_PER_REQUEST = 15;

/**
 * The catalog's section, in the domain shape the generator and the display
 * read. The two are close on purpose; what changes is the time the catalog
 * last saw the section (a string over the wire, a `Date` here).
 */
export function toDomainSection(section: CatalogSection): Section {
  return {
    crn: section.crn,
    courseAbbr: section.courseAbbr,
    courseNumber: section.courseNumber,
    courseTitle: section.courseTitle,
    creditHours: section.creditHours,
    campus: section.campus,
    professor: section.professor,
    seatsAvailable: section.seatsAvailable,
    actualEnrollment: section.actualEnrollment,
    maximumEnrollment: section.maximumEnrollment,
    cancelled: section.cancelled,
    lastSeenAt: new Date(section.lastSeenAt),
    academicPeriod: section.academicPeriod,
    dateRange: section.dateRange,
    meetings: section.meetings.map((meeting) => ({
      days: meeting.days,
      startTime: meeting.startTime,
      endTime: meeting.endTime,
      room: meeting.room,
      building: meeting.building,
    })),
  };
}

export type SectionsFilter =
  | { courseAbbrs: readonly string[]; courseIds?: undefined }
  | { courseIds: readonly number[]; courseAbbrs?: undefined };

/**
 * Every section (cancelled ones included) of the named courses in a term, as
 * the catalog returns them. The catalog caps a call at 15 courses, so a longer
 * list goes out as several calls in parallel.
 */
export async function fetchCatalogSections(
  catalog: Pick<CatalogClient, "listSections">,
  academicPeriod: number,
  filter: SectionsFilter,
  options: { signal?: AbortSignal } = {},
): Promise<CatalogSection[]> {
  const keys = filter.courseAbbrs ?? filter.courseIds;
  const requests: Promise<CatalogSection[]>[] = [];
  for (let i = 0; i < keys.length; i += SECTIONS_PER_REQUEST) {
    const chunk = keys.slice(i, i + SECTIONS_PER_REQUEST).join(",");
    requests.push(
      catalog
        .listSections(
          {
            term: academicPeriod,
            ...(filter.courseAbbrs ? { courses: chunk } : { courseIds: chunk }),
          },
          options,
        )
        .then(({ sections }) => sections),
    );
  }
  return (await Promise.all(requests)).flat();
}

/** The same sections in the domain shape the generator and the display read. */
export async function loadSections(
  catalog: Pick<CatalogClient, "listSections">,
  academicPeriod: number,
  filter: SectionsFilter,
  options: { signal?: AbortSignal } = {},
): Promise<Section[]> {
  const sections = await fetchCatalogSections(
    catalog,
    academicPeriod,
    filter,
    options,
  );
  return sections.map(toDomainSection);
}
