"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";

const Holidays: React.FC<{
  holidays: Date[];
  // setHolidays: React.Dispatch<React.SetStateAction<Date[]>>;
}> = (props) => {
  const { holidays/*, setHolidays */} = props;
  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>University Holidays</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {holidays.map((holiday, index) => (
            <li key={index} className="p-2 border rounded-md">
              {holiday.toDateString()}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};

export default Holidays;
