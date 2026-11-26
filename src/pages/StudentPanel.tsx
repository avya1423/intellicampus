import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { StudentLayout } from "../components/layouts/StudentLayout";
import { useAuth } from "../auth/AuthContext";
import api from "../api/axios";
import {
  Send,
  Bot,
  AlertCircle,
  CheckCircle2,
  Printer,
  BarChart3,
  Megaphone,
  ExternalLink,
  BookOpen,
  CalendarCheck,
  Target,
  Clock,
  CalendarDays,
  ArrowRight,
  UserCircle,
} from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

interface SubjectSummary {
  subject: string;
  held: number;
  attended: number;
  missed: number;
  percentage: number;
  neededForTarget: number;
  canSkip: number;
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export const StudentPanel: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [riskData, setRiskData] = useState<any>(null);
  const [attendanceData, setAttendanceData] = useState<{ totalClasses: number; percentage: number; records: any[] }>({
    totalClasses: 0,
    percentage: 0,
    records: [],
  });
  const [marksRecords, setMarksRecords] = useState<any[]>([]);
  const [routineSlots, setRoutineSlots] = useState<any[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);

  // Interactive Attendance Target Goal (60%, 70%, 75%, 80%, 85%)
  const [targetPct, setTargetPct] = useState<number>(75);

  // AI Chatbot state
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<{ sender: "user" | "ai"; text: string }[]>([
    {
      sender: "ai",
      text: "Hi! I'm your IntelliCampus AI Study Advisor. Ask me how to reach your attendance target or prepare for upcoming exams!",
    },
  ]);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    api.get("/users/profile").then((res) => setProfile(res.data)).catch(console.error);
    api.get("/risk/my").then((res) => setRiskData(res.data)).catch(console.error);
    api.get("/attendance/my").then((res) => setAttendanceData(res.data)).catch(console.error);
    api.get("/marks/my").then((res) => setMarksRecords(res.data.records || [])).catch(console.error);
    api.get("/calendar").then((res) => setCalendarEvents(res.data)).catch(console.error);

