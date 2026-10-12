"use client";

import { useEffect, useRef, useState } from "react";
import { MagnifyingGlassIcon } from "@phosphor-icons/react/ssr";
import { CourseSearchResult } from "~/components/courses/CourseSearchResult";
import { useTerm } from "~/components/providers/TermProvider";
import {
  MIN_SEARCH_LENGTH,
  SEARCH_LIMIT,
  useCourseSearch,
} from "~/hooks/queries/useCourseSearch";
import type { PanelProps } from "~/components/courses/AddCourses";

/** How long to wait after the last keystroke before asking the catalog. */
const DEBOUNCE_MS = 300;

/**
 * Course Search: one box for a course code ("csci 1301", "CSCI1301"), a title
 * word ("calculus") or a phrase ("\"data structures\""). The catalog does the
 * matching; the query lives in the URL (`?q=`), so a search can be shared and
 * survives a refresh.
 */
export function SearchByQuery({ searchParams, setParams }: PanelProps) {
  const { academicPeriod } = useTerm();
  const [inputValue, setInputValue] = useState(
    () => searchParams.get("q") ?? "",
  );
  const [query, setQuery] = useState(() =>
    (searchParams.get("q") ?? "").trim(),
  );
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Mirror the input into the URL and the query (debounced).
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const trimmed = inputValue.trim();
      setQuery(trimmed);
      setParams({ q: trimmed || null });
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [inputValue, setParams]);

  const {
    data: results,
    isFetching,
    error,
  } = useCourseSearch(query, academicPeriod);

  const searching = query.length >= MIN_SEARCH_LENGTH;
  const typing = inputValue.trim() !== query;

  let status: string | null = null;
  if (!searching) {
    status =
      inputValue.trim().length > 0
        ? `Type at least ${MIN_SEARCH_LENGTH} characters.`
        : null;
  } else if (error && !isFetching) {
    status = "Search failed. Please try again.";
  } else if (isFetching || typing) {
    status = "Searching…";
  } else if (results?.length === 0) {
    status = `No courses match “${query}” this term.`;
  } else if ((results?.length ?? 0) >= SEARCH_LIMIT) {
    status = `Showing the first ${SEARCH_LIMIT} matches. Narrow the search to see others.`;
  }

  return (
    <div className="flex flex-col gap-6">
      <label className="grid grid-cols-[7rem_1fr] items-center gap-x-3">
        <span className="font-bold">Search</span>
        <span className="relative">
          <MagnifyingGlassIcon
            weight="bold"
            aria-hidden
            className="text-muted pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
          />
          <input
            type="search"
            autoComplete="off"
            spellCheck={false}
            placeholder="Course code or title, like CSCI 1301 or calculus"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value.slice(0, 80))}
            className="border-edge-strong bg-surface not-disabled:hover:border-muted w-full rounded-md border-2 py-1.5 pr-3 pl-9 transition-[box-shadow,border-color] hover:shadow-sm focus:outline-none"
          />
        </span>
      </label>

      <p
        role={error && !isFetching ? "alert" : "status"}
        aria-live="polite"
        className={`text-sm ${error && !isFetching ? "text-red-700" : "text-muted"} ${status ? "" : "sr-only"}`}
      >
        {status ?? ""}
      </p>

      {searching && !typing && results && results.length > 0 && (
        <ul className="flex flex-col gap-2">
          {results.map((course) => (
            <li key={course.courseId}>
              <CourseSearchResult course={course} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
