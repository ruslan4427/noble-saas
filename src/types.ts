export interface DaySchedule {
  day_of_week: number
  is_day_off:  boolean
  work_start:  string | null
  work_end:    string | null
  break_start: string | null
  break_end:   string | null
}
