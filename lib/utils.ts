import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
import { CourseInfo } from "@/types/timetable";
import { parseISO, eachDayOfInterval } from "date-fns";

export const getDayOfWeek = (date: Date) => {
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  return days[date.getDay()];
};

export const calculateAttendance = (
  course: CourseInfo,
  startDate: string,
  holidays: Date[]
) => {
  const start = parseISO(startDate);
  const end = new Date();
  const allDates = eachDayOfInterval({ start, end });

  const classDates = allDates.filter((date) => {
    const isHoliday = holidays.some(
      (h) => h.toDateString() === date.toDateString()
    );
    return !isHoliday && course.days.includes(getDayOfWeek(date));
  });

  const classesHeld = classDates.length;
  return classesHeld === 0
    ? 0
    : ((classesHeld - course.absences) / classesHeld) * 100;
};

export const dayToNum = (Day: string) => {
  const daysMap = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
  };
  return daysMap[Day as keyof typeof daysMap];
};
