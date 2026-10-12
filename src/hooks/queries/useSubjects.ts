import { useQuery } from "@tanstack/react-query";
import { catalog } from "~/catalog/browser";

export interface Subject {
  abbr: string;
  description: string;
}

/** Every subject with a course on offer in the term, ordered by abbreviation. */
export function useSubjects(academicPeriod: number | null | undefined) {
  return useQuery<Subject[]>({
    queryKey: ["catalog", "subjects", academicPeriod],
    enabled: academicPeriod != null,
    queryFn: async () => {
      const { subjects } = await catalog.listSubjects({
        term: academicPeriod!,
      });
      return subjects.map(({ abbr, description }) => ({ abbr, description }));
    },
  });
}
