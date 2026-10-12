import { useQuery } from "@tanstack/react-query";
import { catalog } from "~/catalog/browser";

export interface CatalogTerm {
  academicPeriod: number;
  description: string;
  /** The last day to add or drop in each part of the term; registration is open while any is still ahead. */
  dropAddEnds: string[];
}

/** Every term the catalog has sections for, newest first. */
export async function fetchTerms(): Promise<CatalogTerm[]> {
  const { terms } = await catalog.listTerms();
  return terms.map((term) => ({
    academicPeriod: term.academicPeriod,
    description: term.description,
    dropAddEnds: term.partsOfTerm.map((part) => part.dropAddEnds),
  }));
}

/** The terms in the catalog. Changes once a semester, so it is never refetched. */
export function useTerms(initialData?: CatalogTerm[]) {
  return useQuery<CatalogTerm[]>({
    queryKey: ["catalog", "terms"],
    queryFn: fetchTerms,
    initialData:
      initialData && initialData.length > 0 ? initialData : undefined,
    staleTime: Infinity,
  });
}
