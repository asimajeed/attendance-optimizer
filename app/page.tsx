"use client";

import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { parseISO, eachDayOfInterval } from "date-fns";
import { CourseInfo } from "@/types/timetable";
import { fetchTimetable } from "@/lib/api/timetable";
import { ImSpinner } from "react-icons/im";
import { dayToNum } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import Holidays from "@/components/Holidays";
import { CheckedState } from "@radix-ui/react-checkbox";

export default function Home() {
  const [userSearch, setUserSearch] = useState("");
  const [courses, setCourses] = useState<CourseInfo[]>([]);
  const [selectedDates, setSelectedDate] = useState<Date[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [matchFlex, setMatchFlex] = useState<CheckedState>();
  const [data, setData] = useState({
    start: "2025-01-20",
    end: "2025-05-16",
    search: [] as string[],
  });
  const [holidays, setHolidays] = useState<Date[]>([
    new Date("2025-2-05"),
    new Date("2025-2-18"),
    new Date("2025-2-19"),
    new Date("2025-2-24"),
    new Date("2025-2-25"),
    new Date("2025-2-26"),
    new Date("2025-4-1"),
    new Date("2025-4-2"),
    new Date("2025-4-6"),
    new Date("2025-4-7"),
    new Date("2025-4-8"),
    new Date("2025-4-9"),
    new Date("2025-5-1"),
    new Date("2025-6-6"),
    new Date("2025-6-7"),
    new Date("2025-6-8"),
  ]);
  const [presentDates, setPresentDates] = useState<Date[]>([]);
  const [allDates, setAllDates] = useState<Date[]>([]);
  useEffect(() => {
    const cachedData = localStorage.getItem("attendanceCache");
    if (cachedData) {
      const parsedData = JSON.parse(cachedData);
      if (parsedData.data) setData(parsedData.data);
      if (parsedData.holidays)
        setHolidays(parsedData.holidays.map((d: string) => new Date(d)));
      if (parsedData.courses) setCourses(parsedData.courses);
      if (parsedData.selectedDates)
        setSelectedDate(
          parsedData.selectedDates.map((d: string) => new Date(d))
        );
      if (parsedData.presentDates)
        setPresentDates(
          parsedData.presentDates.map((d: string) => new Date(d))
        );
      if (parsedData.allDates)
        setAllDates(parsedData.allDates.map((d: string) => new Date(d)));
      if (parsedData.matchFlex !== undefined)
        setMatchFlex(parsedData.matchFlex);
    }
  }, []);

  useEffect(() => {
    const stateToCache = {
      data,
      holidays: holidays.map((d) => d.toISOString()),
      courses,
      selectedDates: selectedDates.map((d) => d.toISOString()),
      presentDates: presentDates.map((d) => d.toISOString()),
      allDates: allDates.map((d) => d.toISOString()),
      matchFlex,
    };
    localStorage.setItem("attendanceCache", JSON.stringify(stateToCache));
  }, [
    data,
    holidays,
    courses,
    selectedDates,
    presentDates,
    allDates,
    matchFlex,
  ]);
  useEffect(() => {
    // When selectedDates or allDates change, recalc absences for each course.
    setCourses((prevCourses) =>
      prevCourses.map((course) => {
        const newAbsences = selectedDates.reduce((total, date) => {
          const isValidDate = allDates.some(
            (d) => d.toDateString() === date.toDateString()
          );
          if (isValidDate) {
            const classesThatDay = course.classesPerDay[date.getDay()] || 0;
            return total + classesThatDay;
          }
          return total;
        }, 0);
        return { ...course, absences: newAbsences };
      })
    );
  }, [selectedDates, allDates]);

  const getCourseMap = async () => {
    setLoadingCourses(true);
    const parsedCourses = await fetchTimetable(data.search);
    if (typeof parsedCourses == "string") console.error(parsedCourses);
    else {
      const temp = [] as string[];
      parsedCourses.forEach((course) => {
        course.days.forEach((day) => {
          if (!temp.includes(day)) temp.push(day);
        });
      });
      const temp2 = temp.map((str) => dayToNum(str));
      console.log(
        eachDayOfInterval({
          start: parseISO(data.start),
          end: new Date(),
        }).filter((date) => {
          return (
            !holidays.some(
              (holiday) => holiday.toDateString() === date.toDateString()
            ) && temp2.some((dayNum) => dayNum === date.getDay())
          );
        })
      );
      setPresentDates(
        eachDayOfInterval({
          start: parseISO(data.start),
          end: new Date(),
        }).filter((date) => {
          return (
            !holidays.some(
              (holiday) => holiday.toDateString() === date.toDateString()
            ) && temp2.some((dayNum) => dayNum === date.getDay())
          );
        })
      );
      const tempAllDates = eachDayOfInterval({
        start: parseISO(data.start),
        end: parseISO(data.end),
      }).filter((date) => {
        return (
          !holidays.some(
            (holiday) => holiday.toDateString() === date.toDateString()
          ) && temp2.some((dayNum) => dayNum === date.getDay())
        );
      });
      setAllDates(tempAllDates);

      parsedCourses.forEach((course) => {
        course.totalClasses = tempAllDates.reduce((sum, date) => {
          return sum + course.classesPerDay[date.getDay()];
        }, 0);
      });
      setCourses(parsedCourses);
    }
    setLoadingCourses(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await getCourseMap();
  };

  const updateAbsences = (courseName: string, increment: boolean) => {
    setCourses(
      courses.map((course) => {
        if (course.name === courseName) {
          const newAbsences = increment
            ? course.absences + 1
            : Math.max(0, course.absences - 1);
          return { ...course, absences: newAbsences };
        }
        return course;
      })
    );
  };
  const updateTotal = (courseName: string, increment: boolean) => {
    setCourses(
      courses.map((course) => {
        if (course.name === courseName) {
          const newTotal = increment
            ? course.totalClasses + 1
            : Math.max(
                0,
                course.totalClasses - 1 >= course.absences
                  ? course.totalClasses - 1
                  : course.totalClasses
              );
          return { ...course, totalClasses: newTotal };
        }
        return course;
      })
    );
  };
  const calculateAttendance = (course: CourseInfo, present: boolean = true) => {
    let classesHeld = present
      ? presentDates.reduce((prev, date) => {
          const classes = course.classesPerDay[date.getDay()];
          return prev + classes;
        }, 0)
      : course.totalClasses;
    if (present && matchFlex)
      classesHeld += course.classesPerDay.reduce(
        (prev, curr) => prev + curr,
        0
      );
    const percentage = ((classesHeld - course.absences) / classesHeld) * 100;

    return percentage.toFixed(1);
  };

  const isClassDay = (date: Date) => {
    const isoString = date.toISOString();

    return (
      !selectedDates.some((d) => d.toISOString() === isoString) &&
      allDates.some((d) => d.toISOString() === isoString)
    );
  };

  return (
    <div className="flex flex-col items-center p-4 gap-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="p-4">
          <CardTitle>Optimize Your Attendance</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap justify-center items-center gap-2 px-0">
          <Calendar
            weekStartsOn={1}
            mode="multiple"
            selected={selectedDates}
            onSelect={
              setSelectedDate as Dispatch<SetStateAction<Date[] | undefined>>
            }
            fromDate={parseISO(data.start)}
            toDate={parseISO(data.end)}
            modifiers={{
              classDay: (date) => isClassDay(date),
            }}
            modifiersStyles={{
              classDay: {
                background: "rgba(255,255,0,0.33)",
                margin: "0px",
                paddingTop: "1rem",
                paddingBottom: "1rem",
              },
              selected: {
                background: "rgba(255,40,40,0.5)",
                color: "white",
              },
            }}
            className="rounded-md border w-fit"
          />
          {courses.length > 0 && (
            <div className="flex gap-2 justify-center w-full max-w-96">
              <Card className="w-1/2">
                <CardHeader className="p-4">
                  <CardTitle>Current Attendance</CardTitle>
                </CardHeader>
                <CardContent className="p-2 pt-0">
                  {courses.map((course) => {
                    const myAttendance = Number(calculateAttendance(course));
                    const names = course.name.split("\n")[0].split(" ");
                    const name = `${names[0]}${
                      names[1].toLowerCase().includes("lab") ? " Lab" : ""
                    }`;
                    return (
                      <div
                        key={course.name}
                        className="flex justify-between items-center px-2 py-0 border rounded-lg gap-4"
                      >
                        <p>{name}</p>
                        <p
                          className="font-medium"
                          style={{
                            color: myAttendance < 80 ? "rgb(245,120,20)" : "",
                          }}
                        >
                          {myAttendance}%
                        </p>
                      </div>
                    );
                  })}
                  <div className="p-0 pt-4 flex justify-center items-center">
                    <Checkbox
                      className="size-4 mr-2"
                      checked={matchFlex}
                      onCheckedChange={setMatchFlex}
                    />
                    <Label> Match flex (+1 Week)</Label>
                  </div>
                </CardContent>
              </Card>
              <Card className="w-1/2">
                <CardHeader className="p-4">
                  <CardTitle>End Attendance</CardTitle>
                </CardHeader>
                <CardContent className="p-2 pt-0">
                  {courses.map((course) => {
                    const myAttendance = Number(
                      calculateAttendance(course, false)
                    );
                    const names = course.name.split("\n")[0].split(" ");
                    const name = `${names[0]}${
                      names[1].toLowerCase().includes("lab") ? " Lab" : ""
                    }`;
                    return (
                      <div
                        key={course.name}
                        className="flex justify-between items-center px-2 py-0 border rounded-lg gap-4"
                      >
                        <p>{name}</p>
                        <p
                          className="font-medium"
                          style={{
                            color: myAttendance < 80 ? "rgb(245,120,20)" : "",
                          }}
                        >
                          {myAttendance}%
                        </p>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
      <Card className="w-full max-w-2xl">
        <CardContent className="pb-0 pt-2">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="start">Start Date</Label>
              <Input
                type="date"
                id="start"
                name="start"
                value={data.start}
                onChange={(e) => setData({ ...data, start: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end">End Date</Label>
              <Input
                type="date"
                id="end"
                name="end"
                value={data.end}
                onChange={(e) => setData({ ...data, end: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Search Terms</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. BCS-6G"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                />
                <Button
                  type="button"
                  onClick={() => {
                    if (userSearch) {
                      setData({
                        ...data,
                        search: [...data.search, userSearch],
                      });
                      setUserSearch("");
                    }
                  }}
                >
                  Add
                </Button>
              </div>
              <div className="flex justify-center gap-2">
                {data.search.map((term, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gray-100 rounded-md text-background select-none cursor-pointer"
                    onClick={() => {
                      setData((prevData) => ({
                        ...prevData,
                        search: prevData.search.filter((_, i) => i !== index),
                      }));
                    }}
                  >
                    {term}
                  </span>
                ))}
              </div>
            </div>
            <Button type="submit" className="w-full">
              Load Courses From Timetable
            </Button>
            <div className="flex justify-center">
              {loadingCourses && (
                <ImSpinner className="animate-spin" size={40} />
              )}
            </div>
          </form>
        </CardContent>
      </Card>
      {courses.length > 0 && (
        <Card className="w-full max-w-2xl">
          <CardContent className="space-y-4 p-4">
            <div className="flex justify-end pr-2">
              <div className="w-52 flex justify-center">
                <p className="text-center w-full">Absents</p>
                <p className="text-center w-full">Total</p>
              </div>
            </div>
            {courses.map((course) => (
              <div
                key={course.name}
                className="flex justify-between items-center p-2 border rounded-lg"
              >
                <div className="min-w-10">
                  <h3 className="font-medium">{course.name.split("\n")[0]}</h3>
                  <p className="text-sm text-gray-500">
                    {course.days.join(", ")}
                  </p>
                </div>
                <div className="flex justify-end gap-4 w-52">
                  <div className="flex justify-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateAbsences(course.name, false)}
                    >
                      -
                    </Button>
                    <span className="w-3 flex items-center">
                      {course.absences}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateAbsences(course.name, true)}
                    >
                      +
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateTotal(course.name, false)}
                    >
                      -
                    </Button>
                    <span className="w-3 flex items-center">
                      {course.totalClasses}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateTotal(course.name, true)}
                    >
                      +
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      <Holidays
        holidays={holidays}
        //  setHolidays={setHolidays}
      />
    </div>
  );
}
