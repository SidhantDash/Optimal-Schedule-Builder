// ─── Display types (used by WeekSchedule / DayClass) ─────────────────────────

/**
 * Flat display record expected by DayClass and WeekSchedule.
 * Computed by toWeekSchedule() in src/lib/schedule-display.ts from the
 * Section domain model.
 */
export interface ClassData {
  classTitle: string;
  className: string;
  description: string;
  locationLong: string;
  locationShort: string;
  professor: string;

  credits: number;
  crn: number;
  openSeats: number;
  maxSeats: number;
  waitlist: number;

  bgColor: string;
  borderColor: string;

  timeStart: string;
  timeEnd: string;
  timeDifference: number | null;

  currentDay: string;
}

export type DaySchedule = Record<string, ClassData[]>;
export type WeekSchedule = Record<string, ClassData[]>;
