import { useQuery } from "@tanstack/react-query";
import { catalog } from "~/catalog/browser";
import { fetchCatalogSections } from "~/lib/domain/catalogSections";

export interface CourseInfo {
  abbr: string;
  courseNumber: string;
  title: string;
}

/**
 * Names for course ids. A member's saved draft holds only catalog course ids
 * (the catalog is not in their database), and the catalog looks a course up by
 * code, not by id; its section list names the course, so that is what this
 * asks. A course with no section in the term has no name here and comes back
 * missing from the map.
 */
export function useCourseInfos(
  courseIds: readonly number[],
  academicPeriod: number | null | undefined,
) {
  const ids = [...new Set(courseIds)].sort((a, b) => a - b);
  return useQuery<Map<number, CourseInfo>>({
    queryKey: ["catalog", "course-infos", academicPeriod, ids],
    enabled: academicPeriod != null && ids.length > 0,
    queryFn: async ({ signal }) => {
      const sections = await fetchCatalogSections(
        catalog,
        academicPeriod!,
        { courseIds: ids },
        { signal },
      );
      const infos = new Map<number, CourseInfo>();
      for (const section of sections) {
        if (infos.has(section.courseId)) continue;
        infos.set(section.courseId, {
          abbr: section.courseAbbr,
          courseNumber: section.courseNumber,
          title: section.courseTitle,
        });
      }
      return infos;
    },
    staleTime: 5 * 60_000,
  });
}