    if (user?.department) {
      const dept = encodeURIComponent(user.department);
      const sem = user.semester || 1;
      api
        .get(`/routine?department=${dept}&semester=${sem}`)
        .then((res) => setRoutineSlots(res.data))
        .catch(console.error);
      api
        .get(`/notices?department=${dept}&semester=${sem}`)
        .then((res) => setNotices(res.data))
        .catch(console.error);
    }
  }, [user?.department, user?.semester]);

  // Aggregate Held, Attended, Missed
  const totalHeld = attendanceData.totalClasses || 0;
  const totalAttended = attendanceData.records.filter(
    (r) => r.status === "Present" || r.status === "Late"
  ).length;
  const totalMissed = Math.max(0, totalHeld - totalAttended);
  const currentPct = totalHeld > 0 ? Math.round((totalAttended / totalHeld) * 100) : 0;

  const t = Math.min(99, Math.max(1, targetPct)) / 100;

  // Overall Target Calculation
  let overallTargetText =
    "No classes have been held yet this semester. Once faculty marks attendance, your target projection will appear here.";
  let isBelowTarget = false;
  let overallClassesNeeded = 0;

  if (totalHeld > 0) {
    if (currentPct < targetPct) {
      isBelowTarget = true;
      overallClassesNeeded = Math.ceil((t * totalHeld - totalAttended) / (1 - t));
      overallTargetText = `You need to attend ${overallClassesNeeded} more consecutive class${
        overallClassesNeeded > 1 ? "es" : ""
      } to reach your ${targetPct}% target.`;
    } else {
      const canSkip = Math.floor(totalAttended / t - totalHeld);
      overallTargetText =
        canSkip > 0
          ? `Target achieved! You are above ${targetPct}% and can safely miss up to ${canSkip} upcoming class${
              canSkip > 1 ? "es" : ""
            }.`
          : `You are right on the ${targetPct}% border. Attend the next class to stay above target.`;
    }
  }

  // Merge all Current Semester Subjects (from Routine + Attendance + Marks)
  const allSubjectNamesSet = new Set<string>();
  routineSlots.forEach((s) => allSubjectNamesSet.add(s.subject));
  attendanceData.records.forEach((r) => allSubjectNamesSet.add(r.subject));
  marksRecords.forEach((m) => allSubjectNamesSet.add(m.subject));
  const semesterSubjects = Array.from(allSubjectNamesSet);

  // Subject-Wise Held vs Attended vs Target Breakdown
  const subjectBreakdown: SubjectSummary[] = semesterSubjects.map((sub) => {
    const subRecords = attendanceData.records.filter((r) => r.subject === sub);
    const held = subRecords.length;
    const attended = subRecords.filter((r) => r.status === "Present" || r.status === "Late").length;
    const missed = held - attended;
    const percentage = held > 0 ? Math.round((attended / held) * 100) : 0;

    let neededForTarget = 0;
    let canSkip = 0;
    if (held > 0) {
      if (percentage < targetPct) {
        neededForTarget = Math.ceil((t * held - attended) / (1 - t));
      } else {
        canSkip = Math.max(0, Math.floor(attended / t - held));
      }
    }

    return {
      subject: sub,
      held,
      attended,
      missed,
      percentage,
      neededForTarget,
      canSkip,
    };
  });

  // Today's Scheduled Classes from Weekly Routine
  const todayDayName = DAYS[new Date().getDay()];
  const todaysClasses = routineSlots.filter((r) => r.dayOfWeek === todayDayName);

  // Upcoming Calendar Events (Holidays / Exams)
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const upcomingEvents = calendarEvents
    .filter((ev) => new Date(ev.date) >= todayStart)
    .slice(0, 4);

  const chartData = marksRecords.map((m) => ({
    name: `${m.subject} (${m.examType})`,
    score: Math.round((m.score / (m.maxScore || 100)) * 100),
  }));

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const msg = chatInput;
    setChatInput("");
    setChatHistory((prev) => [...prev, { sender: "user", text: msg }]);
    setSending(true);
    try {
      const context = `Subjects: ${semesterSubjects.length}, Held: ${totalHeld}, Attended: ${totalAttended} (${currentPct}%), Target: ${targetPct}%, Avg Marks: ${
        riskData?.avgMarksPct ?? 0
      }%`;
      const { data } = await api.post("/chatbot/ask", { message: msg, context });
      setChatHistory((prev) => [...prev, { sender: "ai", text: data.reply }]);
    } catch {
      setChatHistory((prev) => [...prev, { sender: "ai", text: "Unable to reach AI advisor right now." }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <StudentLayout>
      <div className="space-y-6">
        {/* Top Student & College Banner */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
              {profile?.collegeName || "IntelliCampus Institute of Technology"}
            </p>
            <h1 className="text-2xl font-bold text-slate-900">Welcome, {user?.name}</h1>
            <p className="text-xs sm:text-sm text-slate-500">
              {profile?.program || "B.Tech"} • {user?.department} ({profile?.section || "Section A"}) •{" "}
              <strong>Semester {user?.semester || 1}</strong> • Roll No:{" "}
              <strong>{user?.rollNumber || "N/A"}</strong>
              {profile?.enrollmentNumber ? ` • Enrollment: ${profile.enrollmentNumber}` : ""}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/student/profile"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold border border-blue-200 transition"
            >
              <UserCircle className="w-4 h-4" /> College ID & Profile
            </Link>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition"
            >
              <Printer className="w-4 h-4" /> Print Report
            </button>
          </div>
        </div>

        {/* 4 Core Semester Telemetry KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-indigo-600" /> Semester Subjects
            </p>
            <p className="text-3xl font-extrabold mt-1.5 text-indigo-600">{semesterSubjects.length}</p>
            <p className="text-xs text-slate-500 mt-1">Active in Semester {user?.semester || 1}</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1.5">
              <CalendarCheck className="w-3.5 h-3.5 text-blue-600" /> Classes Held
            </p>
            <p className="text-3xl font-extrabold mt-1.5 text-slate-900">{totalHeld}</p>
            <p className="text-xs text-slate-500 mt-1">Total lectures conducted</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Classes Attended
            </p>
            <p className="text-3xl font-extrabold mt-1.5 text-emerald-600">
              {totalAttended}{" "}
              <span className="text-base font-bold text-slate-400">({currentPct}%)</span>
            </p>
            <p className="text-xs text-slate-500 mt-1">Missed: {totalMissed} lectures</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-amber-600" /> Needed for {targetPct}%
            </p>
            <p className="text-3xl font-extrabold mt-1.5 text-amber-600">
              {isBelowTarget ? `+${overallClassesNeeded}` : "0"}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {isBelowTarget ? "More classes required" : "Target achieved"}
            </p>
          </div>
        </div>

        {/* Interactive Target Simulator & Subject-Wise Held / Attended / Needed Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200 bg-slate-50/70 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-600" /> Semester Attendance & Target Calculator
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select your target percentage to see exact required classes overall and per subject
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {[60, 70, 75, 80, 85].map((goal) => (
                  <button
                    key={goal}
                    type="button"
                    onClick={() => setTargetPct(goal)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      targetPct === goal
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-100"
                    }`}
                  >
                    {goal}% Target
                  </button>
                ))}
              </div>
            </div>

            <div
              className={`p-3.5 rounded-xl text-xs font-semibold flex items-start gap-2 ${
                isBelowTarget
                  ? "bg-amber-50 text-amber-900 border border-amber-200"
                  : "bg-emerald-50 text-emerald-900 border border-emerald-200"
              }`}
            >
              {isBelowTarget ? (
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              )}
              <span>{overallTargetText}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="py-3 px-4 font-semibold">Subject Name</th>
                  <th className="py-3 px-4 font-semibold">Classes Held</th>
                  <th className="py-3 px-4 font-semibold">Attended</th>
                  <th className="py-3 px-4 font-semibold">Missed</th>
                  <th className="py-3 px-4 font-semibold">Current %</th>
                  <th className="py-3 px-4 font-semibold">For {targetPct}% Target</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {subjectBreakdown.map((sub) => (
                  <tr key={sub.subject} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-semibold text-slate-900">{sub.subject}</td>
                    <td className="py-3 px-4 text-slate-700">{sub.held}</td>
                    <td className="py-3 px-4 font-semibold text-emerald-600">{sub.attended}</td>
                    <td className="py-3 px-4 text-rose-600">{sub.missed}</td>
                    <td className="py-3 px-4">
                      {sub.held === 0 ? (
                        <span className="text-xs text-slate-400">No classes yet</span>
                      ) : (
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            sub.percentage < targetPct
                              ? "bg-red-50 text-red-700 border border-red-200"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          }`}
                        >
                          {sub.percentage}%
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs">
                      {sub.held === 0 ? (
                        <span className="text-slate-400">—</span>
                      ) : sub.neededForTarget > 0 ? (
                        <span className="font-bold text-amber-700">
                          Attend next {sub.neededForTarget} class{sub.neededForTarget > 1 ? "es" : ""}
                        </span>
                      ) : (
                        <span className="font-semibold text-emerald-700">
                          On track (Margin: {sub.canSkip})
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {subjectBreakdown.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-xs text-slate-400">
                      No subjects configured yet for {user?.department} Semester {user?.semester || 1}.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="px-5 py-3 bg-slate-50/60 border-t border-slate-200 flex justify-between items-center text-xs">
            <span className="text-slate-500">Marked absent by mistake? Request a correction in Attendance Log.</span>
            <Link
              to="/student/attendance"
              className="font-bold text-blue-600 hover:underline inline-flex items-center gap-1"
            >
              Date-Wise Log & Correction <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Today's Class Schedule + Upcoming Exams & Holidays */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Today's Timetable */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
              <span className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" /> Today's Schedule ({todayDayName})
              </span>
              <span className="text-xs font-semibold text-slate-500">
                {todaysClasses.length} Lecture{todaysClasses.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="divide-y divide-slate-200">
              {todaysClasses.map((slot) => (
                <div key={slot._id} className="p-4 flex items-center justify-between text-sm">
                  <div>
                    <p className="font-bold text-slate-900">{slot.subject}</p>
                    {slot.teacherName && (
                      <p className="text-xs text-slate-500">Faculty: {slot.teacherName}</p>
                    )}
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold">
                    {slot.timeSlot}
                  </span>
                </div>
              ))}
              {todaysClasses.length === 0 && (
                <p className="p-8 text-center text-xs text-slate-400">
                  No routine lectures scheduled for {todayDayName}.
                </p>
              )}
            </div>
          </div>

          {/* Upcoming Holidays & Exams */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
              <span className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-rose-600" /> Upcoming Holidays & Exams
              </span>
              <Link to="/student/calendar" className="text-xs font-semibold text-blue-600 hover:underline">
                Full Calendar
              </Link>
            </div>
            <div className="divide-y divide-slate-200">
              {upcomingEvents.map((ev) => {
                const diffDays = Math.ceil(
                  (new Date(ev.date).getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24)
                );
                return (
                  <div key={ev._id} className="p-4 flex items-center justify-between gap-2 text-sm">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{ev.title}</span>
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
                      <p className="text-xs text-slate-500 mt-0.5">
                        {new Date(ev.date).toLocaleDateString("en-IN", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                      {diffDays === 0 ? "Today" : `In ${diffDays}d`}
                    </span>
                  </div>
                );
              })}
              {upcomingEvents.length === 0 && (
                <p className="p-8 text-center text-xs text-slate-400">
                  No upcoming holidays or exam dates scheduled yet.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Live Faculty Notices & Study Material Links */}
        {notices.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50/70 font-bold text-slate-900 text-sm flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-blue-600" /> Class Announcements & Study Resources
            </div>
            <div className="divide-y divide-slate-200">
              {notices.map((n) => (
                <div key={n._id} className="p-4 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">{n.title}</span>
                    <span className="text-[11px] text-slate-500">
                      Posted by {n.postedBy} • {new Date(n.createdAt).toLocaleDateString("en-IN")}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">{n.message}</p>
                  {n.resourceLink && (
                    <a
                      href={n.resourceLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline pt-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Access Study Material
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Subject-Wise Assessment Performance Chart */}
        {chartData.length > 0 && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-blue-600" /> Assessment Performance Overview (%)
            </h2>
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#475569" }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#475569" }} />
                  <Tooltip />
                  <Bar dataKey="score" fill="#2563eb" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Gemini AI Academic Advisor */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center gap-2 font-semibold text-slate-800">
            <Bot className="w-5 h-5 text-blue-600" /> Gemini AI Academic Advisor
          </div>
          <div className="p-4 h-72 overflow-y-auto space-y-3 bg-white">
            {chatHistory.map((m, idx) => (
              <div
                key={idx}
                className={`max-w-xl px-4 py-2.5 rounded-xl text-sm leading-relaxed ${
                  m.sender === "user"
                    ? "bg-blue-600 text-white ml-auto"
                    : "bg-slate-100 text-slate-800 border border-slate-200/60"
                }`}
              >
                {m.text}
              </div>
            ))}
            {sending && <p className="text-xs text-slate-400">AI is thinking...</p>}
          </div>
          <form onSubmit={handleSend} className="p-3 border-t border-slate-200 bg-slate-50/50 flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask about study strategy, attendance recovery, or exam prep..."
              className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={sending}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1.5 text-sm font-medium shadow-sm"
            >
              <Send className="w-4 h-4" /> Send
            </button>
          </form>
        </div>
      </div>
    </StudentLayout>
  );
};
