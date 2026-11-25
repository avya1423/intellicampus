import React, { useEffect, useState } from "react";
import { StudentLayout } from "../components/layouts/StudentLayout";
import { TeacherLayout } from "../components/layouts/TeacherLayout";
import { useAuth } from "../auth/AuthContext";
import api from "../api/axios";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";

export const AcademicCalendarPage: React.FC = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    api.get("/calendar").then((res) => setEvents(res.data)).catch(console.error);
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleString("default", { month: "long" });
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const getEventsForDay = (day: number) => {
    return events.filter((ev) => {
      const d = new Date(ev.date);
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
    });
  };

  const isStaff = user?.role === "teacher" || user?.role === "admin";
  const Layout = isStaff ? TeacherLayout : StudentLayout;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <CalendarIcon className="w-6 h-6 text-blue-600" /> Academic Calendar & Holidays
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Official university holidays, examination dates, and academic events published by Administration
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
              className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-4 py-1.5 rounded-lg bg-slate-100 text-sm font-bold text-slate-800 min-w-[140px] text-center">
              {monthName} {year}
            </span>
            <button
              onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
              className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Monthly Calendar Grid */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-500 pb-3 border-b border-slate-100">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2 mt-3">
            {Array.from({ length: firstDay }).map((_, idx) => (
              <div key={`empty-${idx}`} className="h-24 rounded-xl bg-slate-50/50" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1;
              const dayEvents = getEventsForDay(day);
              const isSunday = new Date(year, month, day).getDay() === 0;
              return (
                <div
                  key={day}
                  className={`h-24 p-2 rounded-xl border text-left flex flex-col justify-between overflow-hidden ${
                    dayEvents.length > 0
                      ? "bg-blue-50/40 border-blue-200"
                      : isSunday
                      ? "bg-rose-50/30 border-slate-200"
                      : "bg-white border-slate-200"
                  }`}
                >
                  <span className={`text-xs font-bold ${isSunday ? "text-rose-600" : "text-slate-700"}`}>
                    {day}
                  </span>
                  <div className="space-y-1 overflow-y-auto">
                    {dayEvents.map((ev) => (
                      <div
                        key={ev._id}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold truncate ${
                          ev.type === "Holiday"
                            ? "bg-rose-100 text-rose-800"
                            : ev.type === "Exam"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                        title={ev.title}
                      >
                        {ev.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming Holidays & Events List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/70 font-bold text-slate-900 text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" /> Scheduled Holidays, Exams & Events ({events.length})
          </div>
          <div className="divide-y divide-slate-200">
            {events.map((ev) => (
              <div key={ev._id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{ev.title}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        ev.type === "Holiday"
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : ev.type === "Exam"
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-blue-50 text-blue-700 border border-blue-200"
                      }`}
                    >
                      {ev.type}
                    </span>
                  </div>
                  {ev.description && <p className="text-xs text-slate-500 mt-0.5">{ev.description}</p>}
                </div>
                <span className="text-xs font-semibold text-slate-600">
                  {new Date(ev.date).toLocaleDateString("en-IN", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
            ))}
            {events.length === 0 && (
              <p className="p-6 text-center text-xs text-slate-400">No holidays or academic events published yet.</p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};
