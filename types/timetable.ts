export interface ClassData {
  course: string;
  time: string;
  room: string;
}

export interface TimetableEntry {
  day: string;
  class_data: ClassData[];
}

export interface CourseInfo {
  name: string;
  days: string[];
  totalClasses: number;
  classesPerDay: number[];
  absences: number;
}
