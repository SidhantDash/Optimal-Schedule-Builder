/**
 * One section of a course, as the section picker shows it. Taken from the
 * catalog's `Section`, which carries the instructor as one name.
 */
export interface SectionRow {
  crn: number;
  /** The instructor's name, or null for "Staff". */
  professor: string | null;
  seatsAvailable: number;
  cancelled: boolean;
}

/** A course the user can add, identified for the draft-course upsert flow. */
export interface CourseOption {
  courseId: number;
  abbr: string;
  courseNumber: string;
  title: string;
  maxCreditHours: number;
}
