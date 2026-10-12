import { useQuery } from "@tanstack/react-query";
import { catalog } from "~/catalog/browser";
import type { SectionRow } from "~/types/course";

/** Every section of one course in the given term, cancelled ones included, by CRN. */
export function useSectionsByCourse(
  courseId: number,
  academicPeriod: number | undefined,
) {
  return useQuery<SectionRow[]>({
    queryKey: ["catalog", "sections-by-course", courseId, academicPeriod],
    enabled: !!academicPeriod,
    queryFn: async ({ signal }) => {
      const { sections } = await catalog.listSections(
        { term: academicPeriod!, courseIds: String(courseId) },
        { signal },
      );
      return sections
        .map((section) => ({
          crn: section.crn,
          professor: section.professor?.name ?? null,
          seatsAvailable: section.seatsAvailable,
          cancelled: section.cancelled,
        }))
        .sort((a, b) => a.crn - b.crn);
    },
  });
}
