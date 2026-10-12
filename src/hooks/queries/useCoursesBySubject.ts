import { useQuery } from "@tanstack/react-query";
import { catalog } from "~/catalog/browser";
import type { CourseOption } from "~/types/course";

/** Courses in a subject with a section on offer in the given term. */
export function useCoursesBySubject(
  subjectAbbr: string | undefined,
  academicPeriod: number | null | undefined,
) {
  return useQuery<CourseOption[]>({
    queryKey: ["catalog", "courses-by-subject", subjectAbbr, academicPeriod],
    enabled: subjectAbbr != null && academicPeriod != null,
    queryFn: async () => {
      const { courses } = await catalog.listSubjectCourses({
        abbr: subjectAbbr!,
        term: academicPeriod!,
      });
      return courses.map((course) => ({
        courseId: course.courseId,
        abbr: course.abbr,
        courseNumber: course.courseNumber,
        title: course.title,
        maxCreditHours: course.maxCreditHours,
      }));
    },
  });
}
