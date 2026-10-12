import { useQuery } from "@tanstack/react-query";
import { catalog } from "~/catalog/browser";
import type { CourseOption } from "~/types/course";

/** The fewest characters worth sending to the catalog. */
export const MIN_SEARCH_LENGTH = 2;

/** How many results one search asks for (the catalog caps it at 50). */
export const SEARCH_LIMIT = 20;

/**
 * Full-text search over the term's courses. The catalog does the matching
 * (course codes with or without the space, title words, quoted phrases), so
 * this only trims, skips a query too short to mean anything, and reshapes.
 */
export function useCourseSearch(
  query: string,
  academicPeriod: number | null | undefined,
) {
  const q = query.trim();
  return useQuery<CourseOption[]>({
    queryKey: ["catalog", "search", academicPeriod, q],
    enabled: academicPeriod != null && q.length >= MIN_SEARCH_LENGTH,
    queryFn: async ({ signal }) => {
      const { results } = await catalog.searchCourses(
        { term: academicPeriod!, q, limit: SEARCH_LIMIT },
        { signal },
      );
      return results.map((course) => ({
        courseId: course.courseId,
        abbr: course.abbr,
        courseNumber: course.courseNumber,
        title: course.title,
        maxCreditHours: course.maxCreditHours,
      }));
    },
    staleTime: 60_000,
  });
}
