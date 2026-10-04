"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useTheme } from "@/components/theme-provider";

type Props = {
  grades: { name: string; students: number; courses: number }[];
  courses: { name: string; students: number }[];
  attendance: { name: string; value: number }[];
};

export function AnalyticsCharts({ grades, courses, attendance }: Props) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const gridColor = isDark ? "#3f3f46" : "#e4e4e7";
  const axisColor = isDark ? "#a1a1aa" : "#52525b";

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Enrollments per Course</CardTitle>
          <CardDescription>Number of students enrolled in each course</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={courses}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: axisColor }} />
                <YAxis tick={{ fontSize: 11, fill: axisColor }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="students" name="Students" fill="#990000" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Students & Courses by Grade</CardTitle>
          <CardDescription>Distribution across grades</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={grades}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: axisColor }} />
                <YAxis tick={{ fontSize: 11, fill: axisColor }} allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="students" name="Students" fill="#4338ca" radius={[4, 4, 0, 0]} />
                <Bar dataKey="courses" name="Courses" fill="#0f766e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Attendance Breakdown</CardTitle>
          <CardDescription>All attendance records across courses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={attendance}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry: { name?: string; value?: number }) => `${entry.name}: ${entry.value}`}
                >
                  {attendance.map((_, i) => (
                    <Cell key={i} fill={i === 0 ? "#16a34a" : i === 1 ? "#dc2626" : "#f59e0b"} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
