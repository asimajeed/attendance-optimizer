import { CourseInfo, TimetableEntry, ClassData } from "@/types/timetable";
import axios from "axios";
import { dayToNum, getDayOfWeek } from "../utils";

export const fetchTimetable = async (search: string[]) => {
  try {
    const response = await axios.post(
      "https://imetable-pp-daaimalisheikh5443-a1wcryub.leapcell.dev/timetable?sheetId=1fOKzJfMlgU1ZTrpPhf065Im0pk0sdV87uu73uyJmphw",
      { sections: search }
    );

    const timetableData = response.data.time_table;
    const courseMap = new Map<string, CourseInfo>();
    timetableData.forEach((entry: TimetableEntry) => {
      entry.class_data.forEach((classItem: ClassData) => {
        let currDay = entry.day.trim().toLowerCase();
        currDay = currDay.charAt(0).toUpperCase() + currDay.slice(1);
        const existing = courseMap.get(classItem.course);
        if (!existing) {
          const classesPerDay = new Array<number>(7).fill(0);

          classesPerDay[dayToNum(currDay)] = 1;
          courseMap.set(classItem.course, {
            name: classItem.course,
            days: [currDay],
            totalClasses: 1,
            absences: 0,
            classesPerDay,
          });
        } else {
          const classesPerDay = existing.classesPerDay;

          classesPerDay[dayToNum(currDay)] += 1;
          const newDays = existing.days.includes(currDay)
            ? existing.days
            : [...existing.days, currDay];
          courseMap.set(classItem.course, {
            ...existing,
            days: newDays,
            totalClasses: existing.totalClasses + 1,
            classesPerDay: classesPerDay,
          });
        }
      });
    });

    return Array.from(courseMap.values());
  } catch (error) {
    return `Error ${error}`;
  }
};
